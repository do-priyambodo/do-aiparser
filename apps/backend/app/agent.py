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
import google.auth
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

# Initialize environment setup for Vertex AI
_, project_id = google.auth.default()
os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"


# 📋 Pydantic Schemas for Structured Receipt Extraction


class MerchantDetails(BaseModel):
    name: str = Field(description="The name of the merchant or store.")
    address: Optional[str] = Field(
        default=None,
        description="The full address of the merchant/store, or null if not visible.",
    )
    phone: Optional[str] = Field(
        default=None,
        description="The phone number of the merchant, or null if not present.",
    )
    website: Optional[str] = Field(
        default=None,
        description="The website URL of the merchant, or null if not present.",
    )


class TransactionMeta(BaseModel):
    date: Optional[str] = Field(
        default=None,
        description="The transaction date in YYYY-MM-DD format, or null if not present.",
    )
    time: Optional[str] = Field(
        default=None,
        description="The transaction time in HH:MM:SS format, or null if not present.",
    )
    invoice_number: Optional[str] = Field(
        default=None,
        description="The invoice or receipt reference number, or null if not present.",
    )


class FinancialSummary(BaseModel):
    currency: str = Field(
        description="The currency code (e.g., USD, MYR, EUR, SGD, IDR) used in the transaction."
    )
    subtotal: float = Field(
        description="The subtotal amount before taxes, discounts, or service fees."
    )
    tax_amount: float = Field(description="The total tax or VAT/GST amount.")
    service_charge: Optional[float] = Field(
        default=0.0, description="The service fee, tip, or service charge amount."
    )
    discount: Optional[float] = Field(
        default=0.0, description="The total discount applied, or null/0.0 if none."
    )
    total_amount: float = Field(
        description="The grand total amount paid (subtotal + tax + service_charge - discount)."
    )


class PaymentMeta(BaseModel):
    method: Optional[str] = Field(
        default=None,
        description="Payment method (e.g., Cash, Credit Card, Visa, Mastercard, Amex, Debit).",
    )
    card_last_4: Optional[str] = Field(
        default=None,
        description="The last 4 digits of the credit/debit card used, if present.",
    )


class LineItem(BaseModel):
    description: str = Field(
        description="The product name, service description, or line item details."
    )
    quantity: float = Field(
        description="The number of items purchased. If not explicitly listed, deduce or assume 1.0."
    )
    unit_price: float = Field(description="The individual price per single unit.")
    total_price: float = Field(
        description="The total cost for this specific line item (quantity * unit_price)."
    )


class ReceiptExtractionSchema(BaseModel):
    merchant: MerchantDetails
    transaction: TransactionMeta
    financials: FinancialSummary
    payment: PaymentMeta
    line_items: List[LineItem]
    custom_extra_fields: Dict[str, Any] = Field(
        default_factory=dict,
        description="A key-value dictionary to hold any custom fields or descriptors requested dynamically via prompt instructions.",
    )


# 🤖 AI Agent Definition for Document Ingestion

SYSTEM_INSTRUCTION = """
You are a world-class AI receipt parsing specialist and document understanding expert.
Your sole responsibility is to analyze the provided multimodal file (image or PDF) representing a customer invoice, receipt, bill, or voucher, and extract all data into the strict target JSON schema.

### Extraction Rules:
1. **Accuracy**: Extract text values precisely as they appear on the document.
2. **Line Items**: Parse all individual products or items in the receipt. Compute missing values if necessary.
3. **Handling Nulls**: If a non-mandatory string field is missing or illegible, output `null` instead of omitting it.
4. **Dynamic Custom Extra Fields**: If the user text explicitly requests additional custom fields to extract (e.g. categorizing the expense or finding specific identifiers), extract or deduce them and populate them directly into the `custom_extra_fields` map.
5. **No Preamble**: Return the data strictly using the output schema constraints without extra formatting text.
"""

root_agent = Agent(
    name="receipt_extractor_agent",
    model=Gemini(
        model="gemini-2.5-flash",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=SYSTEM_INSTRUCTION,
    output_schema=ReceiptExtractionSchema,
    output_key="extraction_result",
)

app = App(
    root_agent=root_agent,
    name="app",
)
