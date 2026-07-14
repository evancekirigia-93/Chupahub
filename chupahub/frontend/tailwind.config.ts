import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{ts,tsx}'], theme: { extend: { colors: { gold: '#d4af37', night: '#080808' }, boxShadow: { gold: '0 20px 60px rgba(212,175,55,.18)' } } }, plugins: [] };
export default config;
