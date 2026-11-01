/** Tokens du visuel Yo Money (palette, typographie, rayons, ombres). */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F172A',
          foreground: '#F8FAFC',
          muted: '#94A3B8',
        },
        secondary: {
          DEFAULT: '#1E293B',
          foreground: '#E2E8F0',
        },
        tertiary: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
          soft: '#D1FAE5',
          ink: '#047857',
        },
        neutral: '#F8FAFC',
        surface: '#FFFFFF',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        canvas: '#070B14',
        nav: '#020617',
        frame: '#6D5BD0',
        danger: {
          DEFAULT: '#E11D48',
          soft: '#FFE4E6',
          ink: '#BE123C',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: '#FEF3C7',
          ink: '#92400E',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        control: '0.875rem',
        card: '1.25rem',
        shell: '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 12px 32px rgb(15 23 42 / 0.06)',
        shell: '0 24px 80px rgb(0 0 0 / 0.45)',
      },
    },
  },
};
