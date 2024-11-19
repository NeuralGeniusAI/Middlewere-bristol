const express = require("express");
const dotenv = require("dotenv");
const app = express();
const PORT = 3000;

// Cargar las variables de entorno
dotenv.config();

// Middleware para parsear JSON en las solicitudes
app.use(express.json());

async function buscarProductos(req, res) {
  const { query, apiKey } = req.body;
  const api_key = process.env.API_KEY;
  const token = process.env.TOKEN;

  console.log(apiKey, api_key);

  if (!apiKey) {
    return res.status(401).json({ message: "Api key no proporcionada" });
  }

  if (apiKey !== api_key) {
    return res.status(401).json({ message: "Api key incorrecta" });
  }

  if (!query) {
    return res.status(400).json({ message: "Query no proporcionada" });
  } 

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }


  const options = {
    method: "POST",
    body: JSON.stringify({ token, q: query }),
  };

  const response = await fetch(
    "https://secure.bristol.com.py:9091/ws_comercial/?buscararticulos",
    options
  );

  const { data } = await response.json();

  const filteredData = data.map((item) => {
    //   {
    //     id: 8958,
    //     codigo: 'BS8958',
    //     nombre: 'Celular Iphone 13 256GB Azul',
    //     descripcion: '',
    //     codigobarra: 'BS8958',
    //     precio: 7401000,
    //     existencia: 0,
    //     categoria: 'Celulares',
    //     color: '',
    //     modelo: '',
    //     marca: 'APPLE',
    //     imagen: null,
    //     condiciones: [Array],
    //     promociones: [Array],
    //     existenciasdeposito: []
    //   },

    const {
      codigo,
      codigobarra,
      categoria,
      color,
      modelo,
      marca,
      condiciones,
      promociones,
      existenciasdeposito,
      ...filteredData
    } = item;

    return filteredData;
  });

  console.log(filteredData);

  res.json({ filteredData });
}

// Ruta principal
app.post("/buscarProductos", buscarProductos);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:3000`);
});
