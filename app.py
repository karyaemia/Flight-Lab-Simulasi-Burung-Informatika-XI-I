"""
APLIKASI WEB — FLIGHT LAB
Backend Flask untuk simulasi dan pembelajaran gerak parabola.
"""

from flask import Flask, jsonify, render_template, request
from physics import simulate_projectile, compare_angles, solve_question

app = Flask(__name__)


@app.get("/")
def home():
    return render_template("index.html")


def payload():
    return request.get_json(silent=True) or {}


@app.post("/api/simulate")
def api_simulate():
    data = payload()
    try:
        result = simulate_projectile(
            angle_deg=float(data.get("angle", 37)),
            initial_speed=float(data.get("speed", 10)),
            gravity=float(data.get("gravity", 10)),
            launch_height=float(data.get("launch_height", 0)),
        )
        return jsonify({"ok": True, "result": result})
    except (TypeError, ValueError) as error:
        return jsonify({"ok": False, "error": str(error)}), 400


@app.post("/api/solve")
def api_solve():
    """Mengembalikan rumus dan langkah otomatis untuk Soal 1–4."""
    data = payload()
    try:
        solution = solve_question(
            question_number=int(data.get("question", 1)),
            angle_deg=float(data.get("angle", 37)),
            initial_speed=float(data.get("speed", 10)),
            gravity=float(data.get("gravity", 10)),
            launch_height=float(data.get("launch_height", 0)),
        )
        return jsonify({"ok": True, "solution": solution})
    except (TypeError, ValueError) as error:
        return jsonify({"ok": False, "error": str(error)}), 400


@app.post("/api/compare")
def api_compare():
    data = payload()
    try:
        results = compare_angles(
            initial_speed=float(data.get("speed", 10)),
            gravity=float(data.get("gravity", 10)),
            launch_height=float(data.get("launch_height", 0)),
        )
        best = max(results, key=lambda item: item["range"])
        return jsonify({"ok": True, "results": results, "best_angle": best["angle"]})
    except (TypeError, ValueError) as error:
        return jsonify({"ok": False, "error": str(error)}), 400


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "Flight Lab"})


if __name__ == "__main__":
    # Jalankan lokal dengan: python app.py
    app.run(host="127.0.0.1", port=5000, debug=True)
