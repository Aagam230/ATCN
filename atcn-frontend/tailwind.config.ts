import type { Config } from "tailwindcss";

const config: Config = {
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
      // ── Colour palette (maps to CSS vars in globals.css) ─────────────────
      colors: {
        // Backgrounds
        base: {
          DEFAULT: "var(--color-base)",
          panel: "var(--color-base-panel)",
          elevated: "var(--color-base-elevated)",
          raised: "var(--color-base-raised)",
        },
        // Text / ink
        ink: {
          DEFAULT: "var(--color-ink)",
          secondary: "var(--color-ink-secondary)",
          tertiary: "var(--color-ink-tertiary)",
        },
        // Borders
        line: {
          DEFAULT: "var(--color-line)",
          soft: "var(--color-line-soft)",
          strong: "var(--color-line-strong)",
        },
        // Semantic
        pos: "var(--color-pos)",
        neg: "var(--color-neg)",
        info: "var(--color-info)",
        violet: "var(--color-violet)",
        "signal-amber": "var(--color-signal-amber)",
        // Dimmed semantic fills
        "pos-dim": "var(--color-pos-dim)",
        "neg-dim": "var(--color-neg-dim)",
        "info-dim": "var(--color-info-dim)",
        "violet-dim": "var(--color-violet-dim)",
      },

      // ── Font families ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },

      // ── Font sizes — adds text-2xs used throughout ────────────────────────
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      // ── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },

      // ── Animations ────────────────────────────────────────────────────────
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

export default config;
