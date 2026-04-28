import { useEffect, useMemo, useRef, useState } from "react";
import { Binary, Github } from "lucide-react";
import { Base, BASE_INFO, convert, explain, isValid } from "@/lib/converter";
import { ConverterField } from "@/components/ConverterField";
import { BitVisualizer } from "@/components/BitVisualizer";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { PracticeMode } from "@/components/PracticeMode";
import { ThemeToggle } from "@/components/ThemeToggle";

const BASES: Base[] = ["dec", "bin", "oct", "hex"];

type Values = Record<Base, string>;

const Index = () => {
  // Source-of-truth values per base. We compute the others from `active`.
  const [values, setValues] = useState<Values>({ dec: "42", bin: "101010", oct: "52", hex: "2A" });
  const [active, setActive] = useState<Base>("dec");
  const [invalid, setInvalid] = useState<Base | null>(null);
  const [explainPair, setExplainPair] = useState<{ from: Base; to: Base }>({ from: "dec", to: "bin" });
  const [practice, setPractice] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup any pending debounce timer on unmount to avoid stray state updates.
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleChange = (base: Base, raw: string) => {
    setActive(base);
    // Show the user's typing immediately in their field.
    setValues((prev) => ({ ...prev, [base]: raw }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Debounce heavy BigInt work + downstream re-renders (~150ms feels instant
    // but throttles rapid keystrokes / paste storms).
    debounceRef.current = setTimeout(() => {
      if (!isValid(raw, base)) {
        setInvalid(base);
        return;
      }
      setInvalid(null);
      // Recompute every other base from the active source.
      setValues((prev) => {
        const next: Values = { ...prev, [base]: raw };
        for (const b of BASES) {
          if (b === base) continue;
          next[b] = convert(raw, base, b);
        }
        return next;
      });
    }, 150);
  };

  // Pick a sensible default conversion target for the explanation panel
  // based on the active base (so it always shows something interesting).
  useEffect(() => {
    const target: Base =
      active === "dec" ? "bin" :
      active === "bin" ? "dec" :
      active === "hex" ? "dec" :
      "hex";
    setExplainPair({ from: active, to: target });
  }, [active]);

  const explanation = useMemo(
    () => explain(values[explainPair.from], explainPair.from, explainPair.to),
    [values, explainPair]
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative grid background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Binary className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Bit<span className="text-gradient">exa</span>
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Number system explorer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPractice((v) => !v)}
              className={`hidden rounded-lg border px-3 py-2 text-xs font-medium transition sm:block ${
                practice
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {practice ? "✓ Practice on" : "Practice mode"}
            </button>
            <a
              href="https://github.com/Aaditya-Magar/Bitexa"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground backdrop-blur transition hover:border-primary/50 hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero */}
        <section className="mb-10 max-w-2xl animate-slide-up">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Convert between number systems,{" "}
            <span className="text-gradient">in real time.</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Type in any base decimal, binary, octal or hex and watch the others update instantly
            with step by step explanations and a live bit visualizer.
          </p>
          <button
            onClick={() => setPractice((v) => !v)}
            className={`mt-4 rounded-lg border px-3 py-2 text-xs font-medium transition sm:hidden ${
              practice
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/60 bg-card/50 text-muted-foreground"
            }`}
          >
            {practice ? "✓ Practice on" : "Practice mode"}
          </button>
        </section>

        {/* Converter grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-slide-up" style={{ animationDelay: "60ms" }}>
          {BASES.map((b) => (
            <ConverterField
              key={b}
              base={b}
              value={values[b]}
              invalid={invalid === b}
              active={active === b}
              onChange={(v) => handleChange(b, v)}
              onFocus={() => setActive(b)}
            />
          ))}
        </section>

        {/* Bit Visualizer */}
        <section className="mt-6 animate-slide-up" style={{ animationDelay: "120ms" }}>
          <BitVisualizer binary={values.bin} />
        </section>

        {/* Conversion path picker */}
        <section className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
          <span className="px-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Explain
          </span>
          <BasePicker
            value={explainPair.from}
            onChange={(b) => setExplainPair((p) => ({ ...p, from: b, to: p.to === b ? otherBase(b) : p.to }))}
          />
          <span className="text-muted-foreground">→</span>
          <BasePicker
            value={explainPair.to}
            onChange={(b) => setExplainPair((p) => ({ ...p, to: b, from: p.from === b ? otherBase(b) : p.from }))}
          />
        </section>

        {/* Explanation */}
        <section className="mt-4 animate-slide-up" style={{ animationDelay: "180ms" }}>
          <ExplanationPanel explanation={explanation} />
        </section>

        {/* Practice */}
        {practice && (
          <section className="mt-6 animate-fade-in">
            <PracticeMode />
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p className="font-mono">
            Bitexa · Built for students learning number systems.
          </p>
          <p className="font-mono">
            © 2026 Bitexa · Built by Aditya Magar
          </p>
        </footer>
      </div>
    </div>
  );
};

function otherBase(b: Base): Base {
  return b === "dec" ? "bin" : "dec";
}

function BasePicker({ value, onChange }: { value: Base; onChange: (b: Base) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
      {BASES.map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            value === b
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {BASE_INFO[b].label}
        </button>
      ))}
    </div>
  );
}

export default Index;
