/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'vaani-large-text',
    'vaani-high-contrast',
    'vaani-landing',
    'badge',
    'badge-success',
    'badge-warning',
    'badge-error',
    'btn',
    'btn-ghost',
    'btn-icon',
    'text-primary',
    'text-muted',
    'bg-secondary',
    'chip-btn',
    'chip-active',
    'toolbar-btn',
    'animate-fadeIn',
    'animate-fadeInDown',
  ],
}
