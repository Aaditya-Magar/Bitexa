// Core number system conversion logic.
// All functions are pure and operate on string representations
// to avoid JS Number precision loss for large values where possible.
//
// SECURITY NOTES
// - All inputs are validated against a strict character whitelist per base.
// - A hard MAX_INPUT_LENGTH cap prevents DoS via huge BigInt computations
//   (BigInt math grows super-linearly with digit count).
// - Conversions are wrapped in try/catch so malformed input never crashes UI.
// - We never use eval / new Function / innerHTML — all rendering is via React,
//   which escapes text content by default.

export type Base = "dec" | "bin" | "oct" | "hex";

/** Hard cap on accepted input length. 64 chars covers a 64-bit hex value
 *  and is far more than students need, while keeping BigInt work cheap. */
export const MAX_INPUT_LENGTH = 64;

export const BASE_INFO: Record<Base, { label: string; radix: number; pattern: RegExp; placeholder: string; color: string }> = {
  dec: { label: "Decimal",     radix: 10, pattern: /^[0-9]+$/i,           placeholder: "0",        color: "base-dec" },
  bin: { label: "Binary",      radix: 2,  pattern: /^[01]+$/,             placeholder: "0",        color: "base-bin" },
  oct: { label: "Octal",       radix: 8,  pattern: /^[0-7]+$/,            placeholder: "0",        color: "base-oct" },
  hex: { label: "Hexadecimal", radix: 16, pattern: /^[0-9a-fA-F]+$/,      placeholder: "0",        color: "base-hex" },
};

/** Defence-in-depth: strip any character not in the allowed set for the base.
 *  Used to sanitise pasted content before it reaches state. */
export function sanitizeForBase(value: string, base: Base): string {
  const strip: Record<Base, RegExp> = {
    dec: /[^0-9]/g,
    bin: /[^01]/g,
    oct: /[^0-7]/g,
    hex: /[^0-9a-fA-F]/g,
  };
  return value.replace(strip[base], "");
}

/** Validate a value against a base. Empty string is treated as valid (= 0). */
export function isValid(value: string, base: Base): boolean {
  if (value === "") return true;
  return BASE_INFO[base].pattern.test(value);
}

export interface ValidationError {
  title: string;
  message: string;
  hint: string;
  position?: number;
  badChar?: string;
}

const ALLOWED_DESCRIPTION: Record<Base, string> = {
  dec: "digits 0–9",
  bin: "only 0 and 1",
  oct: "digits 0–7",
  hex: "digits 0–9 and letters A–F",
};

/** Inspect a value and return a detailed, user-friendly error — or null if it's valid. */
export function validate(value: string, base: Base): ValidationError | null {
  if (value === "") return null;
  const info = BASE_INFO[base];

  if (value.length > MAX_INPUT_LENGTH) {
    return {
      title: "Input too long",
      message: `For performance and safety, inputs are limited to ${MAX_INPUT_LENGTH} characters.`,
      hint: `Shorten your value to at most ${MAX_INPUT_LENGTH} characters.`,
      position: MAX_INPUT_LENGTH,
    };
  }

  if (/\s/.test(value)) {
    const pos = value.search(/\s/);
    return {
      title: "Spaces aren't allowed",
      message: "Numbers shouldn't contain spaces or tabs.",
      hint: `Remove the space at position ${pos + 1} and try again.`,
      position: pos,
      badChar: " ",
    };
  }

  if (value.includes(".")) {
    return {
      title: "Decimal points aren't supported",
      message: "Bitexa works with whole (integer) numbers only.",
      hint: `Remove the “.” — try a whole number like 42.`,
      position: value.indexOf("."),
      badChar: ".",
    };
  }
  if (value.startsWith("-") || value.startsWith("+")) {
    return {
      title: "Signs aren't supported",
      message: "Negative or signed numbers aren't supported yet.",
      hint: `Remove the “${value[0]}” at the start.`,
      position: 0,
      badChar: value[0],
    };
  }

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    const ok = new RegExp(`^[${digitClass(base)}]$`).test(ch);
    if (!ok) {
      return {
        title: `“${ch}” isn't valid in ${info.label}`,
        message: `${info.label} (base ${info.radix}) accepts ${ALLOWED_DESCRIPTION[base]}.`,
        hint: suggestionFor(base, ch),
        position: i,
        badChar: ch,
      };
    }
  }
  return null;
}

function digitClass(base: Base): string {
  switch (base) {
    case "dec": return "0-9";
    case "bin": return "01";
    case "oct": return "0-7";
    case "hex": return "0-9a-fA-F";
  }
}

function suggestionFor(base: Base, ch: string): string {
  if (/[a-z]/i.test(ch)) {
    if (base === "hex") return "Hex letters only go up to F. Try A, B, C, D, E or F.";
    return `Letters aren't allowed in ${BASE_INFO[base].label}. Did you mean to type in the Hexadecimal field?`;
  }
  if (/[0-9]/.test(ch)) {
    const max = BASE_INFO[base].radix - 1;
    if (base === "bin") return "Binary only uses 0 and 1. Try the Decimal field for other digits.";
    if (base === "oct") return `Octal digits go up to ${max}. Try the Decimal field for 8 or 9.`;
  }
  return `Allowed: ${ALLOWED_DESCRIPTION[base]}.`;
}

/** Convert a value from one base to another. Returns "" for empty/invalid/oversize input.
 *  Wrapped in try/catch so any unexpected runtime error is contained. */
export function convert(value: string, from: Base, to: Base): string {
  if (value === "") return "";
  if (value.length > MAX_INPUT_LENGTH) return "";
  if (!isValid(value, from)) return "";
  try {
    const big = parseBig(value, BASE_INFO[from].radix);
    return big.toString(BASE_INFO[to].radix).toUpperCase();
  } catch {
    return "";
  }
}

/** Parse a string in a given radix into a BigInt. */
function parseBig(value: string, radix: number): bigint {
  let result = 0n;
  const r = BigInt(radix);
  for (const ch of value.toLowerCase()) {
    const digit = parseInt(ch, radix);
    if (Number.isNaN(digit)) throw new Error("invalid digit");
    result = result * r + BigInt(digit);
  }
  return result;
}

/** Group binary string into 4-bit nibbles for display. */
export function groupBinary(bin: string, size = 4): string {
  if (!bin) return "";
  const padded = bin.padStart(Math.ceil(bin.length / size) * size, "0");
  return padded.match(new RegExp(`.{${size}}`, "g"))?.join(" ") ?? padded;
}

/** Pad binary to a minimum bit width (8/16/32) for the visualizer. */
export function padBinary(bin: string, minWidth = 8): string {
  if (!bin) return "0".repeat(minWidth);
  let width = minWidth;
  while (bin.length > width) width *= 2;
  return bin.padStart(width, "0");
}

// ---------- Step-by-step explanation generators ----------

export interface ExplanationStep {
  label: string;
  detail?: string;
}

export interface Explanation {
  title: string;
  intro: string;
  steps: ExplanationStep[];
  result: string;
}

/** Build an explanation for converting `value` (in `from`) to base `to`. */
export function explain(value: string, from: Base, to: Base): Explanation | null {
  if (!value || !isValid(value, from) || from === to) return null;

  // Decimal -> any: repeated division
  if (from === "dec") {
    return explainDecToBase(value, to);
  }
  // Any -> decimal: positional powers
  if (to === "dec") {
    return explainBaseToDec(value, from);
  }
  // Other pairs: route through binary or decimal
  return explainViaIntermediate(value, from, to);
}

function explainDecToBase(value: string, to: Base): Explanation {
  const radix = BASE_INFO[to].radix;
  const r = BigInt(radix);
  let n = BigInt(value);
  const steps: ExplanationStep[] = [];
  if (n === 0n) {
    steps.push({ label: `0 ÷ ${radix} = 0 remainder 0` });
  } else {
    while (n > 0n) {
      const q = n / r;
      const rem = n % r;
      const remStr = rem.toString(radix).toUpperCase();
      steps.push({
        label: `${n} ÷ ${radix} = ${q}  remainder ${remStr}`,
      });
      n = q;
    }
  }
  const result = convert(value, "dec", to);
  return {
    title: `Decimal → ${BASE_INFO[to].label}`,
    intro: `Repeatedly divide by ${radix} and collect the remainders. Read them bottom-up to get the result.`,
    steps,
    result,
  };
}

function explainBaseToDec(value: string, from: Base): Explanation {
  const radix = BASE_INFO[from].radix;
  const digits = value.toUpperCase().split("");
  const steps: ExplanationStep[] = [];
  let total = 0n;
  const r = BigInt(radix);
  for (let i = 0; i < digits.length; i++) {
    const power = digits.length - 1 - i;
    const d = parseInt(digits[i], radix);
    const contribution = BigInt(d) * (r ** BigInt(power));
    total += contribution;
    steps.push({
      label: `${digits[i]} × ${radix}^${power} = ${contribution.toString()}`,
    });
  }
  steps.push({ label: `Sum = ${total.toString()}` });
  return {
    title: `${BASE_INFO[from].label} → Decimal`,
    intro: `Multiply each digit by ${radix} raised to its position (right-to-left, starting at 0), then sum.`,
    steps,
    result: total.toString(),
  };
}

function explainViaIntermediate(value: string, from: Base, to: Base): Explanation {
  // Use binary as intermediate when one of them is bin/oct/hex (nibble-friendly),
  // otherwise route through decimal.
  const intermediate: Base = "bin";
  const inter = convert(value, from, intermediate);
  const final = convert(value, from, to);
  const steps: ExplanationStep[] = [
    { label: `Step 1 — Convert ${value} (${BASE_INFO[from].label}) to binary: ${groupBinary(inter)}` },
    { label: `Step 2 — Group binary bits and map to ${BASE_INFO[to].label}: ${final}` },
  ];
  return {
    title: `${BASE_INFO[from].label} → ${BASE_INFO[to].label}`,
    intro: `We convert via binary as an intermediate, since ${BASE_INFO[from].label.toLowerCase()} and ${BASE_INFO[to].label.toLowerCase()} both map cleanly to bits.`,
    steps,
    result: final,
  };
}
