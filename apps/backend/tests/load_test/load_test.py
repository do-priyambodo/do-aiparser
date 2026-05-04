# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
import os
from locust import HttpUser, between, task

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AiParserLoadUser(HttpUser):
    """Simulates corporate clients stress-testing the custom do-aiparser /api/extract endpoint."""

    wait_time = between(1, 2)  # Wait 1-2 seconds between task hits

    @task
    def extract_document(self) -> None:
        """Simulates a multipart form document parsing upload request."""
        # Generate standard dummy receipt png byte stream for high-concurrency tests
        fake_receipt_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c\xbb\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
        
        files = {
            "file": ("load_test_receipt.png", fake_receipt_png, "image/png")
        }
        
        data = {
            "custom_fields": json.dumps({
                "expense_category": "Determine category for corporate compliance tracing.",
                "is_business_expense": "True/False check."
            })
        }
        
        headers = {}
        if os.environ.get("_ID_TOKEN"):
            headers["Authorization"] = f"Bearer {os.environ['_ID_TOKEN']}"

        # POST to our actual, custom FastAPI document understanding route surface
        with self.client.post(
            "/api/extract",
            headers=headers,
            files=files,
            data=data,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    res_json = response.json()
                    if res_json.get("success") is True:
                        response.success()
                    else:
                        response.failure(f"API response success is False: {res_json.get('error', 'Unknown')}")
                except Exception as e:
                    response.failure(f"Failed to parse response JSON: {str(e)}")
            elif response.status_code == 422:
                response.failure(f"Unprocessable entity, check multi-part boundaries: {response.text}")
            elif response.status_code == 403:
                response.failure(f"Forbidden, authentication or CORS middleware block: {response.text}")
            else:
                response.failure(f"Server returned unexpected HTTP status code: {response.status_code}")
