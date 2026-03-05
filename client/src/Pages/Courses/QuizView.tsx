import { useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { Check, X, Send } from "lucide-react";
import type {
  McqQuestion,
  TrueFalseQuestion,
  FillUpQuestion,
} from "./types";
import {
  apiSubmitMcqAnswer,
  apiSubmitTrueFalseAnswer,
  apiSubmitFillUpAnswer,
} from "@/lib/api";

type Tab = "mcq" | "truefalse" | "fillup";

interface QuizViewProps {
  mcqs: McqQuestion[];
  trueFalse: TrueFalseQuestion[];
  fillUps: FillUpQuestion[];
  sectionTitle: string;
  initialTab?: Tab;
}

interface McqAnswer {
  selected: string;
  isCorrect: boolean;
}
interface TfAnswer {
  selected: boolean;
  isCorrect: boolean;
}
interface FillUpAnswer {
  selected: string;
  isCorrect: boolean;
}

export default function QuizView({
  mcqs,
  trueFalse,
  fillUps,
  sectionTitle,
  initialTab = "mcq",
}: QuizViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Pre-populate answers from previously attempted questions
  const initialMcq = useMemo(() => {
    const map: Record<string, McqAnswer> = {};
    for (const q of mcqs) {
      if (q.isAttempted && q.userAnswer != null) {
        map[q.id] = { selected: q.userAnswer, isCorrect: q.userAnswer === q.answer };
      }
    }
    return map;
  }, [mcqs]);

  const initialTf = useMemo(() => {
    const map: Record<string, TfAnswer> = {};
    for (const q of trueFalse) {
      if (q.isAttempted && q.userAnswer != null) {
        map[q.id] = { selected: q.userAnswer, isCorrect: q.userAnswer === q.answer };
      }
    }
    return map;
  }, [trueFalse]);

  const initialFillUp = useMemo(() => {
    const map: Record<string, FillUpAnswer> = {};
    for (const q of fillUps) {
      if (q.isAttempted && q.userAnswer != null) {
        map[q.id] = {
          selected: q.userAnswer,
          isCorrect: q.userAnswer.trim().toLowerCase() === q.missingWord.trim().toLowerCase(),
        };
      }
    }
    return map;
  }, [fillUps]);

  const [mcqAnswers, setMcqAnswers] = useState<Record<string, McqAnswer>>(initialMcq);
  const [tfAnswers, setTfAnswers] = useState<Record<string, TfAnswer>>(initialTf);
  const [fillUpAnswers, setFillUpAnswers] = useState<Record<string, FillUpAnswer>>(initialFillUp);

  const handleMcq = useCallback(
    (qId: string, option: string, correct: string) => {
      setMcqAnswers((prev) => ({
        ...prev,
        [qId]: { selected: option, isCorrect: option === correct },
      }));
      // Persist to server
      apiSubmitMcqAnswer(qId, option).catch(() => {});
    },
    []
  );

  const handleTf = useCallback(
    (qId: string, value: boolean, correct: boolean) => {
      setTfAnswers((prev) => ({
        ...prev,
        [qId]: { selected: value, isCorrect: value === correct },
      }));
      // Persist to server
      apiSubmitTrueFalseAnswer(qId, value).catch(() => {});
    },
    []
  );

  const handleFillUp = useCallback(
    (qId: string, value: string, correct: string) => {
      setFillUpAnswers((prev) => ({
        ...prev,
        [qId]: {
          selected: value,
          isCorrect: value.trim().toLowerCase() === correct.trim().toLowerCase(),
        },
      }));
      // Persist to server
      apiSubmitFillUpAnswer(qId, value).catch(() => {});
    },
    []
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "mcq", label: "MCQ", count: mcqs.length },
    { key: "truefalse", label: "True / False", count: trueFalse.length },
    { key: "fillup", label: "Fill in the Blanks", count: fillUps.length },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Quiz</h2>
        <p className="text-xs text-zinc-500">{sectionTitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "text-cyan-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] text-zinc-600">
              ({t.count})
            </span>
            {activeTab === t.key && (
              <motion.div
                layoutId="quiz-tab"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-cyan-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* MCQ */}
      {activeTab === "mcq" && (
        <div className="space-y-5">
          {mcqs.map((q, index) => {
            const answer = mcqAnswers[q.id];
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-5 ${
                  answer?.isCorrect === true
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : answer?.isCorrect === false
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-white/10 bg-white/5"
                }`}
              >
                <div className="mb-3 flex items-start gap-3">
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
                    Q{index + 1}
                  </span>
                  <p className="text-sm font-medium text-white">{q.question}</p>
                </div>
                <div className="ml-9 grid gap-2">
                  {q.options.map((option, oi) => {
                    const isSelected = answer?.selected === option;
                    const isCorrectOption = answer && q.answer === option;
                    return (
                      <button
                        key={oi}
                        onClick={() =>
                          !answer && handleMcq(q.id, option, q.answer)
                        }
                        disabled={!!answer}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                          isCorrectOption
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : isSelected && !answer?.isCorrect
                              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                              : answer
                                ? "border-white/5 text-zinc-600"
                                : "border-white/10 text-zinc-400 hover:border-cyan-500/30 hover:text-white"
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-medium">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {isCorrectOption && (
                          <Check className="h-4 w-4 text-emerald-400" />
                        )}
                        {isSelected && !answer?.isCorrect && (
                          <X className="h-4 w-4 text-rose-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {answer && q.explanation && (
                  <p className="ml-9 mt-3 text-xs italic text-zinc-500">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* True / False */}
      {activeTab === "truefalse" && (
        <div className="space-y-5">
          {trueFalse.map((q, index) => {
            const answer = tfAnswers[q.id];
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-5 ${
                  answer?.isCorrect === true
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : answer?.isCorrect === false
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-white/10 bg-white/5"
                }`}
              >
                <div className="mb-3 flex items-start gap-3">
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
                    Q{index + 1}
                  </span>
                  <p className="text-sm font-medium text-white">{q.question}</p>
                </div>
                <div className="ml-9 flex gap-3">
                  {[true, false].map((value) => {
                    const isSelected = answer?.selected === value;
                    const isCorrectOption = answer && q.answer === value;
                    return (
                      <button
                        key={String(value)}
                        onClick={() =>
                          !answer && handleTf(q.id, value, q.answer)
                        }
                        disabled={!!answer}
                        className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                          isCorrectOption
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : isSelected && !answer?.isCorrect
                              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                              : answer
                                ? "border-white/5 text-zinc-600"
                                : "border-white/10 text-zinc-400 hover:border-cyan-500/30 hover:text-white"
                        }`}
                      >
                        {value ? "True" : "False"}
                      </button>
                    );
                  })}
                </div>
                {answer && (
                  <p className="ml-9 mt-3 text-xs italic text-zinc-500">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fill-up */}
      {activeTab === "fillup" && (
        <div className="space-y-5">
          {fillUps.map((q, index) => (
            <FillUpItem
              key={q.id}
              question={q}
              index={index}
              answer={fillUpAnswers[q.id]}
              onSubmit={handleFillUp}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fill-up sub-component ───────────────────────────────────────────────────

function FillUpItem({
  question: q,
  index,
  answer,
  onSubmit,
}: {
  question: FillUpQuestion;
  index: number;
  answer?: FillUpAnswer;
  onSubmit: (id: string, value: string, correct: string) => void;
}) {
  const [input, setInput] = useState("");

  return (
    <div
      className={`rounded-xl border p-5 ${
        answer?.isCorrect === true
          ? "border-emerald-500/30 bg-emerald-500/5"
          : answer?.isCorrect === false
            ? "border-rose-500/30 bg-rose-500/5"
            : "border-white/10 bg-white/5"
      }`}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
          Q{index + 1}
        </span>
        <p className="text-sm font-medium text-white">{q.question}</p>
      </div>
      <div className="ml-9 flex gap-2">
        <input
          type="text"
          value={answer ? answer.selected : input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!answer}
          placeholder={q.hint || "Type your answer…"}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none disabled:opacity-60"
        />
        {!answer && (
          <button
            onClick={() => onSubmit(q.id, input, q.missingWord)}
            disabled={!input.trim()}
            className="rounded-lg bg-cyan-500/10 px-4 py-2 text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
      {answer && (
        <p className="ml-9 mt-2 text-xs text-zinc-500">
          {answer.isCorrect ? "Correct!" : `Answer: ${q.missingWord}`}
        </p>
      )}
    </div>
  );
}
