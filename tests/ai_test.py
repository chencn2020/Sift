import unittest

from backend.sift_core.ai import LocalHeuristicProvider, provider_from_settings


class AiProviderTest(unittest.TestCase):
    def test_local_provider_returns_score_contract(self):
        result = LocalHeuristicProvider().analyze("project", ["a", "b"], {})

        self.assertEqual(set(result.scores.keys()), {"a", "b"})
        self.assertIn("sharpness", result.scores["a"])
        self.assertEqual(result.faces, [])

    def test_cloud_provider_requires_explicit_opt_in(self):
        with self.assertRaises(PermissionError):
            provider_from_settings(False, "cloud")


if __name__ == "__main__":
    unittest.main()
