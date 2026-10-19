#!/usr/bin/env python3
import json
import time
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DOC_ID = '17Qb6xzkxLl98-xYmzPwvNeVweNYReEZAjACyuLYSqk4'
BASE_URL = 'https://oecd-classified-studying-postposted.trycloudflare.com/screenshots'

IMAGES = [
    {
        'tag': '[[IMG_ALUR]]',
        'url': f'{BASE_URL}/alur-sistem.png',
        'width': 460,
        'height': 312,
        'caption': 'Gambar 3.1 Flowchart Alur Sistem dan Integrasi Layanan BalasWA'
    },
    {
        'tag': '[[IMG_01]]',
        'url': f'{BASE_URL}/01_landing.png',
        'width': 460,
        'height': 258,
        'caption': 'Gambar 3.2 Antarmuka Halaman Utama (Landing Page) BalasWA'
    },
    {
        'tag': '[[IMG_02]]',
        'url': f'{BASE_URL}/02_register.png',
        'width': 460,
        'height': 258,
        'caption': 'Gambar 3.3 Formulir Pendaftaran Akun Usaha dan Aktivasi Trial BalasWA'
    },
    {
        'tag': '[[IMG_03]]',
        'url': f'{BASE_URL}/03_login.png',
        'width': 460,
        'height': 258,
        'caption': 'Gambar 3.4 Antarmuka Masuk Akun (Login) Pengguna BalasWA'
    },
    {
        'tag': '[[IMG_04]]',
        'url': f'{BASE_URL}/04_dashboard_wa.png',
        'width': 460,
        'height': 258,
        'caption': 'Gambar 3.5 Dashboard Manajemen Koneksi WhatsApp dan Konfigurasi Bot'
    },
    {
        'tag': '[[IMG_05]]',
        'url': f'{BASE_URL}/05_profil_usaha.png',
        'width': 460,
        'height': 258,
        'caption': 'Gambar 3.6 Antarmuka Pengaturan Profil dan Basis Informasi Bisnis'
    },
    {
        'tag': '[[IMG_06]]',
        'url': f'{BASE_URL}/06_produk_stok.png',
        'width': 460,
        'height': 258,
        'caption': 'Gambar 3.7 Antarmuka Pengelolaan Katalog dan Ketersediaan Stok Produk'
    },
    {
        'tag': '[[IMG_07]]',
        'url': f'{BASE_URL}/07_riwayat_chat.png',
        'width': 460,
        'height': 258,
        'caption': 'Gambar 3.8 Antarmuka Pemantauan Riwayat Percakapan dan Log Balasan AI'
    }
]

SECTION_TEXT = """A. Alur Sistem dan Arsitektur Layanan (Flowchart)

[[IMG_ALUR]]
Gambar 3.1 Flowchart Alur Sistem dan Integrasi Layanan BalasWA

Arsitektur operasional BalasWA memadukan lima entitas utama untuk menjamin ketepatan serta kecepatan respon chat bisnis tanpa risiko halusinasi informasi:
1. Pelanggan (WhatsApp): Mengirimkan pesan pertanyaan terkait ketersediaan stok, spesifikasi produk, harga, lokasi toko, maupun jam buka usaha.
2. WhatsApp Engine (Chromium): Menjalankan instance WhatsApp Web headless secara terisolasi untuk mendeteksi pesan masuk, memfilter pesan grup, status, atau broadcast, serta mengabaikan pesan non-bisnis guna menjaga kuota dan privasi.
3. Logika Bisnis & Context Builder: Mengevaluasi balasan instan untuk format salam awal atau pesanan rutin tanpa memanggil kecerdasan buatan, sekaligus merangkai konteks data profil usaha, katalog produk aktif, stok riil, dan enam riwayat obrolan terakhir.
4. AI Gateway (9Router API): Memproses inferensi menggunakan model cx/gpt-5.6-terra untuk merumuskan balasan yang santun, ringkas, dan sepenuhnya berbasis data faktual toko.
5. Pemilik Usaha & SQLite Database: Mengelola data profil usaha, penambahan produk, pembaruan stok realtime, pemantauan riwayat obrolan, dan status kuota melalui dashboard web.

Gambaran Visual Draf MVP (Mockup & Simulasi)

B. Antarmuka Web Dashboard dan Aplikasi BalasWA

Implementasi prototipe antarmuka BalasWA telah selesai dibangun dan dapat diakses secara publik melalui jaringan terenkripsi HTTPS (Cloudflare Tunnel). Berikut merupakan dokumentasi visual dari setiap modul fungsional aplikasi:

1. Halaman Utama (Landing Page)
[[IMG_01]]
Gambar 3.2 Antarmuka Halaman Utama (Landing Page) BalasWA
Halaman depan menyajikan proposisi nilai utama bagi pelaku UMKM, penjelasan cara kerja dalam tiga tahap ringkas, perbandingan paket layanan berlangganan, serta jawaban atas pertanyaan umum pelanggan.

2. Halaman Pendaftaran Akun (Register)
[[IMG_02]]
Gambar 3.3 Formulir Pendaftaran Akun Usaha dan Aktivasi Trial BalasWA
Formulir pendaftaran dirancang sederhana dan langsung mengaktifkan kuota uji coba (trial) gratis selama 7 hari (100 balasan AI) tanpa mewajibkan input informasi kartu kredit.

3. Halaman Masuk Akun (Login)
[[IMG_03]]
Gambar 3.4 Antarmuka Masuk Akun (Login) Pengguna BalasWA
Pintu masuk autentikasi bagi pemilik usaha dengan enkripsi sandi bcrypt dan manajemen sesi aman berbasis session cookie pada SQLite store.

4. Dashboard WhatsApp dan Bot
[[IMG_04]]
Gambar 3.5 Dashboard Manajemen Koneksi WhatsApp dan Konfigurasi Bot
Pusat kendali operasional bot yang memuat pemindaian QR Code WhatsApp Web, sakelar on/off respon bot, kustomisasi instruksi gaya bahasa admin, serta pemantauan pemakaian kuota chat.

5. Pengaturan Profil Usaha
[[IMG_05]]
Gambar 3.6 Antarmuka Pengaturan Profil dan Basis Informasi Bisnis
Formulir master data identitas usaha yang menjadi basis pengetahuan bot, mencakup jam buka harian, nomor kontak darurat admin manusia, tautan Google Maps, rekening perbankan/QRIS, dan aturan kurir pengiriman.

6. Manajemen Katalog Produk dan Stok
[[IMG_06]]
Gambar 3.7 Antarmuka Pengelolaan Katalog dan Ketersediaan Stok Produk
Tabel manajemen inventaris produk yang terhubung secara realtime dengan mesin respon AI. Jika stok bernilai nol, bot secara otomatis menolak pemesanan dan menginformasikan bahwa produk sedang habis.

7. Riwayat Percakapan (Chat Logs)
[[IMG_07]]
Gambar 3.8 Antarmuka Pemantauan Riwayat Percakapan dan Log Balasan AI
Modul transparansi percakapan yang menampilkan seluruh rekaman chat masuk dari pelanggan beserta respon otomatis yang dihasilkan bot untuk keperluan audit kualitas layanan.

C. Simulasi Percakapan WhatsApp dan Respon Bot

Pengujian balasan otomatis bot telah divalidasi menggunakan skenario pertanyaan pelanggan nyata berdasarkan katalog produk yang tersimpan:
Pelanggan: "Kaka, untuk baju gamis pink ready stok ukuran L dan harganya berapa?"
BalasWA (Bot AI): "Halo! Untuk Gamis Pink ukuran L saat ini READY ya. Harganya Rp 125.000. Apakah ada yang ingin ditanyakan lagi?"
"""

def main():
    creds = Credentials.from_authorized_user_file('/Users/kurniawanrizki/.hermes/google_token.json')
    docs_service = build('docs', 'v1', credentials=creds)

    print('Fetching current document...')
    doc = docs_service.documents().get(documentId=DOC_ID).execute()
    content = doc.get('body', {}).get('content', [])

    # Find the table end index and Deliverable 4 start index
    deliv3_start = None
    table_end = None
    deliv4_start = None

    for i, el in enumerate(content):
        if 'paragraph' in el:
            t = ''.join([e.get('textRun', {}).get('content', '') for e in el['paragraph'].get('elements', [])])
            if 'Deliverable 3' in t:
                deliv3_start = el.get('startIndex')
            elif 'Deliverable 4' in t:
                deliv4_start = el.get('startIndex')
                break
        if deliv3_start and 'table' in el:
            table_end = el.get('endIndex')

    print(f'Table end index: {table_end}, Deliverable 4 start index: {deliv4_start}')
    if not table_end or not deliv4_start:
        raise Exception('Could not locate boundaries!')

    # Step 1: Delete content between table and Deliverable 4
    # Note: leave 1 character or newline boundary safe
    del_range = {'startIndex': table_end, 'endIndex': deliv4_start}
    print(f'Deleting old section range {del_range}...')
    docs_service.documents().batchUpdate(documentId=DOC_ID, body={
        'requests': [{'deleteContentRange': {'range': del_range}}]
    }).execute()

    time.sleep(1)

    # Step 2: Insert new text at table_end
    print(f'Inserting structured text at index {table_end}...')
    docs_service.documents().batchUpdate(documentId=DOC_ID, body={
        'requests': [{
            'insertText': {
                'location': {'index': table_end},
                'text': '\n' + SECTION_TEXT + '\n'
            }
        }]
    }).execute()

    time.sleep(1)

    # Step 3: Insert images into each tag placeholder
    for img_info in IMAGES:
        tag = img_info['tag']
        print(f'Locating tag {tag}...')
        d = docs_service.documents().get(documentId=DOC_ID).execute()
        body_content = d.get('body', {}).get('content', [])
        
        found = False
        for el in body_content:
            if 'paragraph' in el:
                for pe in el['paragraph'].get('elements', []):
                    txt = pe.get('textRun', {}).get('content', '')
                    if tag in txt:
                        st = pe.get('startIndex')
                        tag_idx = txt.find(tag)
                        exact_start = st + tag_idx
                        exact_end = exact_start + len(tag)
                        print(f'Found {tag} at [{exact_start}:{exact_end}], inserting image...')
                        
                        # Delete tag then insert inline image
                        reqs = [
                            {'deleteContentRange': {'range': {'startIndex': exact_start, 'endIndex': exact_end}}},
                            {
                                'insertInlineImage': {
                                    'location': {'index': exact_start},
                                    'uri': img_info['url'],
                                    'objectSize': {
                                        'width': {'magnitude': img_info['width'], 'unit': 'PT'},
                                        'height': {'magnitude': img_info['height'], 'unit': 'PT'}
                                    }
                                }
                            }
                        ]
                        docs_service.documents().batchUpdate(documentId=DOC_ID, body={'requests': reqs}).execute()
                        found = True
                        break
            if found:
                break
        time.sleep(1)

    # Step 4: Styling pass across the newly inserted section
    print('Applying typographic styles (Times New Roman, headings, captions)...')
    d = docs_service.documents().get(documentId=DOC_ID).execute()
    body_content = d.get('body', {}).get('content', [])

    style_reqs = []
    for el in body_content:
        st = el.get('startIndex')
        en = el.get('endIndex')
        if not st or not en or st < table_end:
            continue
        if 'paragraph' in el:
            t = ''.join([e.get('textRun', {}).get('content', '') for e in el['paragraph'].get('elements', [])]).strip()
            if 'Deliverable 4' in t:
                break

            # General paragraph font: Times New Roman
            style_reqs.append({
                'updateTextStyle': {
                    'range': {'startIndex': st, 'endIndex': en},
                    'textStyle': {
                        'weightedFontFamily': {'fontFamily': 'Times New Roman'},
                        'fontSize': {'magnitude': 12, 'unit': 'PT'},
                        'foregroundColor': {'color': {'rgbColor': {'red': 0.1, 'green': 0.1, 'blue': 0.1}}}
                    },
                    'fields': 'weightedFontFamily,fontSize,foregroundColor'
                }
            })

            # Check special lines
            if t == 'Gambaran Visual Draf MVP (Mockup & Simulasi)':
                style_reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'HEADING_2',
                            'spaceAbove': {'magnitude': 16, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 6, 'unit': 'PT'},
                            'keepWithNext': True
                        },
                        'fields': 'namedStyleType,spaceAbove,spaceBelow,keepWithNext'
                    }
                })
                style_reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {'bold': True, 'fontSize': {'magnitude': 14, 'unit': 'PT'}},
                        'fields': 'bold,fontSize'
                    }
                })
            elif t.startswith('A. ') or t.startswith('B. ') or t.startswith('C. '):
                style_reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'HEADING_3',
                            'spaceAbove': {'magnitude': 14, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 6, 'unit': 'PT'},
                            'keepWithNext': True
                        },
                        'fields': 'namedStyleType,spaceAbove,spaceBelow,keepWithNext'
                    }
                })
                style_reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {'bold': True, 'fontSize': {'magnitude': 13, 'unit': 'PT'}},
                        'fields': 'bold,fontSize'
                    }
                })
            elif any(t.startswith(f'{i}. Halaman ') or t.startswith(f'{i}. Dashboard ') or t.startswith(f'{i}. Pengaturan ') or t.startswith(f'{i}. Manajemen ') or t.startswith(f'{i}. Riwayat ') for i in range(1, 8)):
                style_reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'spaceAbove': {'magnitude': 12, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 4, 'unit': 'PT'},
                            'keepWithNext': True
                        },
                        'fields': 'spaceAbove,spaceBelow,keepWithNext'
                    }
                })
                style_reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {'bold': True, 'fontSize': {'magnitude': 12, 'unit': 'PT'}},
                        'fields': 'bold'
                    }
                })
            elif t.startswith('Gambar 3.'):
                # Image caption: italic, 10.5 pt, centered, tight spacing
                style_reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'alignment': 'CENTER',
                            'spaceAbove': {'magnitude': 4, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 10, 'unit': 'PT'}
                        },
                        'fields': 'alignment,spaceAbove,spaceBelow'
                    }
                })
                style_reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {
                            'italic': True,
                            'fontSize': {'magnitude': 10.5, 'unit': 'PT'},
                            'foregroundColor': {'color': {'rgbColor': {'red': 0.35, 'green': 0.35, 'blue': 0.35}}}
                        },
                        'fields': 'italic,fontSize,foregroundColor'
                    }
                })
            elif any(el.get('paragraph', {}).get('elements', [{}])[0].get('inlineObjectElement') for _ in [1]):
                # Paragraph containing the inline image itself -> Center alignment
                style_reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'alignment': 'CENTER',
                            'spaceAbove': {'magnitude': 8, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 2, 'unit': 'PT'}
                        },
                        'fields': 'alignment,spaceAbove,spaceBelow'
                    }
                })
            elif t.startswith('Pelanggan:') or t.startswith('BalasWA (Bot AI):'):
                style_reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'alignment': 'START',
                            'spaceAbove': {'magnitude': 3, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 3, 'unit': 'PT'},
                            'indentStart': {'magnitude': 18, 'unit': 'PT'}
                        },
                        'fields': 'alignment,spaceAbove,spaceBelow,indentStart'
                    }
                })
            else:
                # Standard explanatory body paragraph: justified
                style_reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'alignment': 'JUSTIFIED',
                            'lineSpacing': 115,
                            'spaceAbove': {'magnitude': 2, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 6, 'unit': 'PT'}
                        },
                        'fields': 'alignment,lineSpacing,spaceAbove,spaceBelow'
                    }
                })

    if style_reqs:
        print(f'Sending {len(style_reqs)} styling updates...')
        docs_service.documents().batchUpdate(documentId=DOC_ID, body={'requests': style_reqs}).execute()

    print('All document updates and image insertions completed successfully!')

if __name__ == '__main__':
    main()
