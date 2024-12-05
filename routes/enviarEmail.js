const express = require("express");
const nodemailer = require("nodemailer");
const obtenerCoordenadas = require("../utils/obtenerCoordenadas");
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();
const googleKey = process.env.GOOGLE_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "facundolizardotrabajosia@gmail.com",
    pass: googleKey,
  },
});

router.post("/", async (req, res) => {
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
        Precio: ${producto.precio.total}
        Condicion: ${producto.precio.condicion}
        Cuotas: ${producto.precio.cuotas}
        Monto de la cuota: ${producto.precio.monto}
        precio id: ${producto.precio.id}
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
    if (
      error === "No se encontraron resultados para la dirección proporcionada."
    ) {
      res.status(500).json({ message: error });
    }
    res.status(500).json({ message: "Error al enviar el correo", error });
  }
});

module.exports = router;
