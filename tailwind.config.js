/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Paper-forward neutrals + one warm accent. Referenced via CSS vars so
        // light/dark swap in one place (see index.css).
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
      fontFamily: {
        // Self-hosted faces arrive in the polish stage; warm system stacks now
        // keep everything offline-safe.
        serif: ['"Iowan Old Style"', 'Georgia', 'Cambria', 'ui-serif', 'serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
        hand: ['"Bradley Hand"', '"Segoe Print"', 'ui-serif', 'cursive'],
      },
    },
  },
  plugins: [],
};
