import React from 'react';

/**
 * Layout principal para el panel de administración del negocio.
 * Envuelve el contenido principal e incluye el Sidebar (barra lateral) de navegación.
 * @param {React.ReactNode} children - El contenido específico de cada página a renderizar
 * @param {string} businessName - El nombre del negocio actual para mostrar en la cabecera
 * @param {Array} navItems - Array de objetos con las opciones del menú ({ label, icon, path, onClick })
 * @param {string} activePath - La ruta actualmente activa para resaltar la opción en el menú
 */
const AdminLayout = ({ children, businessName, navItems = [], activePath = '' }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar (Barra Lateral) */}
      {/* En pantallas móviles (md: down) se posiciona arriba, en desktop es lateral y sticky */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col md:sticky top-0 md:h-screen z-10">
        
        {/* Cabecera del Sidebar con el nombre del negocio */}
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-xl text-indigo-900 truncate" title={businessName}>
            {businessName || "Cargando Panel..."}
          </h2>
          <p className="text-xs text-slate-500 uppercase font-semibold mt-1 tracking-wider">
            SaaS Admin Panel
          </p>
        </div>
        
        {/* Navegación - Mapeo de los items pasados por props */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = activePath === item.path;
            return (
              <button 
                key={index}
                onClick={item.onClick}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                {/* Clonamos el icono para inyectarle el color dinámicamente según si está activo o no */}
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
        
      </aside>

      {/* Área Principal de Contenido donde se inyectarán las páginas hijas */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      
    </div>
  );
};

export default AdminLayout;
