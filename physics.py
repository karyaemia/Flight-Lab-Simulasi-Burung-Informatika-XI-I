"""
MESIN FISIKA — FLIGHT LAB
Gerak parabola ideal tanpa hambatan udara.

Soal 1 pada sumber proyek:
Menghitung jarak horizontal terjauh dengan sudut, kecepatan awal,
gravitasi 10 m/s², serta titik awal dan akhir setinggi sama.

Soal 2–4 merupakan soal pengayaan yang disusun untuk fitur pembelajaran
website karena naskah soal asli nomor 2–4 tidak disertakan di proyek.
"""

from math import cos, radians, sin, sqrt, isfinite


def simulate_projectile(
    angle_deg: float,
    initial_speed: float,
    gravity: float = 10.0,
    launch_height: float = 0.0,
) -> dict:
    """Hitung komponen kecepatan, lintasan, dan metrik gerak parabola."""
    values = (angle_deg, initial_speed, gravity, launch_height)
    try:
        numeric_values = tuple(float(value) for value in values)
    except (TypeError, ValueError):
        raise ValueError("Semua input harus berupa angka yang valid.")

    if not all(isfinite(value) for value in numeric_values):
        raise ValueError("Semua input harus berupa angka yang valid.")

    angle_deg, initial_speed, gravity, launch_height = numeric_values

    if not 0 <= angle_deg <= 90:
        raise ValueError("Sudut peluncuran harus antara 0 dan 90 derajat.")
    if initial_speed < 0:
        raise ValueError("Kecepatan awal tidak boleh negatif.")
    if gravity <= 0:
        raise ValueError("Gravitasi harus lebih besar dari 0.")
    if launch_height < 0:
        raise ValueError("Tinggi peluncuran tidak boleh negatif.")

    theta = radians(angle_deg)
    vx = initial_speed * cos(theta)
    vy = initial_speed * sin(theta)

    discriminant = vy**2 + 2 * gravity * launch_height
    flight_time = (vy + sqrt(discriminant)) / gravity
    if abs(flight_time) < 1e-12:
        flight_time = 0.0

    horizontal_range = vx * flight_time
    rise_height = (vy**2) / (2 * gravity)
    max_height = launch_height + rise_height

    if abs(vx) < 1e-10:
        vx = 0.0
    if abs(horizontal_range) < 1e-10:
        horizontal_range = 0.0

    return {
        "angle": angle_deg,
        "speed": initial_speed,
        "gravity": gravity,
        "launch_height": launch_height,
        "vx": vx,
        "vy": vy,
        "range": horizontal_range,
        "max_height": max_height,
        "rise_height": rise_height,
        "flight_time": flight_time,
    }


def compare_angles(
    initial_speed: float,
    gravity: float = 10.0,
    launch_height: float = 0.0,
    angles=None,
) -> list:
    """Bandingkan jarak beberapa sudut dengan kecepatan yang sama."""
    if angles is None:
        angles = [15, 30, 37, 45, 60, 75]

    return [
        simulate_projectile(angle, initial_speed, gravity, launch_height)
        for angle in angles
    ]


def solve_question(
    question_number: int,
    angle_deg: float,
    initial_speed: float,
    gravity: float = 10.0,
    launch_height: float = 0.0,
) -> dict:
    """
    Hasilkan rumus, substitusi angka, dan langkah penyelesaian Soal 1–4.
    Soal 2–4 adalah soal pengayaan, bukan kutipan dari buku.
    """
    if question_number not in (1, 2, 3, 4):
        raise ValueError("Nomor soal harus 1, 2, 3, atau 4.")

    result = simulate_projectile(angle_deg, initial_speed, gravity, launch_height)
    angle = result["angle"]
    speed = result["speed"]
    g = result["gravity"]
    theta = radians(angle)
    sin_theta = sin(theta)
    cos_theta = cos(theta)

    if question_number == 1:
        value = result["range"]
        return {
            "number": 1,
            "title": "Menghitung jarak horizontal",
            "subtitle": "Menentukan seberapa jauh Boro mendarat dari titik peluncuran.",
            "formula": "R = (V² × sin(2θ)) / g",
            "variables": [
                "R = jarak horizontal (m)",
                "V = kecepatan awal (m/s)",
                "θ = sudut peluncuran",
                "g = percepatan gravitasi (m/s²)",
            ],
            "steps": [
                f"Masukkan nilai: V = {speed:g} m/s, θ = {angle:g}°, dan g = {g:g} m/s².",
                f"Hitung sudut ganda: 2θ = {2 * angle:g}°.",
                f"Hitung sinus: sin({2 * angle:g}°) = {sin(2 * theta):.4f}.",
                f"Substitusikan: R = ({speed:g}² × {sin(2 * theta):.4f}) / {g:g}.",
                f"Hasil jarak horizontal adalah {value:.2f} m.",
            ],
            "substitution": f"R = ({speed:g}² × sin({2 * angle:g}°)) / {g:g} = {value:.2f} m",
            "answer": f"{value:.2f} m",
            "value": value,
            "unit": "m",
            "answer_label": "Jarak horizontal",
            "note": "Rumus ini berlaku untuk model ideal ketika titik peluncuran dan pendaratan berada pada ketinggian yang sama.",
        }

    if question_number == 2:
        value = result["rise_height"]
        return {
            "number": 2,
            "title": "Menghitung tinggi maksimum",
            "subtitle": "Menentukan ketinggian tertinggi yang dicapai Boro dari titik peluncuran.",
            "formula": "Hmaks = (V × sin θ)² / (2g)",
            "variables": [
                "Hmaks = kenaikan tinggi maksimum (m)",
                "V × sin θ = komponen kecepatan vertikal (m/s)",
                "g = percepatan gravitasi (m/s²)",
            ],
            "steps": [
                f"Hitung komponen vertikal: Vy = V × sin θ = {speed:g} × sin({angle:g}°) = {result['vy']:.2f} m/s.",
                "Di titik tertinggi, kecepatan vertikal sesaat bernilai 0 m/s.",
                f"Gunakan rumus Hmaks = Vy² / (2g) = ({result['vy']:.2f}²) / (2 × {g:g}).",
                f"Kenaikan tinggi maksimum dari titik peluncuran adalah {value:.2f} m.",
            ],
            "substitution": f"Hmaks = ({speed:g} × sin({angle:g}°))² / (2 × {g:g}) = {value:.2f} m",
            "answer": f"{value:.2f} m di atas titik peluncuran",
            "value": value,
            "unit": "m",
            "answer_label": "Kenaikan tinggi maksimum",
            "note": f"Jika titik peluncuran berada pada ketinggian {launch_height:g} m, tinggi maksimum dari tanah adalah {result['max_height']:.2f} m.",
        }

    if question_number == 3:
        # Rumus sederhana waktu total berlaku untuk tinggi awal nol.
        if launch_height > 0:
            value = result["flight_time"]
            formula = "T = (Vy + √(Vy² + 2gh)) / g"
            substitution = (
                f"T = ({result['vy']:.2f} + √({result['vy']:.2f}² + "
                f"2 × {g:g} × {launch_height:g})) / {g:g} = {value:.3f} s"
            )
            note = "Karena titik peluncuran lebih tinggi dari tanah, digunakan persamaan waktu jatuh umum."
            steps = [
                f"Komponen kecepatan vertikal: Vy = {result['vy']:.2f} m/s.",
                f"Tinggi awal: h = {launch_height:g} m.",
                "Gunakan akar positif dari persamaan posisi vertikal saat benda menyentuh tanah.",
                f"Waktu sampai menyentuh tanah adalah {value:.3f} s.",
            ]
        else:
            value = result["flight_time"]
            formula = "T = (2 × V × sin θ) / g"
            substitution = f"T = (2 × {speed:g} × sin({angle:g}°)) / {g:g} = {value:.3f} s"
            note = "Rumus sederhana ini berlaku ketika titik peluncuran dan pendaratan setinggi sama."
            steps = [
                f"Hitung komponen vertikal: Vy = V × sin θ = {result['vy']:.2f} m/s.",
                "Waktu naik sama dengan waktu turun pada ketinggian awal dan akhir yang sama.",
                f"T = 2 × Vy / g = 2 × {result['vy']:.2f} / {g:g}.",
                f"Total waktu terbang adalah {value:.3f} s.",
            ]
        return {
            "number": 3,
            "title": "Menghitung waktu terbang",
            "subtitle": "Menentukan lama Boro berada di udara hingga menyentuh tanah.",
            "formula": formula,
            "variables": [
                "T = waktu total di udara (s)",
                "Vy = komponen kecepatan vertikal awal (m/s)",
                "g = percepatan gravitasi (m/s²)",
                "h = tinggi awal (m), jika digunakan",
            ],
            "steps": steps,
            "substitution": substitution,
            "answer": f"{value:.3f} s",
            "value": value,
            "unit": "s",
            "answer_label": "Waktu terbang",
            "note": note,
        }

    value_x = result["vx"]
    value_y = result["vy"]
    return {
        "number": 4,
        "title": "Menguraikan komponen kecepatan",
        "subtitle": "Memisahkan kecepatan awal menjadi arah horizontal dan vertikal.",
        "formula": "Vx = V × cos θ   |   Vy = V × sin θ",
        "variables": [
            "Vx = komponen kecepatan horizontal (m/s)",
            "Vy = komponen kecepatan vertikal (m/s)",
            "V = besar kecepatan awal (m/s)",
            "θ = sudut peluncuran",
        ],
        "steps": [
            f"Komponen horizontal: Vx = {speed:g} × cos({angle:g}°) = {value_x:.2f} m/s.",
            f"Komponen vertikal: Vy = {speed:g} × sin({angle:g}°) = {value_y:.2f} m/s.",
            "Vx menentukan laju gerak mendatar, sedangkan Vy menentukan gerak naik dan turun.",
            "Tanpa hambatan udara, Vx tetap; Vy berubah karena pengaruh gravitasi.",
        ],
        "substitution": f"Vx = {speed:g} × cos({angle:g}°) = {value_x:.2f} m/s; Vy = {speed:g} × sin({angle:g}°) = {value_y:.2f} m/s",
        "answer": f"Vx = {value_x:.2f} m/s · Vy = {value_y:.2f} m/s",
        "value": {"vx": value_x, "vy": value_y},
        "unit": "m/s",
        "answer_label": "Komponen kecepatan",
        "note": "Model mengabaikan hambatan udara, sehingga komponen kecepatan horizontal tetap konstan sepanjang lintasan.",
    }
