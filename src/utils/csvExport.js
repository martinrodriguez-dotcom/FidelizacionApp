/**
 * Genera y descarga un archivo CSV a partir de un arreglo de clientes.
 * @param {Array} customers - Lista de clientes a exportar obtenidos de Firestore
 * @param {string} businessName - Nombre del negocio para nombrar el archivo descargado
 */
export const exportCustomersToCSV = (customers, businessName) => {
  if (!customers || customers.length === 0) {
    alert("No hay datos de clientes para exportar.");
    return;
  }

  // 1. Definir las cabeceras del archivo CSV
  const header = "Nombre,Email,Telefono,Visitas,Puntos\n";
  
  // 2. Mapear los datos de los clientes a filas de texto separadas por comas
  const rows = customers.map(c => 
    `${c.customerName},${c.customerEmail},${c.customerPhone},${c.visits},${c.points}`
  ).join("\n");
  
  // 3. Crear un objeto Blob con el contenido completo
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  
  // 4. Crear un enlace (anchor) temporal en el DOM para forzar la descarga
  const link = document.createElement('a');
  link.href = url;
  
  // Limpiar el nombre del archivo reemplazando espacios por guiones bajos
  const cleanName = businessName.replace(/\s+/g, '_').toLowerCase();
  link.setAttribute('download', `clientes_${cleanName}.csv`);
  
  // 5. Simular el clic y limpiar el DOM
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
