async function obtenerCoordenadas(direccion, ciudad) {
  console.log("obtenerCoordenadas veover");
  
  try {
    // Completar la URL
    const pais = 'Paraguay';
    const url = `https://nominatim.openstreetmap.org/search?q=${direccion},${ciudad},Paraguay,&format=json`;

    // Realizar la petición GET
    const response = await fetch(url);
    
    // Validar si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error al obtener coordenadas: ${response.statusText}`);
    }

    const data = await response.json();

    // Validar que haya resultados
    if (!data || data.length === 0) {
      throw new Error('No se encontraron resultados para la dirección proporcionada.');
    }

    // Tomar el primer objeto del array y devolver lat y lon
    const { lat, lon } = data[0];
    return { lat, lon };
  } catch (error) {
    console.error(error);
    throw error; // Re-lanzar el error para manejarlo en la llamada de la función
  }
}

module.exports = obtenerCoordenadas;
