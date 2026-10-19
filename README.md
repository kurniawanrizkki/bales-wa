# WA Bot Auto-Reply UMKM (WhatsApp Web.js + 9Router AI)

Platform web auto-reply WhatsApp berbasis AI untuk pelaku UMKM. UMKM dapat mendaftar, login via web, scan QR Code WhatsApp di browser, dan mengatur instruksi balasan bot toko secara mandiri.

## Fitur Utama
1. **Multi-Tenant Web UI**:
   - Register & Login akun toko UMKM.
   - Sesi autentikasi aman dengan session cookies & bcrypt.
2. **Koneksi WhatsApp Web Mandiri**:
   - Scan QR Code langsung di dashboard web (tanpa akses terminal).
   - Indikator status real-time (Belum Terhubung, Scan QR, Aktif).
   - Simpan sesi persisten per akun (`LocalAuth`).
3. **Instruksi Toko (System Prompt Dinamis)**:
   - Template siap pakai untuk Kuliner, Olshop/Fashion, dan Jasa/Servis.
   - Kolom instruksi bebas: profil toko, jam operasional, katalog harga, info transfer rekening, eskalasi ke kontak admin manusia.
   - Toggle on/off bot otomatis tanpa memutus koneksi WhatsApp.
4. **Integrasi 9Router AI**:
   - Kompatibel dengan OpenAI format via HTTP API.
   - Dukungan pilihan model (default `openai/gpt-4o-mini`).
   - Riwayat percakapan singkat (multi-turn context) otomatis per nomor pelanggan.
5. **Log Aktivitas**:
   - Riwayat chat masuk dan balasan bot tersimpan di SQLite lokal.

## Persyaratan
- Node.js v18+ (Disarankan v20+ atau v26+)
- Google Chrome atau Chromium terpasang

## Panduan Instalasi & Menjalankan

1. Salin file environment:
```bash
cp .env.example .env
```

2. Konfigurasi `.env`:
```env
PORT=3000
SESSION_SECRET=buat_string_rahasia_acak
ROUTER9_API_KEY=key_9router_anda
ROUTER9_BASE_URL=https://api.9router.com/v1
ROUTER9_DEFAULT_MODEL=openai/gpt-4o-mini
```

3. Jalankan server:
```bash
npm start
```

4. Akses via browser:
Buka `http://localhost:3000`
- Daftar akun baru di `/register.html`
- Masuk ke `/dashboard.html`
- Klik **Hubungkan WhatsApp**, scan QR Code dari aplikasi WhatsApp HP (Menu > Perangkat Tertaut > Tautkan Perangkat).
- Masukkan instruksi toko Anda dan klik **Simpan Pengaturan**.
