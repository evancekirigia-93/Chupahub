import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F58A2B',
          deep: '#78330E',
          soft: '#25180F',
          ink: '#F8F1E8',
        },
      },
      boxShadow: {
        orange: '0 18px 45px rgba(240, 90, 26, .24)',
        card: '0 12px 28px rgba(33, 20, 15, .12)',
      },
    },
  },
  plugins: [],
};

export default config;
