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

interface ArticleViewProps {
  pages: ArticlePage[];
  sectionTitle: string;
}

/** Very small Markdown-ish renderer (keeps things dependency-free). */
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="prose-invert max-w-none space-y-3 text-sm leading-relaxed text-zinc-300">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;
        if (trimmed.startsWith("### "))
          return (
            <h3 key={i} className="text-base font-semibold text-white mt-4">
              {trimmed.slice(4)}
            </h3>
          );
        if (trimmed.startsWith("## "))
          return (
            <h2 key={i} className="text-lg font-bold text-white mt-5">
              {trimmed.slice(3)}
            </h2>
          );
        if (trimmed.startsWith("# "))
          return (
            <h1 key={i} className="text-xl font-bold text-white mt-6">
              {trimmed.slice(2)}
            </h1>
          );
        if (trimmed.startsWith("- "))
          return (
            <li key={i} className="ml-4 list-disc text-zinc-400">
              {renderInline(trimmed.slice(2))}
            </li>
          );
        if (/^\d+\.\s/.test(trimmed)) {
          const text = trimmed.replace(/^\d+\.\s/, "");
          return (
            <li key={i} className="ml-4 list-decimal text-zinc-400">
              {renderInline(text)}
            </li>
          );
        }
        if (trimmed.startsWith("```"))
          return (
            <pre
              key={i}
              className="rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-cyan-300 overflow-x-auto"
            >
              {trimmed.replace(/```\w*/, "")}
            </pre>
          );
        return <p key={i}>{renderInline(trimmed)}</p>;
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
