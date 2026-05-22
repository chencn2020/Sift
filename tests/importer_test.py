import tempfile
import unittest
from pathlib import Path

from backend.sift_core.importer import scan_folder


class ImporterTest(unittest.TestCase):
    def test_scan_folder_keeps_supported_images_and_raw_previews(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "a.jpg").write_bytes(b"not-a-real-image")
            (folder / "b.CR3").write_bytes(b"raw-preview")
            (folder / "notes.txt").write_text("ignore me")

            photos = scan_folder("project-1", folder)

        self.assertEqual([photo.filename for photo in photos], ["a.jpg", "b.CR3"])
        self.assertEqual(photos[0].kind, "image")
        self.assertEqual(photos[1].kind, "raw-preview")


if __name__ == "__main__":
    unittest.main()
