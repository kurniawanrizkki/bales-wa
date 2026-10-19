# PRD — BalasWA UMKM

## 1. Ringkasan
BalasWA adalah SaaS auto-reply WhatsApp untuk UMKM. Pemilik usaha mendaftar, mengisi profil usaha dan katalog produk, menautkan WhatsApp melalui QR, lalu bot menjawab pertanyaan pelanggan berdasarkan data bisnis nyata—bukan jawaban umum.

## 2. Tujuan
- Membalas pertanyaan produk, stok, harga, lokasi, jam buka, pengiriman, dan pemesanan.
- Mengabaikan percakapan pribadi atau pesan di luar konteks usaha.
- Memungkinkan pemilik usaha memperbarui stok dan informasi tanpa mengubah kode.
- Memberi uji coba 7 hari tanpa kartu kredit sebelum berlangganan.

## 3. Pengguna
- Pemilik/pengelola UMKM kuliner, fesyen, toko daring, jasa, dan toko fisik.
- Pelanggan yang menghubungi nomor WhatsApp bisnis.

## 4. Proposisi Nilai
“WhatsApp bisnis yang tahu produk, stok, harga, dan lokasi usaha Anda.”

## 5. Alur Utama
1. Pengunjung membuka landing page.
2. Klik “Coba gratis 7 hari”.
3. Daftar memakai email dan password.
4. Isi nama usaha, kategori, alamat, lokasi Google Maps, jam buka, nomor admin, metode pembayaran, dan kebijakan pengiriman.
5. Tambah produk: nama, SKU, kategori, deskripsi, harga, stok, satuan, status aktif.
6. Tautkan WhatsApp melalui QR.
7. Bot hanya merespons pesan bisnis relevan memakai data usaha terbaru.
8. Pemilik memantau riwayat balasan dan memperbarui stok.
9. Hari ke-7: pilih paket. Jika tidak membayar, auto-reply berhenti; data tetap tersimpan selama 30 hari.

## 6. Fitur MVP

### 6.1 Landing Page
- Hero dengan pesan manfaat dan cuplikan produk.
- Penjelasan alur 3 langkah.
- Fitur: katalog, stok, konteks usaha, sambungan WhatsApp, log chat.
- Harga transparan.
- FAQ dan CTA uji coba.
- Tautan masuk untuk pengguna lama.

### 6.2 Akun dan Trial
- Daftar, masuk, keluar.
- Trial otomatis 7×24 jam sejak registrasi.
- Tampilan sisa hari trial.
- Status: `trialing`, `active`, `expired`, `cancelled`.
- Auto-reply hanya aktif pada `trialing` yang belum habis atau `active`.

### 6.3 Profil Bisnis
- Nama usaha.
- Kategori usaha.
- Deskripsi singkat.
- Nomor admin.
- Alamat lengkap.
- Tautan Google Maps.
- Jam operasional.
- Metode pembayaran.
- Kebijakan pengiriman/pengambilan.
- Instruksi tambahan bot.

### 6.4 Katalog dan Stok
- Tambah, ubah, nonaktifkan, hapus produk.
- Data: nama, SKU, kategori, deskripsi, harga, stok, satuan, status aktif.
- Stok `0` berarti habis; bot tidak boleh menyatakan tersedia.
- Perubahan stok langsung dipakai untuk chat berikutnya.
- MVP: stok diperbarui manual. Pengurangan stok otomatis ditunda sampai alur pesanan terverifikasi tersedia.

### 6.5 Auto-Reply
- Memproses chat personal masuk.
- Mengabaikan grup, status, broadcast, pesan sendiri, media tanpa teks, dan pesan di luar konteks usaha.
- Salam dan pertanyaan umum dapat dibalas instan.
- Pertanyaan data bisnis dikirim ke model AI bersama profil dan katalog terbaru.
- Bot dilarang mengarang harga, stok, lokasi, rekening, atau kebijakan.
- Jika data tidak tersedia, bot meminta admin menindaklanjuti.

### 6.6 Dashboard
- Status WhatsApp dan QR.
- Status trial/langganan.
- Form profil bisnis.
- Daftar produk dan stok.
- Pengaturan instruksi bot.
- Riwayat chat dan balasan.

## 7. Harga

### Uji Coba — Gratis 7 Hari
- 1 nomor WhatsApp.
- Maksimal 100 balasan AI selama trial.
- Semua fitur inti.
- Tanpa kartu kredit.

### Starter — Rp99.000/bulan
- 1 nomor WhatsApp.
- Maksimal 3.000 balasan AI/bulan.
- 100 produk.
- Riwayat chat 30 hari.
- Dukungan email/WhatsApp pada jam kerja.

### Tumbuh — Rp199.000/bulan
- 2 nomor WhatsApp.
- Maksimal 10.000 balasan AI/bulan.
- Produk tanpa batas wajar.
- Riwayat chat 90 hari.
- Prioritas dukungan.

Harga mengutamakan biaya server, Chromium per sesi, pemeliharaan, dan dukungan. Biaya DeepSeek relatif kecil; batas balasan menjaga penyalahgunaan dan kapasitas layanan. Harga perlu dievaluasi setelah 20 pelanggan berbayar dan data pemakaian nyata tersedia.

## 8. Integrasi AI
- Penyedia target produksi: DeepSeek API, format OpenAI-compatible.
- Base URL: `https://api.deepseek.com`.
- Model default produksi: model chat/flash non-reasoning yang tersedia saat peluncuran.
- API key disimpan di server, bukan diminta dari setiap UMKM.
- Riwayat dibatasi agar biaya dan latensi terkendali.
- Data produk aktif dan profil usaha disusun menjadi konteks terstruktur setiap permintaan.

## 9. Aturan Jawaban
- Jawaban singkat, ramah, Bahasa Indonesia.
- Hanya menyebut fakta dari profil dan katalog.
- Produk stok 0 disebut habis.
- Pesan di luar konteks tidak dibalas.
- Bot tidak mengonfirmasi pembayaran atau pesanan selesai tanpa verifikasi admin.
- Keluhan, refund, bukti transfer, kondisi darurat, atau permintaan manusia dieskalasikan ke admin.

## 10. Data Minimum
- `users`: akun, trial, paket, status langganan.
- `business_profiles`: identitas dan operasi usaha.
- `products`: katalog dan stok per pengguna.
- `chat_logs`: pesan masuk, jawaban, waktu.
- Tahap lanjut: `subscriptions`, `usage_monthly`, `orders`, `payments`.

## 11. Kebutuhan Nonfungsional
- Password memakai bcrypt.
- Session cookie `httpOnly`, `sameSite=lax`, `secure` pada produksi.
- API key hanya dari environment/secret manager.
- Validasi input dan kepemilikan data pada semua API.
- Backup SQLite harian untuk MVP; pindah PostgreSQL saat multi-instance.
- Batasi laju chat per nomor dan antrekan permintaan AI.
- Landing page responsif, fokus keyboard terlihat, target sentuh minimal 44 px.

## 12. Metrik Keberhasilan
- Persentase pengguna yang menyelesaikan profil dan menautkan WhatsApp.
- Waktu dari daftar sampai balasan pertama.
- Persentase pesan bisnis yang terjawab.
- Persentase pesan di luar konteks yang berhasil diabaikan.
- Konversi trial ke berbayar.
- Biaya AI dan infrastruktur per akun aktif.

## 13. Di Luar MVP
- Broadcast/promosi massal.
- Pengurangan stok otomatis tanpa pesanan terverifikasi.
- Payment gateway dan invoice otomatis.
- Banyak staf dengan hak akses berbeda.
- Integrasi marketplace/POS.
- Aplikasi mobile native.

## 14. Risiko
- `whatsapp-web.js` bukan API resmi; sesi dapat putus atau berubah mengikuti WhatsApp Web.
- Setiap sesi memakai Chromium dan memerlukan RAM signifikan.
- Akun dapat dibatasi bila perilaku dianggap otomatis/spam.
- Harga dan model DeepSeek dapat berubah; gunakan konfigurasi model dan pemantauan biaya.

## 15. Tahapan Rilis
1. Landing page, trial, profil bisnis, katalog/stok.
2. Konteks AI dari data bisnis dan pembatasan trial.
3. Pembayaran langganan, kuota bulanan, pengingat trial.
4. Pesanan terstruktur dan pengurangan stok terverifikasi.
