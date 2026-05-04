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

import os
import uuid
import json
import datetime
import time
import google.auth
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.adk.cli.fast_api import get_fast_api_app
from google.cloud import logging as google_cloud_logging

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.app_utils.telemetry import setup_telemetry
from app.app_utils.typing import Feedback
from app.agent import root_agent

# Configure telemetry and logging
setup_telemetry()
_, project_id = google.auth.default()
logging_client = google_cloud_logging.Client()
logger = logging_client.logger(__name__)

allow_origins = (
    os.getenv("ALLOW_ORIGINS", "").split(",")
    if os.getenv("ALLOW_ORIGINS")
    else [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://172.17.251.230:3000",
    ]
)

logs_bucket_name = os.environ.get("LOGS_BUCKET_NAME")
AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
session_service_uri = None
artifact_service_uri = f"gs://{logs_bucket_name}" if logs_bucket_name else None

# Initialize standard ADK FastAPI wrapper application
app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=False,
    artifact_service_uri=artifact_service_uri,
    allow_origins=allow_origins if allow_origins != ["*"] else None,
    session_service_uri=session_service_uri,
    otel_to_cloud=True,
)


app.title = "do-aiparser"
app.description = (
    "High-Fidelity Document Understanding & Structured Parsing Service via Google ADK"
)

# 🔌 Wire up robust CORSMiddleware for sandbox/cross-origin browser client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_origins == ["*"] else allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi import Request

@app.middleware("http")
async def log_incoming_requests(request: Request, call_next):
    import time
    # Log method, URL, and headers to GCP Cloud Logging
    logger.log_text(f"🚀 [CORS/HTTP Debug] Method: {request.method} | URL: {request.url}", severity="INFO")
    try:
        headers_dict = dict(request.headers)
        logger.log_text(f"📋 [Headers Debug] {json.dumps(headers_dict, indent=2)}", severity="INFO")
    except Exception as ex:
        logger.log_text(f"⚠️ Failed to dump request headers: {str(ex)}", severity="WARNING")
    
    start_perf = time.perf_counter()
    response = await call_next(request)
    latency = time.perf_counter() - start_perf
    
    logger.log_text(f"🔄 [Response Debug] Status: {response.status_code} | Latency: {round(latency, 3)}s", severity="INFO")
    return response


# 📁 Custom Multipart Upload & AI Extraction Endpoint



@app.post("/api/extract")
async def extract_receipt(
    file: UploadFile = File(
        ..., description="The binary receipt or invoice image/PDF file to process."
    ),
    custom_fields: str | None = Form(
        None, description="Stringified custom instruction or tags to extract."
    ),
):
    """Ingest a receipt image or PDF, invoke the Gemini ADK Agent, and extract structured JSON metadata."""
    try:
        # 1. Read file bytes and determine mime type
        file_bytes = await file.read()
        file_mime = file.content_type or "image/jpeg"

        if not file_bytes:
            raise HTTPException(
                status_code=400, detail="Uploaded file is completely empty."
            )

        # 2. Formulate prompt instructions for standard + custom fields
        prompt_text = (
            "Please extract all standard information from this receipt or invoice."
        )
        if custom_fields:
            try:
                # Validate or pretty-print if it is JSON, otherwise append raw string
                parsed_fields = json.loads(custom_fields)
                fields_formatted = json.dumps(parsed_fields, indent=2)
                prompt_text += f"\n\nAdditionally, please identify, deduce, or extract the following custom fields and map their names/values inside the 'custom_extra_fields' output dictionary object exactly:\n{fields_formatted}"
            except json.JSONDecodeError:
                prompt_text += f"\n\nAdditionally, please extract these extra custom fields and map them into the 'custom_extra_fields' directory object exactly:\n{custom_fields}"

        # 3. Create a stateless in-memory session for the extraction request
        session_service = InMemorySessionService()
        user_id = "system_extractor"
        session_id = f"extract_{uuid.uuid4()}"

        await session_service.create_session(
            app_name="app", user_id=user_id, session_id=session_id
        )

        # 4. Initialize the ADK execution Runner
        runner = Runner(
            agent=root_agent, app_name="app", session_service=session_service
        )

        # 5. Construct the multimodal content payload parts
        file_part = types.Part(
            inline_data=types.Blob(mime_type=file_mime, data=file_bytes)
        )
        text_part = types.Part.from_text(text=prompt_text)

        new_message = types.Content(role="user", parts=[file_part, text_part])

        # 6. Execute the agent invocation thread synchronously in-process
        start_perf = time.perf_counter()
        prompt_tokens = 0
        candidate_tokens = 0
        total_tokens = 0

        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=new_message
        ):
            # Look for token usage in the event
            usage = getattr(event, "usage_metadata", None)
            if usage:
                prompt_tokens = getattr(usage, "prompt_token_count", prompt_tokens)
                candidate_tokens = getattr(
                    usage, "candidates_token_count", candidate_tokens
                )
                total_tokens = getattr(usage, "total_token_count", total_tokens)

        latency_seconds = time.perf_counter() - start_perf

        # 7. Reload the stateless session state to extract final output schemas
        session = await session_service.get_session(
            app_name="app", user_id=user_id, session_id=session_id
        )
        extraction_result = session.state.get("extraction_result")

        if not extraction_result:
            raise HTTPException(
                status_code=500,
                detail="Gemini ADK Agent failed to produce a structured extraction block. Check server logs.",
            )

        # Append structured extraction metrics to extraction.log
        try:
            merchant_name = "Unknown"
            if isinstance(extraction_result, dict):
                merchant_name = extraction_result.get("merchant", {}).get(
                    "name", "Unknown"
                )
            elif hasattr(extraction_result, "merchant"):
                merchant_name = getattr(extraction_result.merchant, "name", "Unknown")

            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            log_file_path = os.path.join(backend_dir, "extraction.log")

            log_entry = {
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "session_id": session_id,
                "merchant_name": merchant_name,
                "prompt_tokens": prompt_tokens,
                "candidate_tokens": candidate_tokens,
                "total_tokens": total_tokens,
                "latency_seconds": round(latency_seconds, 3),
            }
            with open(log_file_path, "a") as log_f:
                log_f.write(json.dumps(log_entry) + "\n")
        except Exception as log_ex:
            logger.log_text(
                f"Failed to append to extraction.log: {str(log_ex)}", severity="WARNING"
            )

        # 8. Return structured success response object matching specifications
        return {
            "success": True,
            "session_id": session_id,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "data": extraction_result,
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.log_text(f"Unhandled extraction crash: {str(e)}", severity="ERROR")
        raise HTTPException(
            status_code=500, detail=f"Extraction engine unhandled error: {str(e)}"
        )


@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    """Collect and log feedback."""
    logger.log_struct(feedback.model_dump(), severity="INFO")
    return {"status": "success"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
