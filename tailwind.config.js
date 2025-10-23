/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal futurista baseada no verde original
        primary: {
          50: "#E8F8EE",
          100: "#C6EEDB",
          200: "#9EE2C5",
          300: "#6FD6AE",
          400: "#45CA9A",
          500: "#178A3A", // verde original mantido
          600: "#147833",
          700: "#10632A",
          800: "#0C4F22",
          900: "#073A18",
        },
        // Cores secundárias futuristas
        accent: {
          cyan: "#00F5FF",
          purple: "#A855F7",
          pink: "#EC4899",
          emerald: "#10B981",
        },
        // Backgrounds escuros para contraste
        dark: {
          50: "#1E293B",
          100: "#0F172A",
          200: "#020617",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glow-green": "radial-gradient(circle at center, rgba(23, 138, 58, 0.15) 0%, transparent 70%)",
        "mesh-gradient": "linear-gradient(135deg, #178A3A 0%, #10B981 50%, #00F5FF 100%)",
      },
      boxShadow: {
        "neon-sm": "0 0 10px rgba(23, 138, 58, 0.5)",
        "neon-md": "0 0 20px rgba(23, 138, 58, 0.6), 0 0 40px rgba(23, 138, 58, 0.3)",
        "neon-lg": "0 0 30px rgba(23, 138, 58, 0.7), 0 0 60px rgba(23, 138, 58, 0.4)",
        "glow-cyan": "0 0 20px rgba(0, 245, 255, 0.5)",
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        "3d": "0 20px 60px -15px rgba(0, 0, 0, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(23, 138, 58, 0.5)" },
          "100%": { boxShadow: "0 0 40px rgba(23, 138, 58, 0.8), 0 0 60px rgba(23, 138, 58, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
