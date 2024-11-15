const express = require('express');
const dotenv = require("dotenv");
const app = express();
const PORT = 3000;

// Middleware para parsear JSON en las solicitudes
app.use(express.json());

async function buscarProductos(req, res) {
    const { query } = req.body;
    res.json({ query, products: ["pene"] });
}

// Ruta principal
app.post('/buscarProductos', buscarProductos);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:3000`);
});
