/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "var(--color-base)",
          panel: "var(--color-base-panel)",
          elevated: "var(--color-base-elevated)",
          raised: "var(--color-base-raised)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          secondary: "var(--color-ink-secondary)",
          tertiary: "var(--color-ink-tertiary)",
        },
        line: {
          DEFAULT: "var(--color-line)",
          soft: "var(--color-line-soft)",
          strong: "var(--color-line-strong)",
        },
        pos: "var(--color-pos)",
        neg: "var(--color-neg)",
        info: "var(--color-info)",
        violet: "var(--color-violet)",
        "signal-amber": "var(--color-signal-amber)",
        "signal-amberDim": "var(--color-signal-amber-dim)",
        "pos-dim": "var(--color-pos-dim)",
        "neg-dim": "var(--color-neg-dim)",
        "info-dim": "var(--color-info-dim)",
        "violet-dim": "var(--color-violet-dim)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ticker: "ticker 30s linear infinite",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
