async function obtenerCoordenadas(direccion) {
  
  try {
    // Completar la URL
    const pais = 'Paraguay';
    const url = `https://nominatim.openstreetmap.org/search?q=${direccion},Paraguay,&format=json`;

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
    
    console.error(error.message); // Asegúrate de registrar el mensaje del error
    throw new Error(error.message); // Re-lanzar el error con el mensaje explícito

  }
}

module.exports = obtenerCoordenadas;
