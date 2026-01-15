/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // New color palette
        burgundy: {
          DEFAULT: '#700303',
          dark: '#5a0202',
          light: '#8a0404',
        },
        chocolate: {
          DEFAULT: '#1d0207',
          light: '#2d0309',
        },
        kawaii: {
          DEFAULT: '#ffc0cb',
          light: '#ffd6dd',
          dark: '#ff9eb0',
        },
        passion: {
          DEFAULT: '#ff1744',
          light: '#ff4569',
          dark: '#cc0033',
        },
        // Maintain semantic color system with new palette
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'glow-pink': '0 0 20px rgba(255, 192, 203, 0.4)',
        'glow-red': '0 0 20px rgba(255, 23, 68, 0.4)',
        '3d': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
        '3d-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.3)',
      },
      dropShadow: {
        'glow-pink': '0 0 10px rgba(255, 192, 203, 0.6)',
        'glow-red': '0 0 10px rgba(255, 23, 68, 0.6)',
        'text': '2px 2px 4px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 192, 203, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 192, 203, 0.6)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
