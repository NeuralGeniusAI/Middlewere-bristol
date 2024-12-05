const express = require("express");
const { filterByPromotions } = require("../utils/filterByPromotions");

const router = express.Router();

router.post("/", async (req, res) => {
  const { query, apiKey } = req.body;
  const api_key = process.env.API_KEY;
  const token = process.env.TOKEN;

  try {
    if (!apiKey) {
      return res.status(401).json({ message: "Api key no proporcionada" });
    }

    if (api_key !== apiKey) {
      return res.status(401).json({ message: "Api key incorrecta", apiKey });
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res
        .status(400)
        .json({ message: "Query no proporcionada o no válida" });
    }

    if (!token) {
      return res
        .status(500)
        .json({ message: "Token no configurado en el servidor" });
    }

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, q: query }),
    };

    const response = await fetch(
      "https://secure.bristol.com.py:9091/ws_comercial/?buscararticulos",
      options
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Error en la API externa",
        status: response.status,
      });
    }

    const { data } = await response.json();

    const maxResults = 5;
    const filteredData = data.slice(0, maxResults).map((item) => ({
      ...item,
      condiciones: item.condiciones.map(
        ({ deposito, idlistaprecio, visible, ...rest }) => rest
      ),
    }));

    const dataToReturn = await Promise.all(
      filteredData.map(async (product) => ({
        ...product,
        condiciones: await filterByPromotions(product),
      }))
    );

    res.json({ dataToReturn });
  } catch (error) {
    console.error("Error en buscarProductos:", error.message);

    if (error.name === "FetchError") {
      return res
        .status(504)
        .json({ message: "Error al conectar con la API externa" });
    }

    res.status(500).json({ message: "Error interno del servidor", error });
  }
});

module.exports = router;
