"""
APLIKASI WEB — FLIGHT LAB
Backend Python Flask untuk simulasi dan penyelesaian Subproblem 1–4.
"""

from flask import Flask, jsonify, render_template, request
from physics import (
    compare_angles,
    simulate_projectile,
    solve_subproblem_1,
    solve_subproblem_2,
    solve_subproblem_3,
    solve_subproblem_4,
)

app = Flask(__name__)


@app.get("/")
def home():
    return render_template("index.html")


@app.post("/api/simulate")
def api_simulate():
    """API untuk animasi simulasi bebas di bagian atas website."""
    data = request.get_json(silent=True) or {}
    try:
        result = simulate_projectile(
            angle_deg=data.get("angle", 37),
            initial_speed=data.get("speed", 10),
            gravity=data.get("gravity", 10),
            launch_height=data.get("launch_height", 0),
        )
        return jsonify({"ok": True, "result": result})
    except (TypeError, ValueError) as error:
        return jsonify({"ok": False, "error": str(error)}), 400


@app.post("/api/compare")
def api_compare():
    data = request.get_json(silent=True) or {}
    try:
        results = compare_angles(
            initial_speed=data.get("speed", 10),
            gravity=data.get("gravity", 10),
            launch_height=data.get("launch_height", 0),
        )
        return jsonify({"ok": True, "results": results})
    except (TypeError, ValueError) as error:
        return jsonify({"ok": False, "error": str(error)}), 400


@app.post("/api/problem/<int:problem_number>")
def api_problem(problem_number):
    """API penyelesaian empat subproblem berdasarkan format input buku."""
    data = request.get_json(silent=True) or {}
    try:
        if problem_number == 1:
            result = solve_subproblem_1(data.get("angle"), data.get("speed"))
        elif problem_number == 2:
            result = solve_subproblem_2(data.get("angle"), data.get("speed"))
        elif problem_number == 3:
            result = solve_subproblem_3(
                data.get("angle"), data.get("speed"), data.get("tree_height")
            )
        elif problem_number == 4:
            result = solve_subproblem_4(data.get("birds"))
        else:
            return jsonify({"ok": False, "error": "Nomor subproblem harus 1 sampai 4."}), 404
        return jsonify({"ok": True, "result": result})
    except (TypeError, ValueError) as error:
        return jsonify({"ok": False, "error": str(error)}), 400


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
