import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import type { ArticlePage } from "./types";
import { apiMarkArticleRead } from "@/lib/api";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ArticleViewProps {
  pages: ArticlePage[];
  sectionTitle: string;
}

/** Parse content into blocks: paragraphs, headings, lists, code blocks, etc. */
function parseBlocks(content: string) {
  const normalized = content.replace(/\\n/g, "\n");
  const lines = normalized.split("\n");
  const blocks: Array<
    | { type: "heading"; level: number; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list-item"; ordered: boolean; text: string }
    | { type: "code"; lang: string; code: string }
    | { type: "blank" }
  > = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Code block: collect everything between ``` markers
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", lang: lang || "text", code: codeLines.join("\n") });
      continue;
    }

    if (!trimmed) {
      blocks.push({ type: "blank" });
    } else if (trimmed.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: trimmed.slice(4) });
    } else if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: trimmed.slice(3) });
    } else if (trimmed.startsWith("# ")) {
      blocks.push({ type: "heading", level: 1, text: trimmed.slice(2) });
    } else if (trimmed.startsWith("- ")) {
      blocks.push({ type: "list-item", ordered: false, text: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ type: "list-item", ordered: true, text: trimmed.replace(/^\d+\.\s/, "") });
    } else {
      blocks.push({ type: "paragraph", text: trimmed });
    }
    i++;
  }

  return blocks;
}

/** Markdown-style renderer with VS Code-like syntax-highlighted code blocks. */
function SimpleMarkdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="prose-invert max-w-none space-y-3 text-sm leading-relaxed text-zinc-300">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "blank":
            return <br key={i} />;
          case "heading":
            if (block.level === 1)
              return <h1 key={i} className="text-xl font-bold text-white mt-6">{block.text}</h1>;
            if (block.level === 2)
              return <h2 key={i} className="text-lg font-bold text-white mt-5">{block.text}</h2>;
            return <h3 key={i} className="text-base font-semibold text-white mt-4">{block.text}</h3>;
          case "list-item":
            return (
              <li key={i} className={`ml-4 ${block.ordered ? "list-decimal" : "list-disc"} text-zinc-400`}>
                {renderInline(block.text)}
              </li>
            );
          case "code":
            return (
              <div key={i} className="rounded-xl border border-white/10 overflow-hidden my-4">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-white/5">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{block.lang}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(block.code)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language={block.lang}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: "1rem 1.25rem",
                    background: "#1e1e1e",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    borderRadius: 0,
                  }}
                  showLineNumbers
                  lineNumberStyle={{ color: "#555", fontSize: "12px", paddingRight: "1em", minWidth: "2em" }}
                >
                  {block.code}
                </SyntaxHighlighter>
              </div>
            );
          case "paragraph":
            return <p key={i}>{renderInline(block.text)}</p>;
        }
      })}
    </div>
  );
}

/** Inline bold / code renderer */
function renderInline(text: string) {
  // Very simple — handles **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

export default function ArticleView({
  pages,
  sectionTitle,
}: ArticleViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const page = pages[currentPage];
  const markedRef = useRef<Set<string>>(new Set());

  // Mark article page as read when viewed
  useEffect(() => {
    if (page && !page.isRead && !markedRef.current.has(page.id)) {
      markedRef.current.add(page.id);
      apiMarkArticleRead(page.id).catch(() => {});
    }
  }, [page]);

  if (!page) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No article content available.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <BookOpen className="h-3.5 w-3.5" />
        <span>{sectionTitle}</span>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400">{page.pageTitle}</span>
      </div>

      {/* Article card */}
      <motion.div
        key={page.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{page.pageTitle}</h1>
          {page.isRead && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Read
            </span>
          )}
        </div>

        <SimpleMarkdown content={page.content} />
      </motion.div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          disabled={currentPage === 0}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <span className="text-xs text-zinc-600">
          Page {currentPage + 1} of {pages.length}
        </span>

        <button
          disabled={currentPage === pages.length - 1}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
