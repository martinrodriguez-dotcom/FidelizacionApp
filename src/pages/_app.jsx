import '../styles/globals.css';

/**
 * Componente Raíz de la Aplicación (_app.jsx)
 * Este archivo es fundamental en Next.js para inicializar todas las páginas.
 * Al importar 'globals.css' aquí, garantizamos que los estilos de Tailwind CSS
 * estén disponibles en todo el proyecto.
 */
function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Se envuelve la aplicación en un contenedor base para asegurar 
          que el fondo y el comportamiento de selección de texto sean consistentes.
      */}
      <Component {...pageProps} />
    </div>
  );
}

export default App;
