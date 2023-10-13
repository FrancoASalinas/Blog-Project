/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dancing': 'DancingScript',
        'urbanist': 'Urbanist',
      },
      colors: {
        'jet': '#333333',
        'seasalt': '#FCFAF9',
        'argentinian': '#35A7FF',
      }
    },
  },
  plugins: [],
}

