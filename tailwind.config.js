/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Definimos dónde debe buscar Tailwind las clases para generar el CSS
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 2. Aquí inyectamos la paleta "rosa" personalizada de Dulce Sal
      colors: {
        rosa: {
          50: '#fdf2f8',  // Fondos muy claros
          100: '#fce7f3', // Fondos suaves / Hovers
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // El rosa principal de la marca
          600: '#db2777', // Rosa oscuro para estados activos
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
      },
      // 3. Sombras personalizadas con el tono de la marca
      boxShadow: {
        'rosa-sm': '0 2px 4px 0 rgba(236, 72, 153, 0.05)',
        'rosa-xl': '0 20px 25px -5px rgba(236, 72, 153, 0.1), 0 10px 10px -5px rgba(236, 72, 153, 0.04)',
      }
    },
  },
  plugins: [],
}
