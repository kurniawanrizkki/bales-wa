const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('node:path');
const { UserModel, BusinessModel, ProductModel, LogModel, ContactModel } = require('./db');
const { generateAIReply } = require('./ai');
const { buildBusinessContext } = require('./business');

// In-memory active sessions: userId -> { client, status, qrDataUrl, isReady, lastError, historyMap }
const sessions = new Map();

const BUSINESS_TERMS = /\b(hai|halo|permisi|kak|min|admin|produk|barang|harga|stok|ready|tersedia|pesan|order|beli|bayar|transfer|rekening|alamat|lokasi|buka|tutup|jam|kirim|ongkir|kurir|resi|warna|ukuran|menu|layanan|servis|booking|jadwal|promo|diskon|refund|komplain)\b/i;
const STOP_WORDS = new Set(['yang', 'dan', 'atau', 'untuk', 'dengan', 'dari', 'ini', 'itu', 'anda', 'kamu', 'kami', 'toko', 'usaha', 'aturan', 'respon', 'gunakan']);

function isBusinessRelevant(message, systemPrompt, hasHistory = false) {
  if (hasHistory || BUSINESS_TERMS.test(message)) return true;

  const promptTerms = new Set((systemPrompt || '')
    .toLowerCase()
    .match(/[a-z0-9]{4,}/g) || []);
  for (const term of (message.toLowerCase().match(/[a-z0-9]{4,}/g) || [])) {
    if (!STOP_WORDS.has(term) && promptTerms.has(term)) return true;
  }
  return false;
}

function getInstantBusinessReply(message) {
  if (/\b(mau|ingin|boleh|bisa)?\s*(pesan|order|beli)\b/i.test(message)) {
    return 'Hai Kak, tentu bisa. Mau pesan produk apa dan berapa jumlahnya?';
  }
  if (/^\s*(hai|halo|hi|pagi|siang|sore|malam)(\s+(kak|min|admin))?[!.,\s]*$/i.test(message)) {
    return 'Hai Kak. Ada yang bisa kami bantu terkait produk atau pemesanan?';
  }
  return null;
}

function getExecutablePath() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  return undefined;
}

function getSessionState(userId) {
  const session = sessions.get(userId);
  if (!session) {
    return {
      status: 'DISCONNECTED',
      qrCode: null,
      isReady: false,
      lastError: null
    };
  }
  return {
    status: session.status,
    qrCode: session.qrDataUrl,
    isReady: session.isReady,
    lastError: session.lastError
  };
}

async function startSession(userId) {
  if (sessions.has(userId)) {
    const existing = sessions.get(userId);
    if (existing.status === 'READY' || existing.status === 'QR_READY' || existing.status === 'STARTING') {
      return getSessionState(userId);
    }
    // If error or disconnected, destroy existing first
    try {
      await existing.client.destroy();
    } catch (_) {}
    sessions.delete(userId);
  }

  const sessionObj = {
    client: null,
    status: 'STARTING',
    qrDataUrl: null,
    isReady: false,
    lastError: null,
    historyMap: new Map(), // senderNumber -> [{role, content}]
    processedMsgs: new Set()
  };
  sessions.set(userId, sessionObj);

  const authDir = path.join(__dirname, '../.wwebjs_auth');
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: `user_${userId}`,
      dataPath: authDir
    }),
    puppeteer: {
      headless: true,
      executablePath: getExecutablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  sessionObj.client = client;

  client.on('qr', async (qr) => {
    try {
      console.log(`[User ${userId}] QR Code baru digenerate`);
      const dataUrl = await qrcode.toDataURL(qr);
      sessionObj.qrDataUrl = dataUrl;
      sessionObj.status = 'QR_READY';
      sessionObj.lastError = null;
    } catch (err) {
      sessionObj.lastError = 'Gagal membuat QR Code';
    }
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`[User ${userId}] Loading WhatsApp: ${percent}% - ${message}`);
  });

  client.on('authenticated', () => {
    console.log(`[User ${userId}] WhatsApp Terautentikasi (Authenticated)`);
    sessionObj.status = 'AUTHENTICATED';
  });

  client.on('ready', () => {
    console.log(`[User ${userId}] WhatsApp SIAP & TERHUBUNG (Ready)! Siap membalas.`);
    sessionObj.status = 'READY';
    sessionObj.isReady = true;
    sessionObj.qrDataUrl = null;
    sessionObj.lastError = null;
  });

  client.on('auth_failure', (msg) => {
    console.error(`[User ${userId}] Autentikasi WA gagal:`, msg);
    sessionObj.status = 'ERROR';
    sessionObj.lastError = `Autentikasi WA gagal: ${msg}`;
    sessionObj.isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.warn(`[User ${userId}] Koneksi WA terputus:`, reason);
    sessionObj.status = 'DISCONNECTED';
    sessionObj.isReady = false;
    sessionObj.qrDataUrl = null;
    sessionObj.lastError = `Koneksi terputus: ${reason}`;
  });

  // Message handler for auto reply (using message_create to catch all incoming messages reliably)
  const handleIncomingMessage = async (msg) => {
    try {
      const msgId = msg.id?._serialized || msg.id?.id;
      if (!msgId || sessionObj.processedMsgs.has(msgId)) return;
      sessionObj.processedMsgs.add(msgId);
      if (sessionObj.processedMsgs.size > 2000) {
        const first = sessionObj.processedMsgs.values().next().value;
        sessionObj.processedMsgs.delete(first);
      }

      console.log(`[User ${userId}] Event pesan diterima dari: ${msg.from} (fromMe: ${msg.fromMe}) | Isi: "${msg.body}"`);

      // Ignore group chats, broadcast/status, and self messages
      if (msg.fromMe) {
        console.log(`[User ${userId}] Skip: Pesan dari diri sendiri (fromMe)`);
        return;
      }
      if (msg.from.endsWith('@g.us')) {
        console.log(`[User ${userId}] Skip: Pesan dari grup WhatsApp`);
        return;
      }
      if (msg.from.includes('status') || msg.from.includes('broadcast')) {
        console.log(`[User ${userId}] Skip: Status/Broadcast`);
        return;
      }
      if (!msg.body || typeof msg.body !== 'string' || !msg.body.trim()) return;

      const user = UserModel.findById(userId);
      if (!user || !UserModel.canUseBot(userId)) {
        console.log(`[User ${userId}] Skip: Bot nonaktif, trial habis, atau kuota habis`);
        return;
      }

      const profile = BusinessModel.get(userId);
      const products = ProductModel.list(userId);
      if (!profile?.business_name) {
        console.log(`[User ${userId}] Skip: Profil usaha belum dilengkapi`);
        return;
      }

      const senderNumber = msg.from.replace(/@c\.us$/, '');
      const incomingText = msg.body.trim();

      // Upsert contact to list
      ContactModel.upsert(userId, senderNumber, { lastMessage: incomingText });

      // Cek apakah pemilik mematikan AI untuk kontak ini (mode manual admin)
      if (!ContactModel.isAiActiveForContact(userId, senderNumber)) {
        console.log(`[User ${userId}] AI dimatikan untuk kontak ${senderNumber}. Mode manual admin.`);
        LogModel.add(userId, senderNumber, incomingText, '[Mode Manual: AI Tidak Mengambil Alih]');
        return;
      }

      // Retrieve recent conversation history
      let history = sessionObj.historyMap.get(senderNumber) || [];
      const businessContext = buildBusinessContext(profile, products);

      // Abaikan pesan di luar konteks usaha tanpa membaca lewat AI atau membalas.
      if (!isBusinessRelevant(incomingText, `${businessContext}\n${user.system_prompt}`, history.length > 0)) {
        console.log(`[User ${userId}] Skip: Pesan di luar konteks usaha dari ${senderNumber}`);
        return;
      }

      // Mode uji hanya mencatat penerimaan. Tidak mengirim status ke pelanggan.
      if (process.env.WA_RECEIVE_TEST_MODE === 'true') {
        console.log(`[User ${userId}] UJI TERIMA BERHASIL dari ${senderNumber}: "${incomingText}"`);
        return;
      }

      // Pertanyaan umum dengan jawaban pasti tidak perlu menunggu AI.
      const instantReply = getInstantBusinessReply(incomingText);
      if (instantReply) {
        await msg.reply(instantReply);
        LogModel.add(userId, senderNumber, incomingText, instantReply);
        history.push({ role: 'user', content: incomingText }, { role: 'assistant', content: instantReply });
        sessionObj.historyMap.set(senderNumber, history.slice(-6));
        console.log(`[User ${userId}] BERHASIL membalas instan ${senderNumber}!`);
        return;
      }

      const activeModel = user.ai_model || process.env.ROUTER9_DEFAULT_MODEL || 'cx/gpt-5.6-terra';
      console.log(`[User ${userId}] Meminta jawaban AI (${activeModel}) untuk ${senderNumber}...`);
      // Call 9Router
      const reply = await generateAIReply({
        apiKey: user.router9_api_key || process.env.ROUTER9_API_KEY,
        baseUrl: user.router9_base_url || process.env.ROUTER9_BASE_URL,
        model: activeModel,
        systemPrompt: `${businessContext}\n\nINSTRUKSI TAMBAHAN PEMILIK:\n${user.system_prompt}`,
        userMessage: incomingText,
        conversationHistory: history
      });
      console.log(`[User ${userId}] 9Router menjawab: "${reply}"`);

      // Update history in memory (keep last 6 entries)
      history.push({ role: 'user', content: incomingText });
      history.push({ role: 'assistant', content: reply });
      if (history.length > 6) {
        history = history.slice(-6);
      }
      sessionObj.historyMap.set(senderNumber, history);

      // Send reply
      await msg.reply(reply);
      console.log(`[User ${userId}] BERHASIL membalas pesan ${senderNumber}!`);

      // Save log into database
      LogModel.add(userId, senderNumber, incomingText, reply);
      UserModel.incrementUsage(userId);
    } catch (err) {
      console.error(`[User ${userId}] Error auto-reply:`, err.message);
    }
  };

  client.on('message', handleIncomingMessage);
  client.on('message_create', handleIncomingMessage);

  client.initialize().catch((err) => {
    sessionObj.status = 'ERROR';
    sessionObj.lastError = `Gagal inisialisasi browser WA: ${err.message}`;
    sessionObj.isReady = false;
  });

  return getSessionState(userId);
}

async function stopSession(userId) {
  const session = sessions.get(userId);
  if (!session) return;
  try {
    if (session.client) {
      await session.client.destroy();
    }
  } catch (_) {}
  sessions.delete(userId);
}

module.exports = {
  startSession,
  stopSession,
  getSessionState,
  isBusinessRelevant,
  getInstantBusinessReply
};
