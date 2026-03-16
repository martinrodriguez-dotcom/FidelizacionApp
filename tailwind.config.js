/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Aquí agregamos nuestra gama de colores personalizados
      colors: {
        rosa: {
          50: '#fdf2f8',  // Muy claro (ideal para fondos suaves)
          100: '#fce7f3', // Claro (ideal para hover en fondos)
          200: '#fbcfe8',
          300: '#f9a8d4', // Rosa pastel
          400: '#f472b6',
          500: '#ec4899', // Rosa principal (ideal para botones o iconos)
          600: '#db2777', // Rosa oscuro (ideal para hover en botones)
          700: '#be185d',
          800: '#9d174d',
          900: '#831843', // Muy oscuro (ideal para textos contrastantes)
          950: '#500724',
        }
      }
    },
  },
  plugins: [],
}
