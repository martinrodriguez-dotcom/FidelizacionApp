import React from 'react';

/**
 * Componente Principal de Next.js (_app.jsx)
 * ----------------------------------------------------------------------------
 * Se han eliminado las importaciones de archivos CSS externos para evitar
 * errores de resolución y se han integrado los estilos base directamente.
 */
function App({ Component, pageProps }) {
  // Aseguramos que el componente sea válido
  const ActiveComponent = Component || (() => null);

  return (
    <>
      {/* Configuración de Viewport para asegurar que la App se vea bien en móviles */}
      <meta 
        name="viewport" 
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" 
      />
      
      {/* Estilos Globales Integrados para garantizar el formato Rosa Dulce Sal */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Definición manual de la paleta rosa para mayor seguridad */
        :root {
          --rosa-50: #fdf2f8;
          --rosa-100: #fce7f3;
          --rosa-200: #fbcfe8;
          --rosa-500: #ec4899;
          --rosa-600: #db2777;
        }

        html, body {
          padding: 0;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc; /* slate-50 */
          color: #0f172a; /* slate-900 */
          -webkit-tap-highlight-color: transparent;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Utilidad para la selección de texto con colores de la marca */
        ::selection {
          background-color: var(--rosa-100);
          color: #831843; /* rosa-900 */
        }

        /* Clases de utilidad personalizadas para asegurar el diseño */
        .bg-rosa-50 { background-color: var(--rosa-50); }
        .bg-rosa-100 { background-color: var(--rosa-100); }
        .bg-rosa-200 { background-color: var(--rosa-200); }
        .bg-rosa-500 { background-color: var(--rosa-500); }
        .bg-rosa-600 { background-color: var(--rosa-600); }
        .text-rosa-500 { color: var(--rosa-500); }
        .text-rosa-600 { color: var(--rosa-600); }
        
        .shadow-rosa { 
          box-shadow: 0 20px 25px -5px rgba(236, 72, 153, 0.1), 0 10px 10px -5px rgba(236, 72, 153, 0.04); 
        }
      `}} />

      {/* Contenedor principal con clases de Tailwind aplicadas */}
      <div className="min-h-screen bg-slate-50 selection:bg-rosa-100 selection:text-rosa-900">
        <ActiveComponent {...pageProps} />
      </div>
    </>
  );
}

export default App;
