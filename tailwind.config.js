/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#3B82F6',      // Distribution center blue
        'secondary': '#F97316',    // Delivery points orange
        'route': '#10B981',        // Route path green
        'success': '#22C55E',
        'warning': '#F59E0B',
        'error': '#EF4444',
      }
    },
  },
  plugins: [],
}