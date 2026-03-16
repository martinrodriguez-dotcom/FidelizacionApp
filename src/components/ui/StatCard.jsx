import React from 'react';

/**
 * Componente para mostrar una métrica clave (KPI) en el Dashboard del negocio.
 * @param {string} title - El título de la métrica (ej. "Total Clientes")
 * @param {string|number} value - El valor numérico a mostrar
 * @param {React.ReactNode} icon - Componente de icono (ej. de Lucide React)
 * @param {string} trend - Opcional. Tendencia o variación (ej. "+5% esta semana")
 */
const StatCard = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{value}</h3>
        </div>
        
        {/* Contenedor del icono con un fondo suave */}
        <div className="p-3 bg-slate-50 rounded-xl text-indigo-600">
          {icon}
        </div>
      </div>
      
      {/* Opcional: Mostrar indicador de tendencia si se proporciona */}
      {trend && (
        <div className="mt-2 text-sm text-emerald-600 font-medium flex items-center gap-1">
          <span>↑</span> {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
