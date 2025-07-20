import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        body: ['Roboto', 'sans-serif'],
        headline: ['Bebas Neue', 'sans-serif'],
        serif: ['Times New Roman', 'serif'],
      },
      colors: {
        // Naval-themed color system
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
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Naval-specific colors
        naval: {
          gold: '#b8860b',
          'gold-light': '#ffd700',
          'gold-dark': '#996c09',
          gray: '#495057',
          'gray-light': '#6c757d',
          'gray-lighter': '#e9ecef',
          white: '#ffffff',
          blue: '#1a1a2e',
          'blue-dark': '#16213e',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Naval form radius
        'naval': '8px',
        'naval-left': '8px 0 0 8px',
        'naval-right': '0 8px 8px 0',
      },
      boxShadow: {
        'naval-focus': '0 0 0 0.2rem rgba(184, 134, 11, 0.25)',
        'naval-hover': '0 0 0 0.2rem rgba(184, 134, 11, 0.15)',
        'naval-elevation': '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        'naval-input': '12px',
        'naval-height': '48px',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'naval-scale': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.01)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'naval-scale': 'naval-scale 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;