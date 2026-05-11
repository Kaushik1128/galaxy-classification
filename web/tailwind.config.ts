import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cosmos: {
          deep: "#02010a",
          night: "#070418",
          ink: "#0b0820",
          violet: "#5b21b6",
          glow: "#a78bfa",
        },
        cls: {
          elliptical: "#ffb454",
          spiral: "#60a5fa",
          barred: "#22d3ee",
          edge: "#818cf8",
          merger: "#f472b6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
      },
      animation: {
        "pulse-slow": "pulseSlow 4s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
