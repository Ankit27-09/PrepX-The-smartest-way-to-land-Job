import { useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import {
  Upload,
  FileText,
  Send,
  Loader2,
  Image as ImageIcon,
  X,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { apiUploadPdfFiles, apiQueryPdfChat } from "@/lib/api";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface RelevantImage {
  filename: string;
  pdf_source: string;
  page_number: number;
  image_index: number;
  preview_url: string;
  base64_preview?: string;
}

interface UploadDetails {
  text_chunks: number;
  images_uploaded: number;
  images_extracted_from_pdf: number;
  total_images: number;
  message: string;
  images: RelevantImage[];
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function PdfChatPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [querying, setQuerying] = useState(false);
  const [relevantImages, setRelevantImages] = useState<RelevantImage[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/jpg"]);

  /* ── Helpers ────────────────────────────────────────────────────────── */

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) => ALLOWED.has(f.type));
    setFiles((prev) => [...prev, ...valid]);
    setUploadError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); addFiles(e.dataTransfer.files); },
    [addFiles],
  );

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  /* ── Upload ─────────────────────────────────────────────────────────── */

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const data = await apiUploadPdfFiles(files);
      setUploadDetails({
        text_chunks: data.text_chunks,
        images_uploaded: data.images_uploaded,
        images_extracted_from_pdf: data.images_extracted_from_pdf,
        total_images: data.total_images,
        message: data.message,
        images: data.images,
      });
      setFiles([]);
      setAnswer("");
      setRelevantImages([]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ── Query ──────────────────────────────────────────────────────────── */

  const handleQuery = async () => {
    const q = query.trim();
    if (!q || querying) return;
    setQuerying(true);
    setAnswer("");
    setRelevantImages([]);
    try {
      const data = await apiQueryPdfChat(q);
      setAnswer(data.answer);
      setRelevantImages(data.relevant_images ?? []);
    } catch (err: unknown) {
      setAnswer(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setQuerying(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-125 w-200 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Header ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold text-white">
            PDF Chat Assistant
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            Upload PDFs and images, then ask questions about the content
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-cyan-400" /> PDF Processing
            </span>
            <span className="flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-violet-400" /> Image Extraction
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-400" /> AI-Powered Q&A
            </span>
          </div>
        </motion.div>

        {/* ── Two-column grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ── Left: Upload Documents ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
          >
            {/* Card header */}
            <div className="bg-linear-to-r from-cyan-600 to-cyan-500 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Upload className="h-5 w-5" />
                Upload Documents
              </h2>
            </div>

            <div className="space-y-4 p-6">
              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-white/15 p-10 transition-colors hover:border-cyan-500/50 hover:bg-white/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Choose files or drag and drop</p>
                  <p className="mt-1 text-xs text-zinc-500">PDF, JPG, JPEG, PNG files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>

              {/* Selected files */}
              {files.length > 0 && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Selected Files
                  </h4>
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-zinc-300 truncate">
                        {f.type === "application/pdf" ? (
                          <FileText className="h-4 w-4 shrink-0 text-red-400" />
                        ) : (
                          <ImageIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                        )}
                        <span className="truncate">{f.name}</span>
                        <span className="ml-auto shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                          {f.name.toLowerCase().endsWith(".pdf") ? "PDF" : "Image"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="ml-2 shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </>
                )}
              </button>

              {/* Error */}
              {uploadError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              {/* Upload success */}
              {uploadDetails && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {uploadDetails.message}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Text chunks", value: uploadDetails.text_chunks },
                      { label: "Images uploaded", value: uploadDetails.images_uploaded },
                      { label: "Images extracted", value: uploadDetails.images_extracted_from_pdf },
                      { label: "Total images", value: uploadDetails.total_images },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <p className="text-[11px] text-zinc-500">{s.label}</p>
                        <p className="text-lg font-bold text-cyan-400">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setUploadDetails(null); setAnswer(""); setRelevantImages([]); }}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    Upload new files
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Right: Ask Questions ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
          >
            {/* Card header */}
            <div className="bg-linear-to-r from-violet-600 to-violet-500 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <MessageSquare className="h-5 w-5" />
                Ask Questions
              </h2>
            </div>

            <div className="space-y-4 p-6">
              {/* Query input */}
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your question here… (e.g., 'What does the chart show?', 'Summarize the document', 'Show me relevant images', etc.)"
                rows={6}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-cyan-500/50"
              />

              {/* Ask button */}
              <button
                onClick={handleQuery}
                disabled={querying || !query.trim() || !uploadDetails}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {querying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Ask Question
                  </>
                )}
              </button>

              {!uploadDetails && (
                <p className="text-center text-xs text-zinc-600">
                  Upload documents first to enable Q&A
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Answer Section ─────────────────────────────────────────── */}
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
          >
            <div className="bg-linear-to-r from-emerald-600 to-emerald-500 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Sparkles className="h-5 w-5" />
                Answer
              </h2>
            </div>

            <div className="p-6">
              <div className="rounded-xl border-l-4 border-cyan-500 bg-white/5 p-6">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed text-zinc-300 prose-headings:text-white prose-strong:text-white prose-a:text-cyan-400">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children, ...props }) => <h1 className="mb-4 mt-6 text-2xl font-bold text-white first:mt-0" {...props}>{children}</h1>,
                      h2: ({ children, ...props }) => <h2 className="mb-3 mt-5 text-xl font-semibold text-white first:mt-0" {...props}>{children}</h2>,
                      h3: ({ children, ...props }) => <h3 className="mb-2 mt-4 text-lg font-medium text-white first:mt-0" {...props}>{children}</h3>,
                      p: ({ children, ...props }) => <p className="mb-4 leading-relaxed text-zinc-300" {...props}>{children}</p>,
                      ul: ({ children, ...props }) => <ul className="mb-4 list-disc list-inside space-y-1 text-zinc-300" {...props}>{children}</ul>,
                      ol: ({ children, ...props }) => <ol className="mb-4 list-decimal list-inside space-y-1 text-zinc-300" {...props}>{children}</ol>,
                      li: ({ children, ...props }) => <li className="leading-relaxed text-zinc-300" {...props}>{children}</li>,
                      blockquote: ({ children, ...props }) => <blockquote className="mb-3 border-l-4 border-cyan-500/50 pl-4 italic text-zinc-400" {...props}>{children}</blockquote>,
                      strong: ({ children, ...props }) => <strong className="font-semibold text-white" {...props}>{children}</strong>,
                      a: ({ children, ...props }) => <a className="text-cyan-400 underline transition-colors hover:text-cyan-300" {...props}>{children}</a>,
                      table: ({ children, ...props }) => (
                        <div className="mb-4 overflow-x-auto">
                          <table className="w-full border-collapse overflow-hidden rounded-lg border border-white/10" {...props}>{children}</table>
                        </div>
                      ),
                      thead: ({ children, ...props }) => <thead className="bg-white/10" {...props}>{children}</thead>,
                      th: ({ children, ...props }) => <th className="border border-white/10 p-3 text-left font-semibold text-white" {...props}>{children}</th>,
                      td: ({ children, ...props }) => <td className="border border-white/10 p-3 text-zinc-300" {...props}>{children}</td>,
                      hr: ({ ...props }) => <hr className="my-6 border-white/10" {...props} />,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const lang = match ? match[1] : "";
                        const isInline = !match;
                        const codeStr = String(children).replace(/\n$/, "");

                        return isInline ? (
                          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-cyan-300" {...props}>
                            {children}
                          </code>
                        ) : (
                          <div className="group relative mb-4">
                            <button
                              onClick={() => copyToClipboard(codeStr)}
                              className="absolute right-2 top-2 z-10 rounded-lg bg-white/10 p-2 text-zinc-400 opacity-0 transition-opacity hover:bg-white/20 hover:text-white group-hover:opacity-100"
                              title="Copy code"
                            >
                              {copiedCode === codeStr ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={lang}
                              PreTag="div"
                              customStyle={{
                                backgroundColor: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                padding: "16px",
                                fontSize: "13px",
                              }}
                            >
                              {codeStr}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                    }}
                  >
                    {answer}
                  </ReactMarkdown>
                </div>
              </div>

              {relevantImages.length > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <strong>Note:</strong>&nbsp;{relevantImages.length} relevant image(s) found and used in generating this answer.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Relevant Images Section ────────────────────────────────── */}
        {relevantImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
          >
            <div className="bg-linear-to-r from-amber-600 to-amber-500 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <ImageIcon className="h-5 w-5" />
                Relevant Images Found
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relevantImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-shadow hover:shadow-lg hover:shadow-cyan-500/5"
                  >
                    <div className="flex aspect-video items-center justify-center bg-black/30">
                      {img.base64_preview ? (
                        <img
                          src={`data:image/png;base64,${img.base64_preview}`}
                          alt={`Relevant ${idx + 1}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <img
                          src={img.preview_url}
                          alt={`Relevant ${idx + 1}`}
                          className="h-full w-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>
                    <div className="border-t border-white/10 bg-white/5 px-4 py-3">
                      <p className="truncate text-sm font-medium text-white">{img.filename}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Source: {img.pdf_source}
                        {img.page_number ? ` · Page ${img.page_number}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
