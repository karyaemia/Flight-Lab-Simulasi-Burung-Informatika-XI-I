# Flight Lab — Laboratorium Gerak Parabola

Flight Lab adalah website pembelajaran gerak parabola untuk proyek Informatika kelas XI. Backend perhitungan menggunakan **Python + Flask**, sedangkan visualisasi menggunakan **HTML, CSS, JavaScript, dan Canvas**.

Maskot Boro digambar langsung menggunakan Canvas. Tidak ada aset gambar eksternal yang wajib diunduh.

## Fitur

- Simulasi lintasan proyektil dengan skala otomatis agar lintasan dan titik pendaratan tetap terlihat.
- Kontrol sudut, kecepatan awal, gravitasi, dan tinggi awal.
- Animasi Mulai, Pause, Kembali ke titik awal, kecepatan animasi, zoom-out/zoom-in terbatas hingga Fit, dan jejak lintasan.
- Pilihan empat warna kostum Boro yang konsisten pada maskot animasi.
- Mode Soal, Lab Bebas, Bandingkan Sudut, dan Tantangan Target.
- Formula Corner otomatis untuk Soal 1–4, termasuk substitusi angka dan langkah penyelesaian.
- Flight Insight yang berubah mengikuti hasil simulasi.
- Tutorial interaktif lima langkah.
- Riwayat eksperimen tersimpan di browser menggunakan localStorage.
- Layout responsif untuk laptop dan ponsel.

## Catatan penting tentang Soal 1–4

File sumber proyek hanya menyertakan deskripsi lengkap **Soal 1** dan contoh:
- Sudut 37°
- Kecepatan awal 10 m/s
- Gravitasi 10 m/s²
- Hasil jarak horizontal sekitar 9,6 m

Karena naskah asli Soal 2–4 tidak ada di ZIP sumber, website menyediakan Soal 2–4 sebagai **soal pengayaan**:
1. Menghitung tinggi maksimum.
2. Menghitung waktu terbang.
3. Menguraikan komponen kecepatan horizontal dan vertikal.

Jika guru/buku memiliki teks soal 2–4 yang berbeda, ubah teks dan rumus sesuai instruksi aslinya sebelum presentasi. Jangan menyebut soal pengayaan ini sebagai kutipan buku.

## Struktur folder

```text
simulasi-burung/
├── app.py
├── physics.py
├── requirements.txt
├── README.md
├── PANDUAN-EDIT-TEKS.md
├── .gitignore
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── animation.js
└── tests/
    ├── test_physics.py
    └── test_frontend_contract.py
```

## Menjalankan di Windows + VS Code

Buka terminal VS Code di folder `simulasi-burung`, lalu jalankan:

```powershell
py -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Buka browser di:

```text
http://127.0.0.1:5000
```

Jika virtual environment sudah ada dan aktif, tidak perlu membuatnya lagi. Cukup:

```powershell
python app.py
```

Jangan tutup terminal yang menjalankan Flask selama website lokal digunakan.

## Menjalankan tes

Dengan virtual environment aktif:

```powershell
python -m unittest discover -s tests -v
```

## Deploy ke Render

Repository menggunakan Flask dan sudah menyediakan `requirements.txt`. Pada pengaturan Web Service Render:

- **Language:** Python 3
- **Branch:** `main`
- **Root Directory:** `simulasi-burung` jika repository berisi folder induk di atas
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`

Penting: jika isi repository GitHub langsung berupa file `app.py`, `physics.py`, `templates`, dan `static` (tanpa folder `simulasi-burung` di dalam repository), kosongkan Root Directory.

Setiap perubahan lokal harus di-commit dan di-push ke GitHub agar Render melakukan deploy ulang.

## Penyimpanan riwayat

Riwayat eksperimen memakai `localStorage` browser. Data:
- Tersimpan pada browser/perangkat yang digunakan.
- Tidak otomatis tersinkron ke perangkat lain.
- Dapat dihapus dari panel Riwayat Eksperimen.
- Dapat hilang jika data situs/browser dibersihkan.

## Batasan model fisika

- Hambatan udara diabaikan.
- Gravitasi dianggap konstan selama satu simulasi.
- Gerak horizontal dan vertikal mengikuti model proyektil ideal.
- Untuk Soal 1, titik awal dan akhir berada pada ketinggian yang sama.
