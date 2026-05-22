import tempfile
import unittest
from pathlib import Path

from backend.sift_core.importer import scan_folder
from backend.sift_core.storage import SiftStore


class StorageTest(unittest.TestCase):
    def test_project_and_photo_metadata_round_trip(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "photos"
            source.mkdir()
            (source / "frame.jpg").write_bytes(b"image")

            store = SiftStore(root / "sift.sqlite3")
            store.initialize()
            project = store.create_project("Event", source)
            photos = scan_folder(project.id, source)
            inserted = store.upsert_photos(photos)
            rows = store.list_photos(project.id)
            projects = store.list_projects()
            store.close()

        self.assertEqual(inserted, 1)
        self.assertEqual(rows[0]["filename"], "frame.jpg")
        self.assertEqual(projects[0]["photo_count"], 1)


if __name__ == "__main__":
    unittest.main()
