const express = require("express");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const obtenerCoordenadas = require("./obtenerCoordenadas");
const app = express();
const PORT = 3000;
const https = require("https");

dotenv.config();

app.use(express.json());

const urlPromotions =
  "https://secure.bristol.com.py/bristol/api/v2/service/chatbot/promotions";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function validarPromocion(promotionParam) {
  try {
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    };

    const response = await fetch(urlPromotions, options);

    // console.log("Promocion por param : ", promotionParam)

    const { data } = await response.json();

    console.log("Data de promociones : ", data);

    console.log("Promocion por param : ", promotionParam);

    return data.some(
      (promotion) => promotion.promocionNombre === promotionParam
    );
  } catch (error) {
    console.error("Error en validarPromocion:", error.message);
    return false;
  }
}

async function buscarProductos(req, res) {
  const { query, apiKey } = req.body;
  const api_key = process.env.API_KEY;
  const token = process.env.TOKEN;

  try {
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

    // Limitar el número de resultados
    const maxResults = 12;
    const filteredData = [];
    for (const item of data) {
      if (filteredData.length >= maxResults) break;

      const {
        id,
        codigo,
        categoria,
        color,
        modelo,
        marca,
        promociones,
        existenciasdeposito,
        ...rest
      } = item;

      const filteredCondiciones = rest.condiciones.map(
        ({
          deposito,
          idlistaprecio,
          visible,
          idcomercialplazo,
          alcance,
          mediopago,
          calificacion,
          idpromocion,
          ...restCondicion
        }) => restCondicion
      );

      filteredData.push({ ...rest, condiciones: filteredCondiciones });
    }

    let dataToReturn = await Promise.all(
      filteredData.map(async (product) => {
        let infoFiltrada = await filterByPromotions(product);
        let condicionesActualizadas = Object.values(infoFiltrada).flat();

        return {
          ...product,
          condiciones: condicionesActualizadas,
        };
      })
    );

    console.log("Data a retornar : ", dataToReturn);

    res.json({ dataToReturn });
  } catch (error) {
    console.error("Error en buscarProductos:", error.message);

    if (error.name === "FetchError") {
      return res
        .status(504)
        .json({ message: "Error al conectar con la API externa" });
    }

    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
}

async function filterByPromotions(product) {
  let groupedByPromotion = {};
  let conditions = product.condiciones;
  let promotionCache = {}; // Cache para validaciones

  for (const condition of conditions) {
    let promotion = condition.nombrepromocion;

    if (!(promotion in promotionCache)) {
      // console.log("Promocion : ", promotion)

      let promotionFormatted = promotion.split('/')[0];
      
      promotionCache[promotion] = await validarPromocion(promotionFormatted);
    }

    if (promotionCache[promotion]) {
      if (!groupedByPromotion[promotion]) {
        groupedByPromotion[promotion] = [];
      }
      groupedByPromotion[promotion].push(condition);
    }
  }

  for (let promotion in groupedByPromotion) {
    groupedByPromotion[promotion].sort((a, b) => {
      if (a.condicion < b.condicion) return -1;
      if (a.condicion > b.condicion) return 1;
      return a.cuotas - b.cuotas;
    });
  }

  return groupedByPromotion;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "facundolizardotrabajosia@gmail.com", // Tu correo electrónico
    pass: process.env.GOOGLE_PASSWORD, // Contraseña de aplicación generada en Google
  },
});

async function enviarEmailConDatosDeCompra(req, res) {
  const {
    nombre,
    documento,
    tipoDeDocumento,
    productos,
    entrega,
    direccion,
    codigoSucursal,
    nombreSucursal,
    apiKey,
  } = req.body;

  const api_key = process.env.API_KEY;

  try {
    if (!apiKey) {
      return res.status(401).json({ message: "Api key no proporcionada" });
    }

    if (api_key !== apiKey) {
      console.log({ api_key, apiKey });
      return res.status(401).json({ message: "Api key incorrecta", apiKey });
    }

    if (!nombre || !documento || !tipoDeDocumento || !productos || !entrega) {
      return res.status(400).json({
        message:
          "Los campos nombre, documento, tipoDeDocumento, productos y entrega son obligatorios",
      });
    }

    // Validar campos según el tipo de entrega
    if (entrega === "1" && (!codigoSucursal || !nombreSucursal)) {
      return res.status(400).json({
        message:
          "Los campos codigoSucursal y nombreSucursal son obligatorios para el tipo de entrega 2",
      });
    }

    if (entrega === "2" && !direccion) {
      return res.status(400).json({
        message: "El campo direccion es obligatorio para el tipo de entrega 1",
      });
    }

    // Limpiar el string de productos eliminando escapes adicionales
    let arrayProductos;
    try {
      const cleanedProductos = productos.replace(/\\\\/g, "\\"); // Elimina \\ adicionales
      arrayProductos = JSON.parse(cleanedProductos); // Parsear el string limpio
    } catch (error) {
      return res.status(400).json({
        message: "El campo productos no tiene un formato JSON válido",
        error: error.message,
      });
    }

    if (!Array.isArray(arrayProductos)) {
      return res
        .status(400)
        .json({ message: "El campo productos debe ser un array válido" });
    }

    let coordenadas = null;
    try {
      if (entrega === "2") {
        coordenadas = await obtenerCoordenadas(direccion, "Paraguay");
      }
    } catch (error) {
      if (
        error.message ===
        "No se encontraron resultados para la dirección proporcionada."
      ) {
        return res.status(200).json({ message: error.message, error });
      }
      throw error;
    }

    const mailOptions = {
      from: "facundolizardotrabajosia@gmail.com",
      to: "facundolizardo75@gmail.com,victor.barreto@bristol.com.py",
      subject: "Correo de test del agente de ventas",
      text: `Hola, este es un correo enviado para testear el agente de ventas.
      Informacion de la compra: 
      - Cliente
      Nombre: ${nombre}
      tipoDeDocumento: ${tipoDeDocumento} 
      documento: ${documento} 

      - Productos
      ${arrayProductos
        .map((producto, index) => {
          const number = index + 1;
          return `
      ${number}. Nombre: ${producto.nombre}
        codigobarra: ${producto.codigobarra} 
        Cantidad: ${producto.cantidad}
        Precio: ${producto.precio}
        Tipo de pago: Credito (18 cuotas de ${(producto.precio / 18).toFixed(
          2
        )})
      `;
        })
        .join("")}
    
      - Datos de entrega o retiro
      Tipo de entrega: ${entrega}
      ${
        entrega === "1"
          ? `Sucursal: 
       * Codigo de sucursal: ${codigoSucursal}
       * Nombre de sucursal: ${nombreSucursal}`
          : `Direccion del cliente: ${direccion}, Paraguay
      Ubicacion:
       * Latitud: ${coordenadas.lat}
       * Longitud: ${coordenadas.lon}`
      }
      `,
    };

    // Enviar correo
    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Correo enviado con éxito", info });
  } catch (error) {
    console.log(error);
    if (
      error === "No se encontraron resultados para la dirección proporcionada."
    ) {
      res.status(500).json({ message: error });
    }

    res.status(500).json({ message: "Error al enviar el correo", error });
  }
}

// Ruta principal
app.post("/buscarProductos", buscarProductos);
app.post("/enviarEmail", enviarEmailConDatosDeCompra);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor activo`);
});
