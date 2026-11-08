# Panduan Mengubah Teks dan Tampilan Flight Lab

Panduan ini menjelaskan cara mengedit isi website tanpa merusak rumus Python.

## A. Cara paling mudah mencari teks

1. Buka folder project `simulasi-burung` di VS Code.
2. Tekan `Ctrl + Shift + F` untuk membuka pencarian seluruh project.
3. Ketik kalimat yang ingin diubah, misalnya `Perjalanan Boro`.
4. Klik hasil pencarian untuk membuka file dan baris yang tepat.
5. Ubah teks di antara tanda kutip atau teks HTML yang sesuai.
6. Tekan `Ctrl + S`.
7. Di browser, tekan `Ctrl + F5` untuk memuat ulang file terbaru.

Saran: ubah satu bagian dulu, simpan, lalu periksa hasilnya di browser.

## B. File mana yang harus diedit?

| Yang ingin diubah | File | Bagian yang dicari |
|---|---|---|
| Nama website, judul halaman, teks tombol, label | `templates/index.html` | Cari teks yang tampil di halaman |
| Deskripsi Soal 1–4 | `static/js/animation.js` | `const lessonDefinitions` |
| Contoh input dan output soal | `static/js/animation.js` | `sampleInput`, `sampleOutput`, `sampleNote` |
| Tutorial langkah demi langkah | `static/js/animation.js` | `tutorial` di dalam `lessonDefinitions` |
| Warna latar, kartu, tombol, font, ukuran | `static/css/style.css` | `:root` dan selector komponen |
| Rumus dan hasil perhitungan | `physics.py` | Fungsi `solve_subproblem_1` sampai `solve_subproblem_4` |
| Endpoint yang menghubungkan website dengan Python | `app.py` | Route `/api/...` |
| Bentuk Boro dan kostumnya | `static/js/animation.js` | `function drawBoro(...)` |
| Warna default Boro | `static/js/animation.js` | `DEFAULT_CHARACTER_COLORS` |
| Palet warna siap pakai | `static/js/animation.js` | `CHARACTER_PALETTES` |

## C. Contoh 1 — Mengganti judul website

1. Buka `templates/index.html`.
2. Tekan `Ctrl + F`.
3. Cari judul yang ingin diubah, misalnya `FLIGHT LAB`.
4. Ganti teksnya, misalnya menjadi `BORO FLIGHT ACADEMY`.
5. Simpan dengan `Ctrl + S`.
6. Refresh browser dengan `Ctrl + F5`.

Jangan mengubah `id="..."` jika tidak sedang mengubah kode JavaScript. ID menghubungkan tombol atau elemen HTML dengan program.

## D. Contoh 2 — Mengganti deskripsi soal

1. Buka `static/js/animation.js`.
2. Tekan `Ctrl + F`, cari `const lessonDefinitions`.
3. Cari nomor soal yang ingin diedit, misalnya `1: {`.
4. Ubah bagian `title`, `description`, `input`, `output`, `hint`, atau isi `tutorial`.
5. Pertahankan tanda kutip, koma, kurung kurawal, dan struktur objek.
6. Simpan, lalu refresh browser.

Contoh:

```javascript
1: {
  number: "SUBPROBLEM 01",
  title: "Menghitung Jarak Terjauh",
  description: "Tuliskan deskripsi soal dengan kalimat yang mudah dipahami.",
  // bagian lain tetap dipertahankan
}
```

Jika kalimat berisi tanda petik ganda, gunakan tanda petik tunggal di luar kalimat atau escape karakter petiknya.

## E. Contoh 3 — Mengubah teks tombol

1. Buka `templates/index.html`.
2. Cari `id="playBtn"` untuk tombol Mulai di simulasi utama.
3. Ubah tulisan di dalam tombol, tetapi pertahankan ID-nya.

Contoh:

```html
<button id="playBtn">▶ <span>Mulai Terbang</span></button>
```

Untuk tombol pratinjau soal, cari `id="previewPlayBtn"`.

Jangan menghapus ID tombol karena JavaScript menggunakannya untuk memasang fungsi klik.

## F. Contoh 4 — Mengubah warna Boro

Cara tanpa mengedit kode:
- Gunakan pilihan Palet Warna di website: Flight Lab, Samudra, Senja, atau Hutan.
- Atur warna Bulu Utama, Sayap, Kostum, Aksen, Paruh, dan Kaki.
- Klik **Kembalikan warna awal** untuk kembali ke palet Flight Lab.

Cara mengubah warna default melalui kode:
1. Buka `static/js/animation.js`.
2. Cari `DEFAULT_CHARACTER_COLORS`.
3. Ganti kode warna hex, misalnya `body: "#2bae9f"`.
4. Pastikan format warna tetap `#` diikuti enam digit heksadesimal.

Contoh:

```javascript
const DEFAULT_CHARACTER_COLORS = {
  body: "#2bae9f",
  wing: "#76d8c7",
  accessory: "#6256d9",
  accent: "#f27d6b",
  beak: "#f4b64d",
  feet: "#d58a52",
};
```

Untuk mengubah pilihan palet Samudra, Senja, atau Hutan, cari `CHARACTER_PALETTES`.

## G. Contoh 5 — Mengubah font dan warna website

1. Buka `static/css/style.css`.
2. Cari bagian `:root` di awal file.
3. Ubah variabel seperti `--purple`, `--teal`, `--coral`, `--ink`, dan `--bg`.
4. Simpan dan refresh browser.

```css
:root {
  --ink: #25244a;
  --purple: #6256d9;
  --teal: #26a99a;
  --coral: #f27d6b;
  --bg: #f5f5fc;
}
```

## H. Cara aman setelah mengedit

1. Simpan file dengan `Ctrl + S`.
2. Refresh browser dengan `Ctrl + F5`.
3. Jika website menampilkan error, buka terminal VS Code dan lihat pesan Flask.
4. Periksa tanda kutip, kurung, koma, dan nama ID yang mungkin tidak sengaja terhapus.
5. Jangan mengubah `physics.py` hanya untuk mengganti kalimat di halaman. File tersebut berisi perhitungan matematika.

Jika menggunakan GitHub, setelah perubahan sudah diuji:

```powershell
git add .
git commit -m "Update website text and design"
git push
```
