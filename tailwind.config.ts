import type { Config } from "tailwindcss";

// JobBot design system — disciplined and restrained.
// White background · near-black ink · neutral grays · ONE accent (cobalt).
// No gradients, no colored shadows, no second accent.

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        subtle: "#FAFAFA", // secondary surfaces
        ink: "#0A0A0A", // primary text / black
        muted: "#737373", // secondary text
        faint: "#A3A3A3", // tertiary text
        line: "#E5E5E5", // borders
        "line-strong": "#D4D4D4", // hover borders
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          weak: "#EEF3FF", // tinted background for accent surfaces
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Tightened editorial scale
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.0625rem", { lineHeight: "1.6rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        md: "0.5rem",
        lg: "0.625rem",
      },
      boxShadow: {
        // Single neutral, near-invisible elevation. Used sparingly.
        card: "0 1px 2px 0 rgb(10 10 10 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
