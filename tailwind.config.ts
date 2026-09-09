import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        lineStrong: "rgb(var(--line-strong) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        ink2: "rgb(var(--ink-2) / <alpha-value>)",
        ink3: "rgb(var(--ink-3) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        brandInk: "rgb(var(--brand-ink) / <alpha-value>)",
        brandSoft: "rgb(var(--brand-soft) / <alpha-value>)",
        brandDeep: "rgb(var(--brand-deep) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentInk: "rgb(var(--accent-ink) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
        ok: "rgb(var(--ok) / <alpha-value>)",
        okSoft: "rgb(var(--ok-soft) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        warnSoft: "rgb(var(--warn-soft) / <alpha-value>)",
        bad: "rgb(var(--bad) / <alpha-value>)",
        badSoft: "rgb(var(--bad-soft) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Mulish", "system-ui", "sans-serif"],
        body: ["Mulish", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(21,34,38,.06), 0 8px 24px -12px rgba(21,34,38,.18)" },
      borderRadius: { lg: "4px", md: "4px" },
    },
  },
  plugins: [],
} satisfies Config;
