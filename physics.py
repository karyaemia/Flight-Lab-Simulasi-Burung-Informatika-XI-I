"""
MESIN FISIKA — SIMULASI BURUNG / FLIGHT LAB

Model gerak parabola ideal untuk empat subproblem pada buku Informatika kelas XI.
Asumsi tugas: g = 10 m/s², tinggi awal = 0 m, dan hambatan udara diabaikan.
"""

from math import cos, radians, sin, sqrt, isfinite


GRAVITY_SCHOOL = 10.0


def _number(value, label: str) -> float:
    """Konversi input menjadi float dan pastikan nilainya valid."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{label} harus berupa angka yang valid.") from None
    if not isfinite(number):
        raise ValueError(f"{label} harus berupa angka yang valid.")
    return number


def _validate_angle_speed(angle_deg, initial_speed):
    angle = _number(angle_deg, "Sudut")
    speed = _number(initial_speed, "Kecepatan awal")
    if not 0 <= angle <= 90:
        raise ValueError("Sudut peluncuran harus antara 0 dan 90 derajat.")
    if speed < 0:
        raise ValueError("Kecepatan awal tidak boleh negatif.")
    return angle, speed


def simulate_projectile(
    angle_deg: float,
    initial_speed: float,
    gravity: float = GRAVITY_SCHOOL,
    launch_height: float = 0.0,
) -> dict:
    """Hitung lintasan proyektil dan kembalikan metrik simulasi."""

    angle_deg, initial_speed = _validate_angle_speed(angle_deg, initial_speed)
    gravity = _number(gravity, "Gravitasi")
    launch_height = _number(launch_height, "Tinggi peluncuran")

    if gravity <= 0:
        raise ValueError("Gravitasi harus lebih besar dari 0.")
    if launch_height < 0:
        raise ValueError("Tinggi peluncuran tidak boleh negatif.")

    theta = radians(angle_deg)
    vx = initial_speed * cos(theta)
    vy = initial_speed * sin(theta)

    # Akar positif dari y(t) = h + Vy*t - 1/2*g*t² = 0.
    discriminant = vy**2 + 2 * gravity * launch_height
    flight_time = (vy + sqrt(discriminant)) / gravity
    if abs(flight_time) < 1e-12:
        flight_time = 0.0

    horizontal_range = vx * flight_time
    max_height = launch_height + (vy**2) / (2 * gravity)

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
        "flight_time": flight_time,
    }


def _validate_school_angle_speed(angle_deg, initial_speed):
    angle, speed = _validate_angle_speed(angle_deg, initial_speed)
    if not angle.is_integer():
        raise ValueError("Sudut S pada format soal harus berupa bilangan bulat.")
    return angle, speed


def solve_subproblem_1(angle_deg: float, initial_speed: float) -> dict:
    """Soal 1: jarak horizontal terjauh saat kembali ke ketinggian awal."""
    angle_deg, initial_speed = _validate_school_angle_speed(angle_deg, initial_speed)
    result = simulate_projectile(angle_deg, initial_speed, GRAVITY_SCHOOL, 0)
    return {
        "angle": result["angle"],
        "speed": result["speed"],
        "gravity": GRAVITY_SCHOOL,
        "range": result["range"],
        "rounded_range": round(result["range"], 1),
        "flight_time": result["flight_time"],
        "max_height": result["max_height"],
    }


def solve_subproblem_2(angle_deg: float, initial_speed: float) -> dict:
    """Soal 2: waktu untuk mencapai jarak horizontal terjauh."""
    angle_deg, initial_speed = _validate_school_angle_speed(angle_deg, initial_speed)
    result = simulate_projectile(angle_deg, initial_speed, GRAVITY_SCHOOL, 0)
    return {
        "angle": result["angle"],
        "speed": result["speed"],
        "gravity": GRAVITY_SCHOOL,
        "flight_time": result["flight_time"],
    }


def solve_subproblem_3(angle_deg: float, initial_speed: float, tree_height: float) -> dict:
    """Soal 3: status apakah tinggi maksimum mencapai tinggi pohon."""
    angle_deg, initial_speed = _validate_school_angle_speed(angle_deg, initial_speed)
    result = simulate_projectile(angle_deg, initial_speed, GRAVITY_SCHOOL, 0)
    target_height = _number(tree_height, "Tinggi pohon")
    if target_height < 0:
        raise ValueError("Tinggi pohon tidak boleh negatif.")

    max_height = result["max_height"]
    return {
        "angle": result["angle"],
        "speed": result["speed"],
        "tree_height": target_height,
        "max_height": max_height,
        "status": int(max_height >= target_height),
    }


def solve_subproblem_4(birds: list) -> dict:
    """
    Soal 4: hitung status untuk N burung.
    Setiap burung memiliki satu set data: sudut, kecepatan awal, dan tinggi pohon.
    """
    if not isinstance(birds, list) or not birds:
        raise ValueError("Masukkan minimal satu data burung.")
    if len(birds) > 50:
        raise ValueError("Jumlah burung maksimal 50 untuk simulasi ini.")

    results = []
    for index, bird in enumerate(birds, start=1):
        if not isinstance(bird, dict):
            raise ValueError(f"Data burung {index} tidak valid.")
        result = solve_subproblem_3(
            bird.get("angle"),
            bird.get("speed"),
            bird.get("tree_height"),
        )
        result["bird_number"] = index
        results.append(result)

    return {"count": len(results), "birds": results}


def compare_angles(
    initial_speed: float,
    gravity: float = GRAVITY_SCHOOL,
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
