# Bitexa — Number System Explorer

A modern, real-time web app to convert numbers between **Decimal**, **Binary**, **Octal** and **Hexadecimal** with step-by-step explanations and a live bit visualizer. Clean UI with soft gradients and dark mode.

## Features

- Real-time conversion across decimal, binary, octal & hex
- Step-by-step explanations (division, positional powers, via-binary)
- Live bit visualizer (auto-grows 8 → 16 → 32 → 64 bits)
- Practice mode with random challenges
- Copy to clipboard on every field
- Dark mode by default, light mode toggle
- Mobile responsive
- Smooth animations & hover effects
- Friendly inline validation with hints
- BigInt-powered (handles very large numbers)

## Screenshots

Home · Converter · Practice

## Live Demo

https://bitexa.vercel.app

## Installation

```bash
git clone git@github.com:Aaditya-Magar/Bitexa.git
cd Bitexa
npm install
npm run dev
```

Open the printed local URL. For a static build: `npm run build && npm run preview`.

## Usage

1. Type a value into any field (decimal, binary, octal, or hex).
2. Other fields update instantly.
3. Pick a conversion path under **Explain** to see the step-by-step logic.
4. Toggle **Practice mode** to test yourself.
5. Use the copy button on any field to copy its value.

## Validation Rules

| Field        | Rule                                  |
|--------------|---------------------------------------|
| Decimal      | Digits 0–9 only                       |
| Binary       | Only 0 and 1                          |
| Octal        | Digits 0–7 only                       |
| Hexadecimal  | Digits 0–9 and letters A–F            |
| Length       | Max 64 characters per field           |

Invalid input is highlighted with a clear error pointing to the bad character and a hint to fix it.

## Tech Stack

React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Lucide icons

## License

MIT
