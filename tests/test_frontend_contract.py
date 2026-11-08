"""Kontrak minimum halaman Flight Lab."""

import os
import unittest


ROOT = os.path.dirname(os.path.dirname(__file__))


class FrontendContractTests(unittest.TestCase):
    def read(self, relative):
        with open(os.path.join(ROOT, relative), encoding="utf-8") as file:
            return file.read()

    def test_required_feature_sections_exist(self):
        html = self.read("templates/index.html")
        for required in (
            'id="questionPicker"', 'id="formulaCard"', 'id="insightPoints"',
            'id="learningCenter"', 'id="experimentHistory"', 'id="flightCanvas"',
            'id="zoomInBtn"', 'id="fitBtn"', 'id="skinPicker"',
        ):
            self.assertIn(required, html)

    def test_javascript_calls_backend_and_has_history(self):
        js = self.read("static/js/animation.js")
        self.assertIn('"/api/simulate"', js)
        self.assertIn('"/api/solve"', js)
        self.assertIn("localStorage", js)
        self.assertIn("tutorialSteps", js)
        self.assertIn("function setSkin", js)
        self.assertIn("state.zoom", js)

    def test_styles_include_mobile_layout(self):
        css = self.read("static/css/style.css")
        self.assertIn("@media (max-width: 760px)", css)
        self.assertIn(".history-list", css)


if __name__ == "__main__":
    unittest.main()
