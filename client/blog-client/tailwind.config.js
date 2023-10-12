/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'davys': '#545454',
        'red': '#F87575',
        'vista': '#91A6FF',
      }
    },
  },
  plugins: [],
}

