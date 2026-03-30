import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#f3e7c8",
        ink: "#1f1a17",
        brass: "#b4823c",
        moss: "#39513f",
        wine: "#723c3c",
        dusk: "#2e3347",
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 32px rgba(31, 26, 23, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;

