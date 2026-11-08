"""Static contract tests for the Flight Lab browser interface."""

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "templates" / "index.html").read_text(encoding="utf-8")
JS = (ROOT / "static" / "js" / "animation.js").read_text(encoding="utf-8")


class FrontendContractTests(unittest.TestCase):
    def test_all_direct_dom_references_exist(self):
        html_ids = set(re.findall(r'id="([^"]+)"', HTML))
        js_ids = set(re.findall(r'getElementById\("([^"]+)"\)', JS))
        self.assertFalse(js_ids - html_ids, f"Missing IDs: {sorted(js_ids - html_ids)}")

    def test_html_ids_are_unique(self):
        ids = re.findall(r'id="([^"]+)"', HTML)
        duplicates = sorted({item for item in ids if ids.count(item) > 1})
        self.assertEqual(duplicates, [])

    def test_main_and_preview_have_instant_back_controls(self):
        self.assertIn('id="backBtn"', HTML)
        self.assertIn('id="previewBackBtn"', HTML)
        self.assertIn('addEventListener("click", () => backToStart(state))', JS)
        self.assertIn('addEventListener("click", () => backToStart(previewState))', JS)

    def test_reverse_controls_are_not_shown(self):
        self.assertNotIn('id="reverseBtn"', HTML)
        self.assertNotIn('id="previewReverseBtn"', HTML)

    def test_eight_costumes_are_available(self):
        costume_block = HTML.split('id="costumeSelect"', 1)[1].split("</select>", 1)[0]
        for costume in (
            "classic", "pilot", "explorer", "royal",
            "astronaut", "scientist", "gardener", "racer",
        ):
            self.assertIn(f'value="{costume}"', costume_block)
            if costume != "classic":
                self.assertIn(f'costume === "{costume}"', JS)
        self.assertIn('costume = state.costume || "classic"', JS)

    def test_all_character_color_parts_have_inputs_and_handlers(self):
        for part, suffix in (
            ("body", "Body"), ("wing", "Wing"), ("accessory", "Accessory"),
            ("accent", "Accent"), ("beak", "Beak"), ("feet", "Feet"),
        ):
            element_id = f"boro{suffix}Color"
            self.assertIn(f'id="{element_id}"', HTML)
            self.assertIn(f'setCharacterColor("{part}"', JS)

    def test_color_palettes_are_wired(self):
        for palette in ("flightlab", "ocean", "sunset", "forest"):
            self.assertIn(f'data-palette="{palette}"', HTML)
            self.assertIn(f"{palette}:", JS)
        self.assertIn('querySelectorAll(".palette-button")', JS)

    def test_zoom_and_speed_controls_are_wired_for_both_canvases(self):
        for element_id in (
            "zoomOutBtn", "zoomFitBtn", "zoomInBtn", "playbackSpeed",
            "previewZoomOutBtn", "previewZoomFitBtn", "previewZoomInBtn", "previewSpeed",
        ):
            self.assertIn(f'id="{element_id}"', HTML)
            self.assertIn(f'getElementById("{element_id}")', JS)

    def test_play_pause_back_zoom_and_speed_buttons_are_connected(self):
        for element_id in (
            "playBtn", "pauseBtn", "backBtn",
            "zoomOutBtn", "zoomFitBtn", "zoomInBtn", "playbackSpeed",
            "previewPlayBtn", "previewPauseBtn", "previewBackBtn",
            "previewZoomOutBtn", "previewZoomFitBtn", "previewZoomInBtn", "previewSpeed",
        ):
            self.assertIn(f'getElementById("{element_id}").addEventListener', JS)

    def test_auto_fit_reserves_space_for_character_and_labels(self):
        self.assertIn("function getTrajectoryBounds", JS)
        self.assertIn("function fitScale", JS)
        self.assertIn("objectPadding", JS)
        self.assertIn("{ x: 42, y: 58 }", JS)
        self.assertIn("{ x: 30, y: 38 }", JS)

    def test_lesson_preview_waits_for_user_to_press_start(self):
        preview_state = JS.split("const previewState", 1)[1].split("};", 1)[0]
        self.assertIn("playing: false", preview_state)
        self.assertIn("previewState.playing = false", JS)

    def test_both_canvases_use_the_same_boro_renderer(self):
        self.assertGreaterEqual(len(re.findall(r'\bdrawBoro\(', JS)), 3)


if __name__ == "__main__":
    unittest.main()
