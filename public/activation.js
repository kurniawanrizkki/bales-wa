(() => {
  const STEPS = [
    { key: 'profile', title: 'Lengkapi profil usaha', detail: 'Nama, jam buka, lokasi, pembayaran, dan pengiriman.', href: '/app/profile', action: 'Isi profil usaha' },
    { key: 'products', title: 'Tambahkan produk', detail: 'Masukkan minimal satu produk beserta harga dan stok.', href: '/app/products', action: 'Tambah produk' },
    { key: 'whatsapp', title: 'Hubungkan WhatsApp', detail: 'Scan QR dari nomor WhatsApp bisnis yang akan melayani pelanggan.', href: '/app?connect=1', action: 'Hubungkan WhatsApp' }
  ];

  function renderActivation({ profile, products = [], wa }) {
    const root = document.querySelector('#activation');
    if (!root) return;
    // ponytail: Aktivasi hanya dipusatkan di Profil Usaha; buat wizard lintas halaman bila onboarding bertambah.
    if (location.pathname !== '/app/profile') {
      root.classList.remove('show');
      root.innerHTML = '';
      return;
    }

    const done = {
      profile: Boolean(profile?.business_name),
      products: products.some(product => product.is_active),
      whatsapp: wa?.status === 'READY'
    };
    const completed = Object.values(done).filter(Boolean).length;
    const next = STEPS.find(step => !done[step.key]);

    if (!next) {
      root.classList.remove('show');
      return;
    }

    root.innerHTML = `<div class="modal activation-modal" role="dialog" aria-modal="true" aria-labelledby="activation-title">
      <div class="activation-progress"><span>AKTIVASI ${completed}/3</span><div><i style="width:${completed / 3 * 100}%"></i></div></div>
      <h2 id="activation-title">Siapkan BalasWA sampai aktif</h2>
      <p>Ikuti tahap berikut secara berurutan. Data yang sudah selesai tidak perlu diisi ulang.</p>
      <div class="activation-steps">${STEPS.map((step, index) => `
        <a class="activation-step ${done[step.key] ? 'done' : step.key === next.key ? 'current' : ''}" href="${step.href}">
          <b>${done[step.key] ? '✓' : index + 1}</b>
          <span><strong>${step.title}</strong><small>${step.detail}</small></span>
          <em>${done[step.key] ? 'Selesai' : step.key === next.key ? 'Berikutnya' : 'Menunggu'}</em>
        </a>`).join('')}</div>
      <div class="activation-note">Bot mulai membalas setelah ketiga tahap selesai.</div>
      <div class="modal-actions"><button class="btn activation-later" type="button">Lanjut nanti</button><a class="btn primary activation-next" href="${next.href}">${next.action}</a></div>
    </div>`;
    root.classList.add('show');
    root.querySelector('.activation-later').onclick = () => root.classList.remove('show');
  }

  window.renderActivation = renderActivation;
})();
