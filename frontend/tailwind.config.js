/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        'surface-soft': "rgb(var(--surface-soft) / <alpha-value>)",
        'surface-hover': "rgb(var(--surface-hover) / <alpha-value>)",
        hairline: "rgb(var(--hairline) / <alpha-value>)",
        'hairline-soft': "rgb(var(--hairline-soft) / <alpha-value>)",
        'hairline-strong': "rgb(var(--hairline-strong) / <alpha-value>)",
        charcoal: "rgb(var(--foreground) / <alpha-value>)",
        steel: "rgb(var(--muted-foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          pressed: "rgb(var(--primary-pressed) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        // Notion specific brand tokens
        notion: {
          purple: "#5645d4",
          'purple-pressed': "#4534b3",
          'brand-navy': "#0a1530",
          'brand-navy-deep': "#070f24",
          'brand-navy-mid': "#1a2a52",
          charcoal: "#37352f",
          slate: "#5d5b54",
          steel: "#787671",
          stone: "#a4a097",
          hairline: "#e5e3df",
          'hairline-strong': "#c8c4be",
          surface: "#f6f5f4",
          'surface-soft': "#fafaf9",
          // Database property pastel tints
          'tint-peach': "#ffe8d4",
          'tint-peach-text': "#793400",
          'tint-rose': "#fde0ec",
          'tint-rose-text': "#a02e6d",
          'tint-mint': "#d9f3e1",
          'tint-mint-text': "#1aae39",
          'tint-lavender': "#e6e0f5",
          'tint-lavender-text': "#391c57",
          'tint-sky': "#dcecfa",
          'tint-sky-text': "#0075de",
          'tint-yellow': "#fef7d6",
          'tint-yellow-bold': "#f9e79f",
          'tint-yellow-text': "#8f6b00",
          'tint-gray': "#f0eeec",
          'tint-gray-text': "#5d5b54",
        }
      },
      borderRadius: {
        'xs': "4px",
        'sm': "6px",
        'md': "8px",   // Notion buttons & inputs
        'lg': "12px",  // Notion cards & dialogs
        'xl': "16px",
        '2xl': "20px",
        '3xl': "24px",
        'full': "9999px",
      },
      boxShadow: {
        'notion-card': 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.04) 0px 2px 4px',
        'notion-hover': 'rgba(15, 15, 15, 0.08) 0px 0px 0px 1px, rgba(15, 15, 15, 0.08) 0px 3px 6px',
        'notion-modal': 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.16) 0px 16px 48px -8px',
        'notion-dropdown': 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
      },
      fontFamily: {
        sans: [
          'Notion Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif'
        ],
      }
    },
  },
  plugins: [],
}
