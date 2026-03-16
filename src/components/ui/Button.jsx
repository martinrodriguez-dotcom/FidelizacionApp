import React from 'react';

/**
 * Componente Botón Reutilizable con diferentes variantes de diseño (Tailwind CSS).
 * @param {React.ReactNode} children - Texto o contenido del botón
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'outline'
 * @param {boolean} fullWidth - Si es true, el botón ocupa el 100% del ancho de su contenedor
 * @param {Function} onClick - Función a ejecutar al hacer clic
 * @param {string} className - Clases adicionales de Tailwind para personalizar
 * @param {string} type - Tipo de botón ('button' | 'submit' | 'reset')
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  onClick, 
  className = '',
  type = 'button',
  ...props 
}) => {
  // Definimos los estilos base que comparten todos los botones
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-colors duration-200 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Definimos las variantes de color y estilo
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    outline: "bg-transparent border-2 border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600"
  };

  // Combinamos las clases base, las de la variante, el ancho completo y las extras
  const combinedClasses = `
    ${baseStyles} 
    ${variants[variant]} 
    ${fullWidth ? 'w-full' : ''} 
    ${className}
  `.trim();

  return (
    <button 
      type={type}
      className={combinedClasses} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
