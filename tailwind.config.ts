
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        body: ['Arial', 'Helvetica', 'sans-serif'],
        headline: ['Arial', 'Helvetica', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(221, 83%, 33%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        secondary: {
          DEFAULT: 'hsl(0, 0%, 96.1%)',
          foreground: 'hsl(0, 0%, 9%)',
        },
        muted: {
          DEFAULT: 'hsl(0, 0%, 96.1%)',
          foreground: 'hsl(0, 0%, 45.1%)',
        },
        accent: {
          DEFAULT: 'hsl(20, 92%, 47%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        border: 'hsl(0, 0%, 89.8%)',
        input: 'hsl(0, 0%, 89.8%)',
        ring: 'hsl(221, 83%, 33%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
