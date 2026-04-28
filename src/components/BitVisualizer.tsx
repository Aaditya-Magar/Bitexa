import { useMemo } from "react";
import { padBinary } from "@/lib/converter";
import { cn } from "@/lib/utils";

interface Props {
  binary: string;
}

/** Visualize a binary value as grouped bit cells (8 per row). */
export function BitVisualizer({ binary }: Props) {
  const padded = useMemo(() => padBinary(binary || "0", 8), [binary]);

  // Split into rows of 8 bits.
  const rows: string[] = [];
  for (let i = 0; i < padded.length; i += 8) rows.push(padded.slice(i, i + 8));

  const totalBits = padded.length;
  const onBits = padded.split("").filter((b) => b === "1").length;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold tracking-wide">Bit Visualizer</h3>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {onBits}/{totalBits} bits set · width {totalBits}
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row, rIdx) => {
          const rowStart = (rows.length - 1 - rIdx) * 8;
          return (
            <div key={rIdx} className="flex items-center gap-3">
              <span className="w-12 shrink-0 font-mono text-[10px] text-muted-foreground/60">
                bit {rowStart + 7}
              </span>
              <div className="flex flex-1 gap-1.5">
                {row.split("").map((bit, i) => {
                  const bitIndex = rowStart + (7 - i);
                  const on = bit === "1";
                  return (
                    <div
                      key={i}
                      title={`bit ${bitIndex} = ${bit}  (2^${bitIndex} = ${(2 ** bitIndex).toLocaleString()})`}
                      className={cn(
                        "group relative flex aspect-square flex-1 items-center justify-center rounded-md font-mono text-sm font-bold transition-all duration-300",
                        on
                          ? "bg-[hsl(var(--bit-on))] text-primary-foreground shadow-[0_0_12px_hsl(var(--bit-on)/0.6)]"
                          : "bg-[hsl(var(--bit-off))] text-muted-foreground/50",
                        // separator after every 4 bits (visually)
                        i === 3 && "mr-2"
                      )}
                    >
                      {bit}
                    </div>
                  );
                })}
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground/60">
                bit {rowStart}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
