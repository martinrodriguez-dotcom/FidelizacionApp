/** @type {import('tailwindcss').Config} */
module.exports = {
  // Definimos dónde debe buscar Tailwind las clases para generar el CSS.
  // He incluido todas las rutas posibles para evitar que se pierda el formato.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        // Inyectamos la gama completa de colores "rosa" para Dulce Sal.
        // Esto permite usar clases como bg-rosa-500, text-rosa-600, etc.
        rosa: {
          50: '#fdf2f8',  // Fondos ultra suaves
          100: '#fce7f3', // Fondos suaves y hovers
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // El Rosa Dulce Sal principal
          600: '#db2777', // Rosa para estados activos o botones oscuros
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
      },
      // Agregamos sombras personalizadas con el tono de la marca
      boxShadow: {
        'rosa': '0 20px 25px -5px rgba(236, 72, 153, 0.1), 0 10px 10px -5px rgba(236, 72, 153, 0.04)',
        'rosa-sm': '0 2px 4px 0 rgba(236, 72, 153, 0.05)',
      }
    },
  },
  plugins: [],
}
