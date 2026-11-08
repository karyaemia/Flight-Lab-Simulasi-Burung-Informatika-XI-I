# Flight Lab — Simulasi Burung

**Versi pengembangan: Final Polish — Auto Fit, kontrol gerak, dan Character Studio.**

Flight Lab adalah website pembelajaran interaktif untuk proyek Informatika kelas XI. Backend perhitungan menggunakan **Python + Flask**, sedangkan visualisasi menggunakan **HTML, CSS, JavaScript, dan Canvas**.

Karakter Boro digambar sebagai maskot orisinal dengan Canvas. Proyek ini tidak menggunakan aset karakter Angry Birds.

## 1. Cakupan soal dari buku

Website memiliki dua bagian utama:

- **Simulasi di bagian atas:** pengguna bebas mengubah sudut, kecepatan, gravitasi, dan tinggi awal (sesuai mode) untuk mengamati lintasan.
- **Ruang Belajar di bagian bawah:** berisi deskripsi, format masukan/keluaran, contoh, kalkulator, dan tutorial langkah demi langkah untuk Subproblem 1–4.
- **Pratinjau animasi di samping soal:** lintasan Boro mengikuti input soal yang sedang dipilih secara otomatis, tanpa perlu kembali ke simulasi bagian atas.
- **Kustomisasi Boro:** delapan kostum (Klasik, Pilot, Penjelajah, Raja Langit, Astronaut, Ilmuwan, Penjaga Taman, dan Pembalap). Warna bulu, sayap, kostum, aksen, paruh, dan kaki dapat diubah. Empat palet siap pakai disediakan.
- **Kontrol gerak:** Mulai, Pause, Kembali ke titik peluncuran, kecepatan 0.5×–4×, Zoom In, Zoom Out, dan Auto Fit tersedia di simulasi serta pratinjau soal. Tombol Kembali menghentikan animasi lalu menempatkan Boro langsung di titik awal; tombol ini bukan reverse playback.
- **Auto Fit adaptif:** kamera menghitung jarak horizontal maksimum, ketinggian maksimum, target, dan tinggi pohon yang sedang ditampilkan. Ruang tambahan disisakan untuk badan burung, jambul, ketapel, dan label. Zoom utama dan pratinjau bekerja terpisah.
- **Tutorial terpandu:** setiap langkah menyorot area halaman yang perlu diperhatikan.

### Subproblem 1 — Menghitung Jarak Horizontal Terjauh

Masukan:
- Baris 1: `S`, sudut peluncuran 0–90 derajat.
- Baris 2: `V`, kecepatan awal.
- Gravitasi `g = 10 m/s²`.

Rumus:
`R = (V² × sin(2θ)) / g`

Contoh buku:
```text
Input:
37
10

Output:
9.6
```

Website menampilkan hasil dengan satu angka di belakang koma.

### Subproblem 2 — Menghitung Waktu

Masukan:
- Baris 1: `S`, sudut peluncuran 0–90 derajat.
- Baris 2: `V`, kecepatan awal.
- Gravitasi `g = 10 m/s²`.

Untuk peluncuran dan pendaratan pada ketinggian yang sama, waktu mencapai jarak horizontal terjauh sama dengan total waktu terbang:

`t = (2 × V × sin(θ)) / g`

Contoh buku:
```text
Input:
37
100

Output:
12.036
```

Website menampilkan tiga angka di belakang koma.

### Subproblem 3 — Prediksi Ketinggian yang Dicapai Boro

Masukan:
- Baris 1: `S`, sudut peluncuran.
- Baris 2: `V`, kecepatan awal.
- Baris 3: `T`, tinggi pohon tempat sarang.
- Gravitasi `g = 10 m/s²`.

Rumus:
- `Vy = V × sin(θ)`
- `Hmaks = Vy² / (2g)`

Status:
- `1` jika `Hmaks >= T`.
- `0` jika `Hmaks < T`.

Contoh buku:
```text
Input:
37
100
100

Output:
Status: 1
Ketinggian: 181.09
```

### Subproblem 4 — Prediksi Ketinggian Banyak Burung

Masukan:
- Baris pertama `N`, jumlah burung.
- Setelah itu, masukkan satu set data `S`, `V`, `T` untuk setiap burung secara berurutan.
- Gravitasi `g = 10 m/s²`.

**Catatan interpretasi format:** contoh tabel pada buku memperlihatkan data `S`, `V`, `T` yang berulang setelah nilai `N`. Karena itu, website menerima N set data burung. Setiap burung dihitung secara terpisah.

Contoh dua burung:
```text
Input:
2
37
100
100
37
100
200

Output:
Status Burung 1: 1
Ketinggian: 181.09

Status Burung 2: 0
Ketinggian: 181.09
```

## 2. Cara menggunakan website

1. Jalankan website dari VS Code.
2. Bagian atas adalah simulasi interaktif. Geser sudut dan kecepatan, kemudian tekan **Luncurkan Boro**.
3. Scroll ke **Ruang Belajar Soal 1–4**.
4. Pilih tab subproblem. Pratinjau animasi di samping panel soal akan dibuat otomatis.
5. Baca deskripsi dan format masukan/keluaran.
6. Tekan **Gunakan contoh buku** untuk mengisi data contoh, atau ubah angka sendiri. Animasi pratinjau mengikuti perubahan input.
7. Tekan **Hitung jawaban**. Hasil dihitung oleh Python melalui Flask.
8. Gunakan Mulai, Pause, Kembali, pilihan kecepatan, dan Zoom pada kartu pratinjau tanpa kembali ke atas.
9. Pilih salah satu dari delapan kostum atau empat palet warna. Atur warna bulu, sayap, kostum, aksen, paruh, dan kaki. Semua perubahan tampil di simulasi utama dan pratinjau soal.
10. Tekan **Mulai tutorial** untuk mengikuti empat langkah. Area yang perlu diperhatikan akan disorot.
11. Tombol **Tampilkan data di simulasi atas** tetap tersedia untuk mengirim sudut dan kecepatan ke simulasi utama. Untuk Subproblem 4, visualisasi menampilkan burung pertama; kalkulator tetap menghitung semua burung.

## 3. Mengubah teks dan tampilan

Lihat file `PANDUAN-EDIT-TEKS.md` untuk panduan langkah demi langkah. Ringkasnya:
- Teks tombol, judul halaman, label, dan susunan komponen: `templates/index.html`.
- Isi deskripsi soal, contoh input/output, petunjuk, dan tutorial: `static/js/animation.js`, pada objek `lessonDefinitions`.
- Warna, ukuran, jarak, dan font: `static/css/style.css`.
- Rumus dan perhitungan: `physics.py`. Jangan mengubah rumus hanya untuk mengganti teks.
- Gambar karakter Boro, kostum, dan palet: fungsi `drawBoro`, `DEFAULT_CHARACTER_COLORS`, dan `CHARACTER_PALETTES` di `static/js/animation.js`.

Setelah mengedit, simpan (`Ctrl + S`) dan refresh browser dengan `Ctrl + F5`.

## 4. Menjalankan di Windows melalui VS Code

Pastikan Python 3 sudah terpasang. Buka folder proyek ini di VS Code.

Buka terminal VS Code (`Terminal > New Terminal`), lalu jalankan:

### Windows PowerShell
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Jika PowerShell memblokir aktivasi environment, jalankan perintah berikut pada terminal yang sama, lalu aktifkan ulang:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\.venv\Scripts\Activate.ps1
```

Alternatif Command Prompt:
```bat
py -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python app.py
```

Buka browser ke:
```text
http://127.0.0.1:5000
```

Untuk menghentikan server, tekan `Ctrl + C` pada terminal.

## 5. Menjalankan pengujian

Di terminal dengan virtual environment aktif:
```powershell
python -m unittest discover -s tests -v
```

Tes memeriksa contoh buku untuk Subproblem 1–4, status tercapai/tidak tercapai, validasi masukan, fungsi simulasi, ID elemen HTML, tombol kontrol, kostum, palet warna, dan kontrak Auto Fit.

## 6. Struktur folder

```text
simulasi-burung/
├── app.py
├── physics.py
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── animation.js
├── tests/
│   ├── test_physics.py
│   └── test_frontend_contract.py
├── requirements.txt
├── README.md
└── PANDUAN-EDIT-TEKS.md
```

## 7. Cara kerja program

1. Pengguna memasukkan data di halaman web.
2. JavaScript mengirim data ke endpoint Flask `/api/problem/1` sampai `/api/problem/4`.
3. Flask memanggil fungsi Python di `physics.py`.
4. Python memvalidasi input dan menghitung hasil sesuai subproblem.
5. Flask mengirim hasil dalam format JSON.
6. JavaScript menampilkan hasil dan penjelasan pada halaman.

Untuk animasi, JavaScript mengirim parameter ke `/api/simulate`, Python menghitung lintasan, dan Canvas menggambar gerakan Boro.

## 8. Mengunggah ke GitHub

Buat repository baru di GitHub, misalnya `simulasi-burung`. Dari terminal VS Code pada folder proyek:

```bash
git init
git add .
git commit -m "Flight Lab: Subproblem 1-4"
git branch -M main
git remote add origin https://github.com/USERNAME/simulasi-burung.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub milikmu. Jangan unggah folder `.venv`.

## 9. Menerbitkan website Flask

GitHub menyimpan kode. Untuk menjalankan backend Flask secara online, gunakan layanan hosting aplikasi Python seperti Render:

- Hubungkan repository GitHub ke Render.
- Pilih Web Service dengan runtime Python.
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`

Setelah deployment selesai, Render akan memberikan alamat website. Periksa pengaturan dan ketentuan paket hosting terbaru di situs Render.

## 10. Batasan model

- Model tugas menggunakan `g = 10 m/s²`, tinggi awal `0`, dan mengabaikan hambatan udara.
- Subproblem 1–2 menganggap titik awal dan akhir berada pada ketinggian sama.
- Subproblem 3–4 membandingkan tinggi maksimum lintasan dengan tinggi pohon.
- Model ini digunakan untuk pembelajaran, bukan prediksi lintasan benda nyata dengan hambatan udara.

## 11. Referensi belajar

- Buku Informatika untuk SMA Kelas XI, Bab 2 — Strategi Algoritmik dan Pemrograman, Problem Simulasi Burung, halaman 53–59 (sumber soal dan contoh masukan/keluaran yang diberikan).
- OpenStax, University Physics, Projectile Motion: https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion
- Python `math`: https://docs.python.org/3/library/math.html
- Flask Quickstart: https://flask.palletsprojects.com/en/stable/quickstart/
- Visual Studio Code Python tutorial: https://code.visualstudio.com/docs/python/python-tutorial
- Render Flask deployment: https://render.com/docs/deploy-flask
