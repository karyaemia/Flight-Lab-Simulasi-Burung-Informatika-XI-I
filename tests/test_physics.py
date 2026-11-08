"""Pengujian mesin fisika Flight Lab."""

import unittest
from physics import simulate_projectile, compare_angles, solve_question


class ProjectileTests(unittest.TestCase):
    def test_textbook_example_soal_1(self):
        # Contoh dari file proyek: sudut 37°, kecepatan 10 m/s, g = 10.
        result = simulate_projectile(37, 10, 10, 0)
        self.assertEqual(round(result["range"], 1), 9.6)

    def test_angle_45_gives_max_range_for_equal_heights(self):
        result_45 = simulate_projectile(45, 20, 10, 0)
        result_30 = simulate_projectile(30, 20, 10, 0)
        result_60 = simulate_projectile(60, 20, 10, 0)
        self.assertGreater(result_45["range"], result_30["range"])
        self.assertGreater(result_45["range"], result_60["range"])

    def test_vertical_launch_has_zero_horizontal_range(self):
        result = simulate_projectile(90, 20, 10, 0)
        self.assertAlmostEqual(result["range"], 0, places=8)

    def test_launch_height_increases_flight_time(self):
        ground_launch = simulate_projectile(30, 20, 10, 0)
        raised_launch = simulate_projectile(30, 20, 10, 5)
        self.assertGreater(raised_launch["flight_time"], ground_launch["flight_time"])

    def test_invalid_angle_is_rejected(self):
        with self.assertRaises(ValueError):
            simulate_projectile(100, 10, 10, 0)

    def test_compare_returns_six_angles(self):
        results = compare_angles(10)
        self.assertEqual(len(results), 6)

    def test_question_1_returns_range_formula(self):
        solution = solve_question(1, 37, 10, 10, 0)
        self.assertIn("sin(2θ)", solution["formula"])
        self.assertEqual(round(solution["value"], 1), 9.6)

    def test_question_2_returns_maximum_rise(self):
        solution = solve_question(2, 30, 20, 10, 0)
        self.assertAlmostEqual(solution["value"], 5.0, places=6)

    def test_question_3_returns_flight_time(self):
        solution = solve_question(3, 30, 20, 10, 0)
        self.assertAlmostEqual(solution["value"], 2.0, places=6)

    def test_question_4_returns_velocity_components(self):
        solution = solve_question(4, 60, 20, 10, 0)
        self.assertAlmostEqual(solution["value"]["vx"], 10.0, places=6)
        self.assertAlmostEqual(solution["value"]["vy"], 17.320508, places=5)

    def test_invalid_question_is_rejected(self):
        with self.assertRaises(ValueError):
            solve_question(5, 37, 10, 10, 0)


if __name__ == "__main__":
    unittest.main()
