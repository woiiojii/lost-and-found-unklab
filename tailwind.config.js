/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false,
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./convex/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Royal Purple (#6a046a) as Primary Brand Color
        purple: {
          50:  "#fbf4fb",
          100: "#f5e6f5",
          200: "#eccdec",
          300: "#dea3de",
          400: "#c76fc7",
          500: "#9e2a9e",
          600: "#6a046a", // EXACT user requested color
          700: "#560356",
          800: "#420242",
          900: "#300130",
        },
        brand: {
          50:  "#fbf4fb",
          100: "#f5e6f5",
          200: "#eccdec",
          300: "#dea3de",
          400: "#c76fc7",
          500: "#9e2a9e",
          600: "#6a046a",
          700: "#560356",
          800: "#420242",
          900: "#300130",
        },
        background: "#f8fafc",
        "background-card": "#ffffff",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Outfit", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "6px",
        lg: "8px", // Standard 8px
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 8px 20px -4px rgba(106, 4, 106, 0.15)",
        glow: "0 0 16px rgba(106, 4, 106, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
