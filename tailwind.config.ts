import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        page: 'var(--surface-page)',
        card: 'var(--surface-card)',
        ink: 'var(--surface-ink)',
        sunken: 'var(--surface-sunken)',
        accent: { DEFAULT: 'var(--accent)', soft: 'var(--accent-soft)' },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          dim: 'var(--text-dim)',
        },
        hairline: 'var(--border-hairline)',
        warning: '#e8a430',
        danger: '#e85476',
        success: '#2a9d6b',
        frost: '#9fd6ef',
        drip: '#bfe6f5',
        tag: {
          lecture: '#5cbbff',
          class: '#6b5cf0',
          exam: '#e85476',
          assignment: '#2a9d6b',
          report: '#e8a430',
          presentation: '#c0497b',
          reading: '#7a8699',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '18px',
        pane: '20px',
        hero: '22px',
        field: '12px',
        tile: '14px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        nav: '0 4px 28px rgba(0,0,0,0.13)',
        pop: '0 14px 44px rgba(0,0,0,0.18)',
        sheet: '0 -8px 40px rgba(0,0,0,0.20)',
        accent: '0 8px 24px rgba(107,92,240,0.23)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4,0,0.2,1)',
      },
      screens: {
        // README §5
        'tablet': '834px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
    },
  },
  plugins: [],
} satisfies Config;
