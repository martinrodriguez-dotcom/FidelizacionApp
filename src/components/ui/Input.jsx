import React from 'react';

/**
 * Componente Input Reutilizable con etiqueta (label) integrada y estilos de Tailwind CSS.
 * @param {string} label - Texto de la etiqueta del input
 * @param {string} id - ID único para accesibilidad (asocia el label con el input)
 * @param {string} type - Tipo de input ('text', 'email', 'number', 'password', etc.)
 * @param {string|number} value - Valor actual del input
 * @param {Function} onChange - Función para manejar el cambio de valor
 * @param {string} placeholder - Texto temporal de ayuda
 * @param {boolean} required - Si el campo es obligatorio (agrega un asterisco rojo)
 * @param {string} className - Clases adicionales de Tailwind para el contenedor
 */
const Input = ({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Renderiza el label solo si se proporciona uno */}
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
        {...props}
      />
    </div>
  );
};

export default Input;
