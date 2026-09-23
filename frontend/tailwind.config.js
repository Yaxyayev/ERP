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
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        'surface-soft': "var(--surface-soft)",
        hairline: "var(--hairline)",
        'hairline-strong': "var(--hairline-strong)",
        primary: {
          DEFAULT: "var(--primary)",
          pressed: "var(--primary-pressed)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
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
