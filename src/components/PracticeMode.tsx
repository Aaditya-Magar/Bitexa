import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, Check, X } from "lucide-react";
import { Base, BASE_INFO, convert, explain } from "@/lib/converter";
import { cn } from "@/lib/utils";

interface Question {
  value: string;
  from: Base;
  to: Base;
  answer: string;
}

const BASES: Base[] = ["dec", "bin", "oct", "hex"];

function randomQuestion(): Question {
  const value = Math.floor(Math.random() * 250) + 5; // 5–254 keeps it interesting but tractable
  const from = BASES[Math.floor(Math.random() * BASES.length)];
  let to = BASES[Math.floor(Math.random() * BASES.length)];
  while (to === from) to = BASES[Math.floor(Math.random() * BASES.length)];
  const decStr = value.toString();
  const fromStr = convert(decStr, "dec", from);
  const answer = convert(decStr, "dec", to);
  return { value: fromStr, from, to, answer };
}

export function PracticeMode() {
  const [q, setQ] = useState<Question>(() => randomQuestion());
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);

  const next = useCallback(() => {
    setQ(randomQuestion());
    setInput("");
    setStatus("idle");
    setShowHint(false);
  }, []);

  useEffect(() => {
    if (status !== "idle") return;
    if (!input) return;
    // Live-check (case-insensitive) so the user gets instant feedback.
  }, [input, status]);

  const check = () => {
    if (!input.trim()) return;
    if (input.trim().toUpperCase() === q.answer.toUpperCase()) {
      setStatus("correct");
    } else {
      setStatus("wrong");
    }
  };

  const explanation = explain(convert(q.value, q.from, "dec"), "dec", q.to)
    ?? explain(q.value, q.from, q.to);

  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-card/60 to-card/20 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide">Practice mode</h3>
            <p className="font-mono text-xs text-muted-foreground">Test your understanding</p>
          </div>
        </div>
        <button
          onClick={next}
          className="flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" /> New question
        </button>
      </div>

      <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
        <p className="text-sm text-muted-foreground">
          Convert{" "}
          <span className="mx-1 rounded bg-background/60 px-2 py-0.5 font-mono font-bold text-foreground">
            {q.value}
          </span>{" "}
          from{" "}
          <span className="font-semibold text-foreground">{BASE_INFO[q.from].label}</span> to{" "}
          <span className="font-semibold text-foreground">{BASE_INFO[q.to].label}</span>
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setStatus("idle");
            }}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Your answer…"
            spellCheck={false}
            autoComplete="off"
            className={cn(
              "flex-1 rounded-md border bg-background/50 px-3 py-2 font-mono text-base outline-none transition",
              status === "correct" && "border-primary/60",
              status === "wrong" && "border-destructive/60",
              status === "idle" && "border-border/60 focus:border-primary/60"
            )}
          />
          <button
            onClick={check}
            className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Check
          </button>
        </div>

        {status === "correct" && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary animate-fade-in">
            <Check className="h-4 w-4" /> Correct! The answer is {q.answer}.
          </div>
        )}
        {status === "wrong" && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in">
            <span className="flex items-center gap-2">
              <X className="h-4 w-4" /> Not quite. Correct answer: <span className="font-mono font-bold">{q.answer}</span>
            </span>
            <button
              onClick={() => setShowHint((v) => !v)}
              className="text-xs font-medium underline-offset-2 hover:underline"
            >
              {showHint ? "Hide" : "Show"} explanation
            </button>
          </div>
        )}

        {showHint && explanation && (
          <ol className="mt-3 space-y-1 animate-fade-in">
            {explanation.steps.map((s, i) => (
              <li key={i} className="rounded bg-background/50 px-3 py-1.5 font-mono text-xs text-foreground/80">
                {i + 1}. {s.label}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
