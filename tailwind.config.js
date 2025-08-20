/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
        heading: 'var(--color-heading)',
        body: 'var(--color-body)',
        placeholder: 'var(--color-placeholder)',
        border: 'var(--color-border)',
        errorLight: 'var(--color-error-light)',
        errorDark: 'var(--color-error-dark)',
        successLight: 'var(--color-success-light)',
        successDark: 'var(--color-success-dark)',
        warningLight: 'var(--color-warning-light)',
        warningDark: 'var(--color-warning-dark)',
        warningMedium: 'var(--color-warning-medium)',
        warningLighter: 'var(--color-warning-lighter)',
      },
    },
  },
  plugins: [],
}
