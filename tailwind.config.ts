import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          50: "#fafafa",
          100: "#1a1a2e",
          200: "#16213e",
          300: "#0f3460",
          400: "#533483",
          500: "#e94560",
        },
        profit: "#10b981",
        loss: "#ef4444",
        card: "#111827",
        surface: "#1f2937",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
