import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { Explanation } from "@/lib/converter";
import { cn } from "@/lib/utils";

interface Props {
  explanation: Explanation | null;
}

export function ExplanationPanel({ explanation }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide">Step-by-step explanation</h3>
            <p className="font-mono text-xs text-muted-foreground">
              {explanation ? explanation.title : "Type a value to see how it converts"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-border/50 p-5 pt-4 animate-fade-in">
          {!explanation ? (
            <p className="font-mono text-sm text-muted-foreground/70">
              Focus a field and start typing — explanations update live based on which input is active.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{explanation.intro}</p>
              <ol className="space-y-1.5">
                {explanation.steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-md bg-secondary/40 px-3 py-2 font-mono text-sm"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-primary/15 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90">{s.label}</span>
                  </li>
                ))}
              </ol>
              <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Result</span>
                <span className="font-mono text-lg font-bold text-gradient">{explanation.result}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
