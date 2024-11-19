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

  if (!apiKey) {
    return res.status(401).json({ message: "Api key no proporcionada" });
  }

  if (api_key !== apiKey) {
    console.log({api_key, apiKey});
    
    return res.status(401).json({ message: "Api key incorrecta" , apiKey});
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

      // Limitar el número de resultados
      const maxResults = 12;
      const filteredData = [];
      for (const item of data) {
        if (filteredData.length >= maxResults) break;
        const { 
          codigo, codigobarra, categoria, color, modelo, 
          marca, condiciones, promociones, existenciasdeposito, 
          ...rest 
        } = item;
        filteredData.push(rest);
      }

  res.json({ filteredData });
}

// Ruta principal
app.post("/buscarProductos", buscarProductos);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor activo`);
});
