async function filterByPromotions(data) {
  const result = {};
  data.condiciones
    .filter(condition => [0, 1, 6, 12, 18, 30].includes(condition.cuotas)) // Filtrar por cuotas deseadas
    .forEach(condition => {
      const { nombrepromocion, ...rest } = condition; // Extraer nombrepromocion y resto del objeto
      if (!result[nombrepromocion]) {
        result[nombrepromocion] = []; // Crear un array si no existe
      }
      // if (nombrepromocion === "Lista Precio Vigente") {
         result[nombrepromocion].push(rest); // Agregar el objeto al array correspondiente
      // }
     
    });
  // Ordenar cada array por la propiedad `cuotas`
  Object.keys(result).forEach(key => {
    result[key].sort((a, b) => a.cuotas - b.cuotas); // Ordenar de menor a mayor
  });
  return result;
}
  
  module.exports = { filterByPromotions };
  