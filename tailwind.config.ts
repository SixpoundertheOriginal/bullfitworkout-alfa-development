import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

// CUSTOM COLORS - updated with new blue gradient
const colors = {
  primary: "#9b87f5",          // Purple
  secondary: "#2563eb",        // Updated to start of blue gradient
  accent: "#4f46e5",           // End of blue gradient
  neutral: "#1A1F2C",          // Very dark background
  neutralLight: "#23263A",
  info: "#90cdf4",             // Light blue
  positive: "#34d399",         // Green
  negative: "#f87171",         // Red
};

const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", ...fontFamily.sans],
        inter: ["Inter", ...fontFamily.sans],
        // fallback for anything not in the pairing
        sans: ["Inter", ...fontFamily.sans],
      },
      colors: {
        // Core palette override (only dark)
        primary: {
          DEFAULT: colors.primary,
        },
        secondary: {
          DEFAULT: colors.secondary,
        },
        accent: {
          DEFAULT: colors.accent,
        },
        neutral: {
          DEFAULT: colors.neutral,
          light: colors.neutralLight,
        },
        info: colors.info,
        positive: colors.positive,
        negative: colors.negative,
        // Map to variable colors for easier migration
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "checkmark": {
          '0%': { scale: '0.7', opacity: 0.7 },
          '70%': { scale: '1.05', opacity: 1 },
          '100%': { scale: '1', opacity: 1 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pulse-slow": {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "checkmark": "checkmark 0.32s cubic-bezier(0.39,0.58,0.57,1) forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
