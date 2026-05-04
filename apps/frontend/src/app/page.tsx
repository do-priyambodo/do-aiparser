"use client";

import * as React from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Copy, 
  Plus, 
  X, 
  AlertCircle, 
  FileCode, 
  RefreshCw, 
  Store, 
  Calendar, 
  CreditCard, 
  Layers, 
  Tag
} from "lucide-react";


// Initial default custom fields to inspire the user
const DEFAULT_CUSTOM_FIELDS = [
  { id: "cf_1", key: "expense_category", desc: "Determine if this belongs to Food, Lodging, Software, Transport, or Utilities" },
  { id: "cf_2", key: "is_business_expense", desc: "True/False: Deduce if this transaction appears to be corporate travel or a business meal" }
];

export default function Home() {
  // 🔄 Application State
  const [file, setFile] = React.useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = React.useState<string | null>(null);
  const [customFields, setCustomFields] = React.useState(DEFAULT_CUSTOM_FIELDS);
  
  // Form fields for creating new custom tags
  const [newKey, setNewKey] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  
  // Execution State
  const [isExtracting, setIsExtracting] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [extractionData, setExtractionData] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  // UI Polish States
  const [copied, setCopied] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // 📂 Handle Drag and Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);
    // Basic validation: accept standard image formats or PDFs
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Invalid file format. Please upload a receipt image (PNG/JPEG/WebP) or a PDF.");
      return;
    }
    
    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(previewUrl);
  };

  // 🏷️ Manage Custom Extraction Tags
  const addCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    
    // Normalize the key string to valid snake_case
    const sanitizedKey = newKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_");

    if (customFields.some(f => f.key === sanitizedKey)) {
      setError(`A custom field with the key '${sanitizedKey}' already exists.`);
      return;
    }

    setCustomFields([
      ...customFields,
      {
        id: `cf_${Date.now()}`,
        key: sanitizedKey,
        desc: newDesc.trim() || `Extract data for ${sanitizedKey}`
      }
    ]);
    
    setNewKey("");
    setNewDesc("");
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  // 🚀 Trigger AI Extraction API
  const triggerExtraction = async () => {
    if (!file) return;
    
    setIsExtracting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Convert fields into an instruction dictionary block for backend ingestion
      if (customFields.length > 0) {
        const fieldsMap: Record<string, string> = {};
        customFields.forEach(f => {
          fieldsMap[f.key] = f.desc;
        });
        formData.append("custom_fields", JSON.stringify(fieldsMap));
      }

      // Connect to standard backend server port mapped in environment
      let backendUrl = "http://localhost:8000";
      if (typeof window !== "undefined") {
        const currentOrigin = window.location.origin;
        if (currentOrigin.includes("-frontend-prod")) {
          backendUrl = currentOrigin.replace("-frontend-prod", "");
        } else if (currentOrigin.includes("-frontend-staging")) {
          backendUrl = currentOrigin.replace("-frontend-staging", "");
        } else if (currentOrigin.includes("-frontend")) {
          backendUrl = currentOrigin.replace("-frontend", "");
        } else if (process.env.NEXT_PUBLIC_BACKEND_URL) {
          backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL.startsWith("http")
            ? process.env.NEXT_PUBLIC_BACKEND_URL
            : `https://${process.env.NEXT_PUBLIC_BACKEND_URL}`;
        }
      }





        
      const res = await fetch(`${backendUrl}/api/extract`, {
        method: "POST",
        body: formData,
        // Skip Content-Type header so browser sets boundaries automatically for FormData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with HTTP status ${res.status}`);
      }

      const payload = await res.json();
      if (payload.success && payload.data) {
        setExtractionData(payload.data);
      } else {
        throw new Error("Failed to fetch structured extraction block from backend.");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setError((err as Error).message || "A network error occurred while connecting to the extraction backend.");
    } finally {
      setIsExtracting(false);
    }
  };

  // 📋 Copy Raw JSON to Clipboard
  const copyToClipboard = () => {
    if (!extractionData) return;
    navigator.clipboard.writeText(JSON.stringify(extractionData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🔄 Reset Application Canvas
  const resetCanvas = () => {
    setFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl(null);
    setExtractionData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F] transition-colors duration-300 selection:bg-blue-500 selection:text-white">
      
      {/* 🖥️ Top Minimalist Apple Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/70 backdrop-blur-md px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm shadow-blue-600/30">
            do
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-950">do-aiparser</h1>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Multimodal AI Parser</p>
          </div>
        </div>
        <div className="text-[11px] text-zinc-400 font-medium">
          Powered by <span className="font-semibold text-zinc-600">Gemini ADK</span> & FastAPI
        </div>
      </header>

      {/* ⚡ Main Application Workspace */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col">
        
        {/* ⚠️ Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200/60 text-red-800 text-xs font-medium flex items-start gap-2 shadow-sm animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Extraction Blocked:</span> {error}
            </div>
          </div>
        )}

        {!extractionData ? (
          /* 🚀 STAGE 1: Scaffolding, Dropzone, and Custom Config */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
            
            {/* Left Box: Dropzone Upload Canvas (7 columns) */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`glass-card flex-1 flex flex-col items-center justify-center p-10 min-h-[400px] text-center border-2 border-dashed transition-all duration-300 cursor-pointer group relative ${
                  isDragging 
                    ? "border-blue-600 bg-blue-50/20 scale-[0.99] ring-4 ring-blue-500/10" 
                    : file 
                      ? "border-zinc-200/60 bg-white/90" 
                      : "border-zinc-300 hover:border-blue-500 hover:bg-white"
                }`}
              >
                <input 
                  id="receipt-upload-input"
                  type="file" 
                  accept="image/png, image/jpeg, image/webp, application/pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={isExtracting}
                />

                {isExtracting ? (
                  /* Loader state overlay */
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Analyzing Document</h3>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                        Gemini 2.5 Flash is ingesting the file, parsing dense text blocks, and mapping fields into strict JSON models...
                      </p>
                    </div>
                    <div className="w-32 h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-blue-600 rounded-full w-2/3 animate-bounce" />
                    </div>
                  </div>
                ) : file ? (
                  /* Preview uploaded file state */
                  <div className="w-full flex flex-col items-center justify-between h-full space-y-6 z-20">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (filePreviewUrl) window.open(filePreviewUrl, "_blank");
                      }}
                      title="Click to view full document in new tab"
                      className="max-w-md w-full rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-50 relative max-h-[320px] flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-600/40 transition-all duration-200"
                    >
                      {file.type === "application/pdf" ? (
                        <div className="p-10 flex flex-col items-center gap-3 text-zinc-500 py-16">
                          <FileText className="w-16 h-16 text-red-500 animate-bounce" />
                          <span className="text-xs font-bold truncate max-w-xs">{file.name}</span>
                          <span className="text-[10px] font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">PDF Document</span>
                        </div>
                      ) : (
                        <img 
                          src={filePreviewUrl || ""} 
                          alt="Receipt Preview" 
                          className="w-full object-contain max-h-[320px] transition-transform duration-500 hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-800 truncate max-w-sm">{file.name}</p>
                      <p className="text-[10px] font-semibold text-zinc-400 font-numeric">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB · Click or drop another to replace
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerExtraction();
                      }}
                      className="px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transform transition-all flex items-center gap-2 relative z-30"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Extract Structured JSON
                    </button>
                  </div>
                ) : (
                  /* Empty standard state */
                  <div className="space-y-4 flex flex-col items-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center border border-zinc-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors duration-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-800">Upload invoice or receipt</h3>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                        Drag and drop your image (PNG, JPEG, WebP) or PDF invoice here, or click to browse files.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100/80">
                      Supports Multimodal Ingestion
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Dynamic Custom Fields Panel (5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card bg-white/80 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Dynamic Extraction Tags</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-5">
                  Define custom fields you want the Gemini ADK agent to locate or deduce (e.g. expense classification, billing codes, VAT compliance flags).
                </p>

                {/* Form to create new tag */}
                <form onSubmit={addCustomField} className="space-y-3 mb-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200/50">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wide mb-1">Field Key (snake_case)</label>
                    <input 
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="e.g. project_code, vat_compliant"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono placeholder:font-sans"
                      disabled={isExtracting}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wide mb-1">Extraction Guidance / Description</label>
                    <input 
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="e.g. Find the project code like PROJ-123, or null"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500"
                      disabled={isExtracting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newKey.trim() || isExtracting}
                    className="w-full py-2 bg-zinc-900 hover:bg-black text-white rounded-lg font-bold text-xs disabled:opacity-40 transition-colors active:scale-[0.98] transform flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Field Descriptor
                  </button>
                </form>

                {/* List of active custom tags */}
                <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                  {customFields.length === 0 ? (
                    <div className="text-center text-xs text-zinc-400 italic py-6 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                      No custom fields added. Standard fields will be extracted.
                    </div>
                  ) : (
                    customFields.map((field) => (
                      <div key={field.id} className="flex items-start justify-between p-3 bg-white rounded-xl border border-zinc-200/60 shadow-2xs group/item">
                        <div className="space-y-1 max-w-[88%]">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded-md border border-blue-100">
                            {field.key}
                          </span>
                          <p className="text-[11px] text-zinc-500 leading-tight">{field.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          className="text-zinc-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 opacity-0 group-hover/item:opacity-100 transition-all duration-200"
                          disabled={isExtracting}
                          title="Delete tag"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* 🖥️ STAGE 2: SPLIT VIEW VISUALIZATION CANVAS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start animate-fadeIn">
            
            {/* LEFT COLUMN: Original Document Canvas (5 columns) */}
            <div className="lg:col-span-5 flex flex-col lg:sticky lg:top-24">
              <div className="glass-card bg-white/90 p-5 space-y-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-zinc-950 truncate max-w-[180px]">{file?.name}</span>
                  </div>
                  <button
                    onClick={resetCanvas}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[10px] transition-colors flex items-center gap-1 active:scale-95 transform"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Extract Another
                  </button>
                </div>

                <div 
                  onClick={() => {
                    if (filePreviewUrl) window.open(filePreviewUrl, "_blank");
                  }}
                  title="Click to view full document in new tab"
                  className="max-w-md w-full rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-50 relative max-h-[320px] flex items-center justify-center overflow-y-auto custom-scrollbar mx-auto cursor-pointer hover:ring-2 hover:ring-blue-600/40 transition-all duration-200"
                >
                  {file?.type === "application/pdf" ? (
                    <iframe 
                      src={`${filePreviewUrl}#toolbar=0`} 
                      title="PDF Document Viewer" 
                      className="w-full h-[320px] border-none"
                    />
                  ) : (
                    <img 
                      src={filePreviewUrl || ""} 
                      alt="Receipt Document" 
                      className="w-full object-contain max-h-[320px]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Structured Extraction Intel Canvas (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card A: Financial Overview Snapshot */}
              <div className="glass-card bg-white/95 p-6">
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      {extractionData.merchant?.name || "Unknown Merchant"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    AI Parsing Complete
                  </span>
                </div>

                {/* Core Snapshot Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white/40 rounded-xl border border-zinc-200/50">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Total Amount</span>
                    <span className="text-base font-black text-blue-600 font-numeric">
                      {extractionData.financials?.currency === "MYR" ? "RM" : extractionData.financials?.currency === "USD" ? "$" : (extractionData.financials?.currency || "") + " "}
                      {extractionData.financials?.total_amount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Transaction Date</span>
                    <span className="text-xs font-bold text-zinc-800 font-numeric flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {extractionData.transaction?.date || "N/A"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Payment Method</span>
                    <span className="text-xs font-bold text-zinc-800 flex items-center gap-1 capitalize">
                      <CreditCard className="w-3 h-3 text-zinc-400" />
                      {extractionData.payment?.method || "N/A"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Tax Total</span>
                    <span className="text-xs font-bold text-zinc-800 font-numeric">
                      {extractionData.financials?.tax_amount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>

                {/* Merchant/Meta details drawer list */}
                <div className="mt-5 pt-4 border-t border-zinc-200/50 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {extractionData.merchant?.address && (
                    <div className="flex justify-between py-1 border-b border-zinc-100/50"><span className="text-zinc-400">Address:</span> <span className="text-zinc-700 font-medium text-right max-w-[70%] truncate">{extractionData.merchant.address}</span></div>
                  )}
                  {extractionData.merchant?.phone && (
                    <div className="flex justify-between py-1 border-b border-zinc-100/50"><span className="text-zinc-400">Phone:</span> <span className="text-zinc-700 font-numeric">{extractionData.merchant.phone}</span></div>
                  )}
                  {extractionData.transaction?.invoice_number && (
                    <div className="flex justify-between py-1 border-b border-zinc-100/50"><span className="text-zinc-400">Invoice / Ref #:</span> <span className="text-zinc-700 font-mono font-bold">{extractionData.transaction.invoice_number}</span></div>
                  )}
                  {extractionData.financials?.subtotal && (
                    <div className="flex justify-between py-1 border-b border-zinc-100/50"><span className="text-zinc-400">Subtotal:</span> <span className="text-zinc-700 font-numeric">{extractionData.financials.subtotal.toFixed(2)}</span></div>
                  )}
                </div>
              </div>

              {/* Card B: Dynamic Custom Extra Fields Badges */}
              {extractionData.custom_extra_fields && Object.keys(extractionData.custom_extra_fields).length > 0 && (
                <div className="glass-card bg-white/95 p-5 border-l-4 border-l-blue-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Dynamic Custom Extractions</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {Object.entries(extractionData.custom_extra_fields).map(([key, val]: [string, any]) => (
                      <div key={key} className={`p-3 rounded-xl border space-y-2 ${
                        val === true 
                          ? "bg-emerald-50/40 border-emerald-200/60" 
                          : val === false 
                            ? "bg-amber-50/40 border-amber-200/60" 
                            : "bg-zinc-50/50 border-zinc-200/60"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/40">
                            {key}
                          </span>
                          {typeof val === "boolean" && (
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              val ? "bg-emerald-100/80 text-emerald-800 border-emerald-200" : "bg-amber-100/80 text-amber-800 border-amber-200"
                            }`}>
                              {val ? "True" : "False"}
                            </span>
                          )}
                        </div>
                        {typeof val !== "boolean" && (
                          <div className="text-xs font-bold text-zinc-900 truncate pl-1">
                            {String(val || "null")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card C: Line Items Breakdown Table */}
              {extractionData.line_items && extractionData.line_items.length > 0 && (
                <div className="glass-card bg-white/95 p-5 overflow-hidden">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Line Itemized Breakdown</h4>
                  </div>
                  
                  <div className="overflow-x-auto custom-scrollbar -mx-5 px-5">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-400 uppercase text-[9px] tracking-wider font-bold">
                          <th className="py-2 pb-3 font-bold">Description</th>
                          <th className="py-2 pb-3 text-center font-bold">Qty</th>
                          <th className="py-2 pb-3 text-right font-bold">Unit Price</th>
                          <th className="py-2 pb-3 text-right font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {extractionData.line_items.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-zinc-100/80 hover:bg-zinc-50/80 transition-colors font-medium">
                            <td className="py-3 font-bold text-zinc-800 max-w-[220px] truncate" title={item.description}>
                              {item.description}
                            </td>
                            <td className="py-3 text-center font-numeric text-zinc-500">{item.quantity || 1}</td>
                            <td className="py-3 text-right font-numeric text-zinc-500">{item.unit_price?.toFixed(2) || "0.00"}</td>
                            <td className="py-3 text-right font-numeric font-bold text-zinc-900">{item.total_price?.toFixed(2) || "0.00"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Card D: Raw Schema Code Viewer block */}
              <div className="glass-card bg-[#1E1E24] border-none shadow-xl overflow-hidden p-5 relative">
                <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider border-b border-zinc-800/60 pb-3 mb-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <FileCode className="w-4 h-4" />
                    <span>Prism Structured JSON Output</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all duration-200 flex items-center gap-1.5 active:scale-95 transform border border-zinc-700/50"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Payload</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Display block */}
                <div className="overflow-x-auto custom-scrollbar text-left max-h-[300px]">
                  <pre className="text-emerald-400 font-mono text-xs leading-relaxed p-2">
                    <code>{JSON.stringify(extractionData, null, 2)}</code>
                  </pre>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* 🏷️ Bottom Apple Sticky Footer */}
      <footer className="h-10 border-t border-zinc-200/60 bg-white/40 text-center flex items-center justify-center text-[10px] text-zinc-400 font-medium">
        Created and maintained by{" "}
        <a 
          href="https://www.priyambodo.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-700 hover:underline transition-all mx-0.5"
        >
          www.priyambodo.com
        </a>{" "}
        · All rights reserved © 2026 · v2.0.0
      </footer>



      
    </div>
  );
}
