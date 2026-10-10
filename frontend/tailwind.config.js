/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
  keyframes: {
    gradientMove: {
      "0%, 100%": {
        backgroundPosition: "20% 20%, 80% 0%, 50% 100%",
      },
      "50%": {
        backgroundPosition: "25% 25%, 75% 5%, 55% 95%",
      },
    },
  },
  animation: {
    gradientMove: "gradientMove 12s ease-in-out infinite",
  },
},
  },
  plugins: [],
};
