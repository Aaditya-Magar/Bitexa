import { useMemo, useState, type ClipboardEvent } from "react";
import { AlertCircle, Check, Copy, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Base, BASE_INFO, MAX_INPUT_LENGTH, sanitizeForBase, validate } from "@/lib/converter";

interface Props {
  base: Base;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  active: boolean;
}

const BASE_PREFIX: Record<Base, string> = {
  dec: "10",
  bin: "2",
  oct: "8",
  hex: "16",
};

const ALLOWED_HINT: Record<Base, string> = {
  dec: "0–9",
  bin: "0, 1",
  oct: "0–7",
  hex: "0–9, A–F",
};

export function ConverterField({ base, value, invalid, onChange, onFocus, active }: Props) {
  const info = BASE_INFO[base];
  const [copied, setCopied] = useState(false);

  const error = useMemo(() => (invalid ? validate(value, base) : null), [invalid, value, base]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl p-5 transition-all duration-300",
        "glass-card border border-border/50",
        active && !invalid && "border-primary/60 shadow-glow",
        invalid && "border-destructive/70"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 min-w-[2rem] items-center justify-center rounded-md px-2 font-mono text-xs font-bold"
            style={{
              backgroundColor: `hsl(var(--${info.color}) / 0.15)`,
              color: `hsl(var(--${info.color}))`,
            }}
          >
            {BASE_PREFIX[base]}
          </span>
          <span className="text-sm font-semibold tracking-wide text-foreground">
            {info.label}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value || invalid}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all",
            "hover:bg-secondary hover:text-foreground",
            "disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          )}
          aria-label={`Copy ${info.label} value`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <label className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
          Type {info.label.toLowerCase()} value
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">
          base {info.radix}
        </span>
      </label>

      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-background/60 px-4 py-3 transition-all shadow-inner",
          invalid
            ? "border-destructive/70 ring-2 ring-destructive/30"
            : active
              ? "border-primary/70 ring-2 ring-primary/30"
              : "border-border/70 hover:border-border"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "font-mono text-xl font-semibold select-none",
            invalid ? "text-destructive" : active ? "text-primary" : "text-muted-foreground/40"
          )}
        >
          ›
        </span>
        <input
          type="text"
          inputMode={base === "dec" ? "numeric" : "text"}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          maxLength={MAX_INPUT_LENGTH}
          value={value}
          placeholder={`Type here… e.g. ${info.placeholder}`}
          onChange={(e) => {
            // Trim whitespace, enforce hard length cap, normalise hex to upper.
            let v = e.target.value.replace(/\s+/g, "").slice(0, MAX_INPUT_LENGTH);
            if (base === "hex") v = v.toUpperCase();
            onChange(v);
          }}
          onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
            // Defence-in-depth: sanitise pasted content to allowed charset
            // and clamp length so users can't paste megabytes of junk.
            e.preventDefault();
            const pasted = e.clipboardData.getData("text") ?? "";
            const cleaned = sanitizeForBase(pasted, base).slice(0, MAX_INPUT_LENGTH);
            onChange(base === "hex" ? cleaned.toUpperCase() : cleaned);
          }}
          onFocus={onFocus}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${base}-error` : undefined}
          className={cn(
            "w-full bg-transparent font-mono text-2xl font-semibold tracking-wider outline-none caret-primary",
            "placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/50",
            invalid ? "text-destructive" : "text-foreground"
          )}
        />
      </div>

      {error ? (
        <div
          id={`${base}-error`}
          role="alert"
          className="mt-3 space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-destructive">{error.title}</p>
              <p className="mt-0.5 text-xs text-destructive/80">{error.message}</p>
            </div>
          </div>

          {typeof error.position === "number" && value && (
            <pre className="overflow-x-auto rounded-md bg-background/60 px-2 py-1.5 font-mono text-xs leading-tight text-foreground/80">
              {value}
              {"\n"}
              {" ".repeat(error.position) + "^"}
            </pre>
          )}

          <div className="flex items-start gap-2 text-xs text-foreground/80">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{error.hint}</span>
          </div>
        </div>
      ) : (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">
          Allowed characters: {ALLOWED_HINT[base]}
        </p>
      )}
    </div>
  );
}
