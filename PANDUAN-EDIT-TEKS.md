# Panduan Mengedit Teks dan Materi Flight Lab

Panduan ini membantu mengubah tulisan tanpa merusak perhitungan dan animasi.

## 1. File mana untuk bagian tertentu?

| Bagian website | File yang diedit |
|---|---|
| Judul website, paragraf hero, nama tombol, judul bagian | `templates/index.html` |
| Warna, font, jarak, ukuran kartu, tampilan HP | `static/css/style.css` |
| Nama soal, deskripsi soal, insight, tutorial, animasi, riwayat | `static/js/animation.js` |
| Rumus dan langkah perhitungan Soal 1–4 | `physics.py` |
| Warna kostum Boro dan animasi | `static/js/animation.js` |
| Zoom, Fit, dan kontrol gerak | `static/js/animation.js` dan `templates/index.html` |
| Endpoint API yang menghubungkan website ke Python | `app.py` |

## 2. Mengganti judul atau teks biasa

1. Buka folder `templates`.
2. Buka `index.html`.
3. Tekan `Ctrl + F`.
4. Cari teks yang ingin diganti.
5. Ganti bagian teks di antara tag HTML, jangan menghapus tag pembukanya atau penutupnya.

Contoh:

```html
<h1>Seberapa jauh<br><span>Boro bisa terbang?</span></h1>
```

Jika ingin mengubah judul, ganti kata-katanya saja. Pertahankan `<h1>`, `<br>`, `<span>`, dan tag penutup.

## 3. Mengubah nama dan deskripsi Soal 1–4

1. Buka `static/js/animation.js`.
2. Cari `const QUESTIONS`.
3. Di dalamnya terdapat data `title`, `description`, `problemTitle`, `problemDescription`, dan `assumptions`.
4. Ubah nilai teks di dalam tanda kutip. Jangan mengubah nomor soal atau nama properti.

Contoh:

```javascript
2: {
  title: "Menghitung tinggi maksimum",
  description: "Menentukan ketinggian tertinggi yang dicapai Boro.",
  // ...
}
```

## 4. Mengubah rumus dan langkah penyelesaian

Rumus utama berada di `physics.py`, pada fungsi `solve_question()`.

- `question_number == 1`: jarak horizontal.
- `question_number == 2`: tinggi maksimum.
- `question_number == 3`: waktu terbang.
- `question_number == 4`: komponen kecepatan.

Jika hanya ingin mengganti kalimat penjelasan, ubah teks di properti `steps`, `note`, `subtitle`, atau `variables`.

Jika mengubah rumus matematis atau cara menghitung, ubah juga nilai numerik yang dipakai pada fungsi tersebut. Jangan hanya mengubah tulisan rumus karena angka hasil harus tetap sesuai dengan perhitungan Python.

Setelah mengubah perhitungan, jalankan tes:

```powershell
python -m unittest discover -s tests -v
```

## 5. Mengubah Flight Insight

Buka `static/js/animation.js`, cari fungsi `renderInsight()`.

Fungsi ini memilih judul, paragraf, tiga poin analisis, dan tips berdasarkan:
- mode yang aktif,
- soal yang dipilih,
- sudut,
- kecepatan,
- gravitasi,
- tinggi awal,
- hasil simulasi.

Ubah kalimatnya tanpa menghapus variabel seperti `${format(range, 2)}` jika angka hasil masih ingin ditampilkan secara otomatis.

## 6. Mengubah tutorial

Cari `const tutorialSteps` di `static/js/animation.js`.

Setiap langkah memiliki:
- `title`: judul langkah.
- `text`: instruksi.
- `targets`: ID elemen yang diberi sorotan.

Jika mengganti ID target, pastikan ID tersebut benar-benar ada di `templates/index.html`.

## 7. Mengubah warna dan ukuran

Buka `static/css/style.css`. Warna utama disimpan di bagian `:root`:

```css
:root {
  --ink: #25244a;
  --muted: #77788f;
  --purple: #6256d9;
  --purple-dark: #4336b5;
  --teal: #26a99a;
  --coral: #f27d6b;
}
```

Ubah kode warna setelah tanda `#`. Pertahankan kontras teks agar mudah dibaca saat presentasi.

## 8. Cara memperbarui website lokal

Setelah menyimpan perubahan:
1. Kembali ke browser.
2. Tekan `Ctrl + F5` untuk memuat ulang CSS dan JavaScript.
3. Jika server Flask berhenti, jalankan lagi `python app.py`.
4. Jangan menutup terminal Flask selama website lokal dipakai.

## 9. Catatan sumber soal

ZIP proyek awal hanya memuat teks lengkap dan contoh untuk Soal 1. Soal 2–4 yang tersedia saat ini adalah soal pengayaan buatan untuk melengkapi fitur belajar. Jika guru memberikan soal asli nomor 2–4, ganti deskripsi dan rumusnya berdasarkan naskah guru/buku tersebut.
