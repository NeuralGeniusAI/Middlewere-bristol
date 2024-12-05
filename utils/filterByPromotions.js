async function filterByPromotions(data) {
    const result = {};
  
    data.condiciones
      .filter(condition => [0, 1, 6, 12, 18, 30].includes(condition.cuotas))
      .forEach(condition => {
        const { nombrepromocion, ...rest } = condition;
        if (!result[nombrepromocion]) {
          result[nombrepromocion] = [];
        }
        result[nombrepromocion].push(rest);
      });
  
    Object.keys(result).forEach(key => {
      result[key].sort((a, b) => a.cuotas - b.cuotas);
    });
  
    return result;
  }
  
  module.exports = { filterByPromotions };
  