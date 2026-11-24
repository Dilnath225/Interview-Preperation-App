/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617',
          925: '#0a101d',
          900: '#0f172a',
          850: '#131e32',
        },
      },
    },
  },
  plugins: [],
};
