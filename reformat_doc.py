#!/usr/bin/env python3
import json
import time
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DOC_ID = '17Qb6xzkxLl98-xYmzPwvNeVweNYReEZAjACyuLYSqk4'
BASE_URL = 'https://oecd-classified-studying-postposted.trycloudflare.com/screenshots'

# Image metadata
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

# We build clean text with NO unnecessary blank paragraphs
# Paragraphs separated by single \n
PARAS = [
    ('NORMAL_TEXT', 'Bentuk MVP: Layanan Digital berbasis Web App & Otomasi AI (Software-as-a-Service).', {'bold': True}),
    ('HEADING_2', 'Structure Framework Service Blueprint (Sistem BalasWA)', {}),
    # [TABLE IS KEPT HERE]
    ('HEADING_3', 'A. Alur Sistem dan Integrasi Layanan (Flowchart)', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_ALUR]]', {}),
    ('CAPTION', 'Gambar 3.1 Flowchart Alur Sistem dan Integrasi Layanan BalasWA', {}),
    ('BODY', 'Arsitektur operasional BalasWA memadukan lima entitas utama untuk menjamin ketepatan serta kecepatan respon chat bisnis tanpa risiko halusinasi informasi:', {}),
    ('BODY', '1. Pelanggan (WhatsApp): Mengirimkan pesan pertanyaan terkait ketersediaan stok, spesifikasi produk, harga, lokasi toko, maupun jam buka usaha.', {}),
    ('BODY', '2. WhatsApp Engine (Chromium): Menjalankan instance WhatsApp Web headless secara terisolasi untuk mendeteksi pesan masuk, memfilter pesan grup, status, atau broadcast, serta mengabaikan pesan non-bisnis guna menjaga kuota dan privasi.', {}),
    ('BODY', '3. Logika Bisnis & Context Builder: Mengevaluasi balasan instan untuk format salam awal atau pesanan rutin tanpa memanggil kecerdasan buatan, sekaligus merangkai konteks data profil usaha, katalog produk aktif, stok riil, dan enam riwayat obrolan terakhir.', {}),
    ('BODY', '4. AI Gateway (9Router API): Memproses inferensi menggunakan model cx/gpt-5.6-terra untuk merumuskan balasan yang santun, ringkas, dan sepenuhnya berbasis data faktual toko.', {}),
    ('BODY', '5. Pemilik Usaha & SQLite Database: Mengelola data profil usaha, penambahan produk, pembaruan stok realtime, pemantauan riwayat obrolan, dan status kuota melalui dashboard web.', {}),
    ('HEADING_2', 'Gambaran Visual Draf MVP (Mockup & Simulasi)', {}),
    ('HEADING_3', 'B. Antarmuka Web Dashboard dan Aplikasi BalasWA', {}),
    ('BODY', 'Implementasi prototipe antarmuka BalasWA telah selesai dibangun dan dapat diakses secara publik melalui jaringan terenkripsi HTTPS (Cloudflare Tunnel). Berikut merupakan dokumentasi visual dari setiap modul fungsional aplikasi:', {}),
    ('SCREEN_TITLE', '1. Halaman Utama (Landing Page)', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_01]]', {}),
    ('CAPTION', 'Gambar 3.2 Antarmuka Halaman Utama (Landing Page) BalasWA', {}),
    ('BODY', 'Halaman depan menyajikan proposisi nilai utama bagi pelaku UMKM, penjelasan cara kerja dalam tiga tahap ringkas, perbandingan paket layanan berlangganan, serta jawaban atas pertanyaan umum pelanggan.', {}),
    ('SCREEN_TITLE', '2. Halaman Pendaftaran Akun (Register)', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_02]]', {}),
    ('CAPTION', 'Gambar 3.3 Formulir Pendaftaran Akun Usaha dan Aktivasi Trial BalasWA', {}),
    ('BODY', 'Formulir pendaftaran dirancang sederhana dan langsung mengaktifkan kuota uji coba (trial) gratis selama 7 hari (100 balasan AI) tanpa mewajibkan input informasi kartu kredit.', {}),
    ('SCREEN_TITLE', '3. Halaman Masuk Akun (Login)', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_03]]', {}),
    ('CAPTION', 'Gambar 3.4 Antarmuka Masuk Akun (Login) Pengguna BalasWA', {}),
    ('BODY', 'Pintu masuk autentikasi bagi pemilik usaha dengan enkripsi sandi bcrypt dan manajemen sesi aman berbasis session cookie pada SQLite store.', {}),
    ('SCREEN_TITLE', '4. Dashboard WhatsApp dan Bot', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_04]]', {}),
    ('CAPTION', 'Gambar 3.5 Dashboard Manajemen Koneksi WhatsApp dan Konfigurasi Bot', {}),
    ('BODY', 'Pusat kendali operasional bot yang memuat pemindaian QR Code WhatsApp Web, sakelar on/off respon bot, kustomisasi instruksi gaya bahasa admin, serta pemantauan pemakaian kuota chat.', {}),
    ('SCREEN_TITLE', '5. Pengaturan Profil Usaha', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_05]]', {}),
    ('CAPTION', 'Gambar 3.6 Antarmuka Pengaturan Profil dan Basis Informasi Bisnis', {}),
    ('BODY', 'Formulir master data identitas usaha yang menjadi basis pengetahuan bot, mencakup jam buka harian, nomor kontak darurat admin manusia, tautan Google Maps, rekening perbankan/QRIS, dan aturan kurir pengiriman.', {}),
    ('SCREEN_TITLE', '6. Manajemen Katalog Produk dan Stok', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_06]]', {}),
    ('CAPTION', 'Gambar 3.7 Antarmuka Pengelolaan Katalog dan Ketersediaan Stok Produk', {}),
    ('BODY', 'Tabel manajemen inventaris produk yang terhubung secara realtime dengan mesin respon AI. Jika stok bernilai nol, bot secara otomatis menolak pemesanan dan menginformasikan bahwa produk sedang habis.', {}),
    ('SCREEN_TITLE', '7. Riwayat Percakapan (Chat Logs)', {}),
    ('IMAGE_PLACEHOLDER', '[[IMG_07]]', {}),
    ('CAPTION', 'Gambar 3.8 Antarmuka Pemantauan Riwayat Percakapan dan Log Balasan AI', {}),
    ('BODY', 'Modul transparansi percakapan yang menampilkan seluruh rekaman chat masuk dari pelanggan beserta respon otomatis yang dihasilkan bot untuk keperluan audit kualitas layanan.', {}),
    ('HEADING_3', 'C. Simulasi Percakapan WhatsApp dan Respon Bot', {}),
    ('BODY', 'Pengujian balasan otomatis bot telah divalidasi menggunakan skenario pertanyaan pelanggan nyata berdasarkan katalog produk yang tersimpan:', {}),
    ('CHAT_USER', 'Pelanggan: "Kaka, untuk baju gamis pink ready stok ukuran L dan harganya berapa?"', {}),
    ('CHAT_BOT', 'BalasWA (Bot AI): "Halo! Untuk Gamis Pink ukuran L saat ini READY ya. Harganya Rp 125.000. Apakah ada yang ingin ditanyakan lagi?"', {})
]

def main():
    creds = Credentials.from_authorized_user_file('/Users/kurniawanrizki/.hermes/google_token.json')
    docs_service = build('docs', 'v1', credentials=creds)

    print('Fetching current document...')
    doc = docs_service.documents().get(documentId=DOC_ID).execute()
    content = doc.get('body', {}).get('content', [])

    # Find the table end index in Deliverable 3, and Deliverable 4 start index
    deliv3_start = None
    table_end = None
    deliv4_start = None

    for el in content:
        if 'paragraph' in el:
            t = ''.join([e.get('textRun', {}).get('content', '') for e in el['paragraph'].get('elements', [])])
            if 'Deliverable 3' in t:
                deliv3_start = el.get('startIndex')
            elif 'Deliverable 4' in t:
                deliv4_start = el.get('startIndex')
                break
        if deliv3_start and 'table' in el:
            table_end = el.get('endIndex')

    print(f'deliv3_start={deliv3_start}, table_end={table_end}, deliv4_start={deliv4_start}')

    # Step 1: Delete everything from table_end to deliv4_start
    print(f'Deleting old range [{table_end}:{deliv4_start}]...')
    docs_service.documents().batchUpdate(documentId=DOC_ID, body={
        'requests': [{'deleteContentRange': {'range': {'startIndex': table_end, 'endIndex': deliv4_start}}}]
    }).execute()
    time.sleep(1)

    # Step 2: Build text to insert (starting with items after table)
    # Filter PARAS to only those after TABLE
    after_table_paras = PARAS[2:]
    combined_text = '\n'.join([p[1] for p in after_table_paras]) + '\n'

    print(f'Inserting clean text at {table_end}...')
    docs_service.documents().batchUpdate(documentId=DOC_ID, body={
        'requests': [{'insertText': {'location': {'index': table_end}, 'text': '\n' + combined_text}}]
    }).execute()
    time.sleep(1)

    # Step 3: Insert images
    for img in IMAGES:
        tag = img['tag']
        d = docs_service.documents().get(documentId=DOC_ID).execute()
        b = d.get('body', {}).get('content', [])
        found = False
        for el in b:
            if 'paragraph' in el:
                for pe in el['paragraph'].get('elements', []):
                    txt = pe.get('textRun', {}).get('content', '')
                    if tag in txt:
                        st = pe.get('startIndex')
                        tag_idx = txt.find(tag)
                        exact_start = st + tag_idx
                        exact_end = exact_start + len(tag)
                        print(f'Replacing {tag} at [{exact_start}:{exact_end}] with image...')
                        reqs = [
                            {'deleteContentRange': {'range': {'startIndex': exact_start, 'endIndex': exact_end}}},
                            {
                                'insertInlineImage': {
                                    'location': {'index': exact_start},
                                    'uri': img['url'],
                                    'objectSize': {
                                        'width': {'magnitude': img['width'], 'unit': 'PT'},
                                        'height': {'magnitude': img['height'], 'unit': 'PT'}
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

    # Step 4: Format every paragraph explicitly to correct namedStyleType, alignment, font, and margins
    print('Formatting all paragraphs in Deliverable 3...')
    d = docs_service.documents().get(documentId=DOC_ID).execute()
    b = d.get('body', {}).get('content', [])

    reqs = []
    for el in b:
        st = el.get('startIndex')
        en = el.get('endIndex')
        if not st or not en or st < table_end:
            continue
        if 'paragraph' in el:
            t = ''.join([e.get('textRun', {}).get('content', '') for e in el['paragraph'].get('elements', [])]).strip()
            if 'Deliverable 4' in t:
                break

            has_img = any(e.get('inlineObjectElement') for e in el['paragraph'].get('elements', []))

            # Base text style: Times New Roman 12 pt
            reqs.append({
                'updateTextStyle': {
                    'range': {'startIndex': st, 'endIndex': en},
                    'textStyle': {
                        'weightedFontFamily': {'fontFamily': 'Times New Roman'},
                        'fontSize': {'magnitude': 12, 'unit': 'PT'},
                        'foregroundColor': {'color': {'rgbColor': {'red': 0.1, 'green': 0.1, 'blue': 0.1}}},
                        'bold': False,
                        'italic': False
                    },
                    'fields': 'weightedFontFamily,fontSize,foregroundColor,bold,italic'
                }
            })

            if has_img:
                # Image paragraph: centered
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'NORMAL_TEXT',
                            'alignment': 'CENTER',
                            'spaceAbove': {'magnitude': 8, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 2, 'unit': 'PT'},
                            'keepWithNext': True
                        },
                        'fields': 'namedStyleType,alignment,spaceAbove,spaceBelow,keepWithNext'
                    }
                })
            elif t.startswith('Gambar 3.'):
                # Caption: italic 10 pt centered
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'NORMAL_TEXT',
                            'alignment': 'CENTER',
                            'spaceAbove': {'magnitude': 2, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 10, 'unit': 'PT'},
                            'keepWithNext': False
                        },
                        'fields': 'namedStyleType,alignment,spaceAbove,spaceBelow,keepWithNext'
                    }
                })
                reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {
                            'fontSize': {'magnitude': 10, 'unit': 'PT'},
                            'italic': True,
                            'foregroundColor': {'color': {'rgbColor': {'red': 0.35, 'green': 0.35, 'blue': 0.35}}}
                        },
                        'fields': 'fontSize,italic,foregroundColor'
                    }
                })
            elif t == 'Gambaran Visual Draf MVP (Mockup & Simulasi)':
                # Heading 2
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'HEADING_2',
                            'alignment': 'JUSTIFIED',
                            'spaceAbove': {'magnitude': 16, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 6, 'unit': 'PT'},
                            'keepWithNext': True,
                            'keepLinesTogether': True
                        },
                        'fields': 'namedStyleType,alignment,spaceAbove,spaceBelow,keepWithNext,keepLinesTogether'
                    }
                })
                reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {
                            'bold': True,
                            'fontSize': {'magnitude': 13, 'unit': 'PT'}
                        },
                        'fields': 'bold,fontSize'
                    }
                })
            elif t.startswith('A. ') or t.startswith('B. ') or t.startswith('C. '):
                # Heading 3 (sub-section of Deliverable 3)
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'HEADING_3',
                            'alignment': 'JUSTIFIED',
                            'spaceAbove': {'magnitude': 12, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 4, 'unit': 'PT'},
                            'keepWithNext': True,
                            'keepLinesTogether': True
                        },
                        'fields': 'namedStyleType,alignment,spaceAbove,spaceBelow,keepWithNext,keepLinesTogether'
                    }
                })
                reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {
                            'bold': True,
                            'fontSize': {'magnitude': 12, 'unit': 'PT'}
                        },
                        'fields': 'bold,fontSize'
                    }
                })
            elif any(t.startswith(f'{i}. Halaman ') or t.startswith(f'{i}. Dashboard ') or t.startswith(f'{i}. Pengaturan ') or t.startswith(f'{i}. Manajemen ') or t.startswith(f'{i}. Riwayat ') for i in range(1, 8)):
                # Screen Title: Bold NORMAL_TEXT
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'NORMAL_TEXT',
                            'alignment': 'JUSTIFIED',
                            'spaceAbove': {'magnitude': 10, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 3, 'unit': 'PT'},
                            'keepWithNext': True
                        },
                        'fields': 'namedStyleType,alignment,spaceAbove,spaceBelow,keepWithNext'
                    }
                })
                reqs.append({
                    'updateTextStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'textStyle': {'bold': True},
                        'fields': 'bold'
                    }
                })
            elif t.startswith('Pelanggan:') or t.startswith('BalasWA (Bot AI):'):
                # Chat lines: indented
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'NORMAL_TEXT',
                            'alignment': 'START',
                            'spaceAbove': {'magnitude': 2, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 2, 'unit': 'PT'},
                            'indentStart': {'magnitude': 20, 'unit': 'PT'}
                        },
                        'fields': 'namedStyleType,alignment,spaceAbove,spaceBelow,indentStart'
                    }
                })
                # Bold the speaker prefix
                colon_idx = t.find(':')
                if colon_idx != -1:
                    reqs.append({
                        'updateTextStyle': {
                            'range': {'startIndex': st, 'endIndex': st + colon_idx + 1},
                            'textStyle': {'bold': True},
                            'fields': 'bold'
                        }
                    })
            elif len(t) == 0:
                # Blank lines: normal text tight spacing
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'NORMAL_TEXT',
                            'spaceAbove': {'magnitude': 0, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 0, 'unit': 'PT'}
                        },
                        'fields': 'namedStyleType,spaceAbove,spaceBelow'
                    }
                })
            else:
                # Regular body paragraph: NORMAL_TEXT, justified, 1.15 line spacing
                reqs.append({
                    'updateParagraphStyle': {
                        'range': {'startIndex': st, 'endIndex': en},
                        'paragraphStyle': {
                            'namedStyleType': 'NORMAL_TEXT',
                            'alignment': 'JUSTIFIED',
                            'lineSpacing': 115,
                            'spaceAbove': {'magnitude': 2, 'unit': 'PT'},
                            'spaceBelow': {'magnitude': 6, 'unit': 'PT'}
                        },
                        'fields': 'namedStyleType,alignment,lineSpacing,spaceAbove,spaceBelow'
                    }
                })

    print(f'Sending {len(reqs)} formatting requests in batches...')
    # Batch in groups of 50 to avoid any limits
    batch_size = 50
    for i in range(0, len(reqs), batch_size):
        chunk = reqs[i:i+batch_size]
        docs_service.documents().batchUpdate(documentId=DOC_ID, body={'requests': chunk}).execute()
        time.sleep(0.5)

    print('Reformatting complete! Verifying...')

if __name__ == '__main__':
    main()
