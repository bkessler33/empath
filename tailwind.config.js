/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx}',
    // Include paths to any other files that might contain Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}