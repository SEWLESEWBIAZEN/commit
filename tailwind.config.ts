import type { Config } from 'tailwindcss';

// Colors map to the CSS variables defined in app/globals.css, so the existing
// light/dark theming (driven by [data-theme] on <html>) keeps working through
// utility classes like `bg-surface`, `text-muted`, `border-border`.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page-bg)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-soft': 'var(--border-soft)',
        cell: 'var(--cell)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        hint: 'var(--hint)',
        green: 'var(--green)',
        'green-act': 'var(--green-act)',
        'green-dim': 'var(--green-dim)',
        amber: 'var(--amber)',
        red: 'var(--red)',
        blue: 'var(--blue)',
        'green-fill': 'var(--green-fill)',
        'amber-fill': 'var(--amber-fill)',
        'red-fill': 'var(--red-fill)',
        'blue-fill': 'var(--blue-fill)',
        'green-edge': 'var(--green-edge)',
        'amber-edge': 'var(--amber-edge)',
        'red-edge': 'var(--red-edge)',
        'blue-edge': 'var(--blue-edge)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        DEFAULT: 'var(--r)',
        lg: 'var(--r-lg)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
};

export default config;
