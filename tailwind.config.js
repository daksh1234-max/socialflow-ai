/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#12121A',
        surfaceHighlight: '#1A1A25',
        primary: '#6366F1',
        primaryGlow: '#818CF8',
        secondary: '#A78BFA',
        accent: '#22D3EE',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        textMuted: '#475569',
        border: 'rgba(255,255,255,0.06)',
        glass: 'rgba(18,18,26,0.7)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
