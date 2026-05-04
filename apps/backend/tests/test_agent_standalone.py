import asyncio
import json
import os
import sys

# Ensure apps/backend is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agent import root_agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types


async def main():
    # 1. Path to the receipt file
    project_root = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    )
    receipt_path = os.path.join(project_root, "test-data", "receipt.png")

    if not os.path.exists(receipt_path):
        print(f"❌ Error: Receipt image not found at {receipt_path}")
        sys.exit(1)

    print(f"✨ Found receipt image at: {receipt_path}")

    # 2. Read file bytes
    with open(receipt_path, "rb") as f:
        file_bytes = f.read()

    file_mime = "image/png"

    # 3. Prepare user prompt text and custom fields description
    custom_fields = {
        "expense_category": "Deduce whether this is Food/Beverage, Software, Travel, Utilities, or Office Supplies.",
        "is_business_expense": "Boolean indicating if this is a legitimate corporate or client entertainment meal expense.",
        "tax_percentage_deduced": "Deduced tax rate or percentage applied, e.g. '9.5%'",
    }

    prompt_text = (
        "Please extract all standard information from this receipt or invoice."
    )
    fields_formatted = json.dumps(custom_fields, indent=2)
    prompt_text += f"\n\nAdditionally, please identify, deduce, or extract the following custom fields and map their names/values inside the 'custom_extra_fields' output dictionary object exactly:\n{fields_formatted}"

    print("📝 Prompt formulated:\n", prompt_text)
    print("\n🚀 Invoking Gemini ADK Agent...")

    # 4. Setup stateless session and runner
    session_service = InMemorySessionService()
    user_id = "standalone_test_user"
    session_id = "test_session_123"

    await session_service.create_session(
        app_name="app", user_id=user_id, session_id=session_id
    )
    runner = Runner(agent=root_agent, app_name="app", session_service=session_service)

    # 5. Prepare multimodal inputs
    file_part = types.Part(inline_data=types.Blob(mime_type=file_mime, data=file_bytes))
    text_part = types.Part.from_text(text=prompt_text)

    new_message = types.Content(role="user", parts=[file_part, text_part])

    # 6. Run the agent and consume stream events
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=new_message
    ):
        print(f"\n[Event] type={type(event)} repr={repr(event)}")

    print("\n\n✅ Agent execution finished!")

    # 7. Load session to inspect state
    session = await session_service.get_session(
        app_name="app", user_id=user_id, session_id=session_id
    )
    extraction_result = session.state.get("extraction_result")

    if not extraction_result:
        print("❌ Failure: No extraction result found in session state!")
        sys.exit(1)

    print("\n🎉 --- EXTRACTION RESULT --- 🎉")
    print(json.dumps(extraction_result, indent=2))
    print("--------------------------------")


if __name__ == "__main__":
    asyncio.run(main())
