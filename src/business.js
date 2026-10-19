function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function buildBusinessContext(profile, products) {
  if (!profile) return '';
  const activeProducts = products.filter(product => product.is_active);
  const catalog = activeProducts.length
    ? activeProducts.map(product => [
      `- ${product.name}`,
      product.sku ? `SKU ${product.sku}` : '',
      product.category,
      rupiah(product.price),
      product.stock > 0 ? `stok ${product.stock} ${product.unit}` : 'HABIS',
      product.description
    ].filter(Boolean).join(' | ')).join('\n')
    : '- Belum ada produk aktif.';

  return `DATA BISNIS RESMI (jangan mengarang di luar data ini):
Nama usaha: ${profile.business_name}
Kategori: ${profile.category || '-'}
Deskripsi: ${profile.description || '-'}
Nomor admin: ${profile.admin_phone || '-'}
Alamat: ${profile.address || '-'}
Google Maps: ${profile.maps_url || '-'}
Jam operasional: ${profile.operating_hours || '-'}
Metode pembayaran: ${profile.payment_methods || '-'}
Pengiriman/pengambilan: ${profile.shipping_policy || '-'}

KATALOG AKTIF:
${catalog}

ATURAN WAJIB:
- Produk bertanda HABIS tidak boleh dinyatakan tersedia.
- Jangan mengarang harga, stok, lokasi, rekening, kebijakan, atau varian.
- Jika informasi tidak tersedia, arahkan pelanggan ke admin ${profile.admin_phone || 'manusia'}.
- Jangan mengonfirmasi pembayaran atau pesanan selesai tanpa verifikasi admin.`;
}

module.exports = { buildBusinessContext, rupiah };
