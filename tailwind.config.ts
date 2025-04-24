import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Define your colors with fixed values, Tailwind v4 needs concrete values
      colors: {
        // Light mode (default)
        border: 'rgb(var(--color-border, 229 231 235) / <alpha-value>)',
        input: 'rgb(var(--color-input, 229 231 235) / <alpha-value>)',
        ring: 'rgb(var(--color-ring, 31 41 55) / <alpha-value>)',
        background: 'rgb(var(--color-background, 255 255 255) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground, 17 24 39) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--color-primary, 31 41 55) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground, 249 250 251) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary, 243 244 246) / <alpha-value>)',
          foreground: 'rgb(var(--color-secondary-foreground, 31 41 55) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive, 239 68 68) / <alpha-value>)',
          foreground: 'rgb(var(--color-destructive-foreground, 249 250 251) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted, 243 244 246) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground, 107 114 128) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent, 243 244 246) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground, 31 41 55) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--color-popover, 255 255 255) / <alpha-value>)',
          foreground: 'rgb(var(--color-popover-foreground, 17 24 39) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--color-card, 255 255 255) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground, 17 24 39) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success, 22 163 74) / <alpha-value>)',
          foreground: 'rgb(var(--color-success-foreground, 249 250 251) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning, 245 158 11) / <alpha-value>)',
          foreground: 'rgb(var(--color-warning-foreground, 0 0 0) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info, 59 130 246) / <alpha-value>)',
          foreground: 'rgb(var(--color-info-foreground, 249 250 251) / <alpha-value>)',
        },
        status: {
          new: 'rgb(var(--color-status-new, 147 51 234) / <alpha-value>)',
          'in-progress': 'rgb(var(--color-status-in-progress, 59 130 246) / <alpha-value>)',
          completed: 'rgb(var(--color-status-completed, 22 163 74) / <alpha-value>)',
          cancelled: 'rgb(var(--color-status-cancelled, 239 68 68) / <alpha-value>)',
          scheduled: 'rgb(var(--color-status-scheduled, 79 70 229) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
        // Note: Ensure --font-geist-sans and --font-geist-mono are defined in CSS
      },
    },
  },
  plugins: [],
};

export default config;
