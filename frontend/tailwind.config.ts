import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', '"Chakra Petch"', 'system-ui', 'sans-serif'],
        body: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        arena: {
          void: '#04030f',
          surface: '#0d0e3d',
          night: '#0a0b2e',
          deep: '#131454',
          indigo: '#2a1f8c',
          plasma: '#ff2b8e',
          ember: '#ff7a1a',
          sun: '#ffd24a',
          cyan: '#22d3ee',
          mint: '#6ee7b7',
          violet: '#a78bfa',
        },
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(255,43,142,0.35), 0 10px 60px -10px rgba(255,43,142,0.55)',
        cyan: '0 0 0 1px rgba(34,211,238,0.35), 0 10px 60px -10px rgba(34,211,238,0.55)',
        ember:
          '0 0 0 1px rgba(255,122,26,0.35), 0 10px 60px -10px rgba(255,122,26,0.55)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.75' },
          '50%': { opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
      },
      backgroundImage: {
        'arena-gradient':
          'radial-gradient(ellipse at 20% 10%, rgba(255,43,142,0.25), transparent 55%), radial-gradient(ellipse at 80% 0%, rgba(34,211,238,0.25), transparent 55%), radial-gradient(ellipse at 50% 110%, rgba(255,122,26,0.22), transparent 60%), linear-gradient(180deg, #04030f 0%, #0a0b2e 45%, #04030f 100%)',
        grid: 'linear-gradient(rgba(167,139,250,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
} satisfies Config
