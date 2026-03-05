import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { RotateCcw, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Flashcard } from "./types";
import { apiReviewFlashcard } from "@/lib/api";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  sectionTitle: string;
}

export default function FlashcardViewer({
  flashcards,
  sectionTitle,
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const card = flashcards[currentIndex];
  const total = flashcards.length;
  const answered = Object.keys(results).length;
  const correctCount = Object.values(results).filter(Boolean).length;
  const isFinished = answered === total;

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  const handleReview = useCallback(
    (correct: boolean) => {
      if (!card) return;
      setResults((prev) => ({ ...prev, [card.id]: correct }));
      // Persist review to server (fire-and-forget)
      apiReviewFlashcard(card.id, correct).catch(() => {});
      setIsFlipped(false);
      if (currentIndex < total - 1) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 250);
      }
    },
    [card, currentIndex, total]
  );

  const resetDeck = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
  }, []);

  if (!card) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No flashcards available.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Flashcards</h2>
          <p className="text-xs text-zinc-500">{sectionTitle}</p>
        </div>
        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
          {answered}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500"
          animate={{ width: `${(answered / total) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Card */}
      {!isFinished ? (
        <>
          <div
            onClick={flip}
            className="group perspective-[1000px] cursor-pointer"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              className="relative h-64 w-full transform-3d"
            >
              {/* Front */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center backface-hidden">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-500">
                  Question
                </p>
                <p className="mt-4 text-lg font-medium text-white">
                  {card.front}
                </p>
                <p className="mt-6 text-xs text-zinc-600">
                  Click to reveal answer
                </p>
              </div>

              {/* Back */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8 text-center backface-hidden transform-[rotateY(180deg)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-500">
                  Answer
                </p>
                <p className="mt-4 text-base text-zinc-300 leading-relaxed">
                  {card.back}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Review controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleReview(false)}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
            >
              <X className="h-4 w-4" />
              Incorrect
            </button>
            <button
              onClick={() => handleReview(true)}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              <Check className="h-4 w-4" />
              Correct
            </button>
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between">
            <button
              disabled={currentIndex === 0}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex((i) => i - 1);
              }}
              className="text-xs text-zinc-600 hover:text-zinc-300 disabled:opacity-30"
            >
              <ChevronLeft className="inline h-4 w-4" /> Prev
            </button>
            <span className="text-xs text-zinc-600">
              {currentIndex + 1} / {total}
            </span>
            <button
              disabled={currentIndex === total - 1}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex((i) => i + 1);
              }}
              className="text-xs text-zinc-600 hover:text-zinc-300 disabled:opacity-30"
            >
              Next <ChevronRight className="inline h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        /* Completion screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center"
        >
          <div className="text-4xl">🎉</div>
          <h3 className="mt-3 text-xl font-bold text-white">Deck Complete!</h3>
          <p className="mt-1 text-zinc-400">
            You got {correctCount} out of {total} correct
          </p>
          <button
            onClick={resetDeck}
            className="mt-5 flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <RotateCcw className="h-4 w-4" />
            Review Again
          </button>
        </motion.div>
      )}
    </div>
  );
}
