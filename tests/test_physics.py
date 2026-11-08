"""Pengujian mesin Fisika Flight Lab untuk Subproblem 1–4."""

import unittest

from physics import (
    compare_angles,
    simulate_projectile,
    solve_subproblem_1,
    solve_subproblem_2,
    solve_subproblem_3,
    solve_subproblem_4,
)


class ProjectileTests(unittest.TestCase):
    def test_subproblem_1_textbook_example(self):
        result = solve_subproblem_1(37, 10)
        self.assertEqual(result["rounded_range"], 9.6)

    def test_subproblem_2_textbook_example(self):
        result = solve_subproblem_2(37, 100)
        self.assertEqual(round(result["flight_time"], 3), 12.036)

    def test_subproblem_3_status_one(self):
        result = solve_subproblem_3(37, 100, 100)
        self.assertEqual(result["status"], 1)
        self.assertAlmostEqual(result["max_height"], 181.09, places=2)

    def test_subproblem_3_status_zero(self):
        result = solve_subproblem_3(37, 100, 200)
        self.assertEqual(result["status"], 0)
        self.assertAlmostEqual(result["max_height"], 181.09, places=2)

    def test_subproblem_4_two_birds(self):
        result = solve_subproblem_4([
            {"angle": 37, "speed": 100, "tree_height": 100},
            {"angle": 37, "speed": 100, "tree_height": 200},
        ])
        self.assertEqual(result["count"], 2)
        self.assertEqual([bird["status"] for bird in result["birds"]], [1, 0])

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

    def test_fractional_school_angle_is_rejected(self):
        with self.assertRaises(ValueError):
            solve_subproblem_1(37.5, 10)

    def test_invalid_tree_height_is_rejected(self):
        with self.assertRaises(ValueError):
            solve_subproblem_3(37, 100, -1)

    def test_empty_bird_list_is_rejected(self):
        with self.assertRaises(ValueError):
            solve_subproblem_4([])

    def test_compare_returns_six_angles(self):
        results = compare_angles(10)
        self.assertEqual(len(results), 6)


if __name__ == "__main__":
    unittest.main()
