/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7fee7',
          100: '#ecfccb',
          500: '#84cc16', 
          600: '#65a30d',
          700: '#4d7c0f',
          900: '#365314',
        },
        secondary: {
          500: '#f97316',
          600: '#ea580c',
        }
      }
    }
  },
  plugins: [],
}