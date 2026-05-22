import time
import unittest

from backend.sift_core.jobs import InMemoryJobQueue


class JobsTest(unittest.TestCase):
    def test_job_queue_completes_task(self):
        queue = InMemoryJobQueue()
        job = queue.submit("demo", lambda running_job: {"job": running_job.id})

        for _ in range(50):
            current = queue.get(job.id)
            if current and current.status == "done":
                break
            time.sleep(0.01)

        current = queue.get(job.id)
        self.assertIsNotNone(current)
        self.assertEqual(current.status, "done")
        self.assertEqual(current.result["job"], job.id)


if __name__ == "__main__":
    unittest.main()
