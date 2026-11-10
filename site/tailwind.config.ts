import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          50: "hsl(var(--primary-soft) / <alpha-value>)",
          100: "#ffe4d4",
          500: "hsl(var(--primary) / <alpha-value>)",
          600: "hsl(var(--primary-hover) / <alpha-value>)",
          700: "hsl(var(--primary-strong) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "#f7f7f8",
          foreground: "#1a1a2e",
        },
        muted: {
          DEFAULT: "#f4f4f6",
          foreground: "#6b7280",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
        },
        swiss: {
          red: "#FF0000",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["4rem", { lineHeight: "1.1", fontWeight: "800" }],
        "display-lg": ["3rem", { lineHeight: "1.15", fontWeight: "800" }],
        "display-md": ["2.25rem", { lineHeight: "1.2", fontWeight: "700" }],
        "display-sm": ["1.875rem", { lineHeight: "1.25", fontWeight: "700" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in": "slideIn 0.5s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
