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
    if (!apiKey || api_key !== apiKey) {
      return res.status(401).json({ message: "Api key no proporcionada o incorrecta" });
    }

    if (!nombre || !documento || !tipoDeDocumento || !productos || !entrega) {
      return res.status(400).json({
        message: "Campos obligatorios faltantes",
      });
    }

    if (entrega === "1" && (!codigoSucursal || !nombreSucursal)) {
      return res.status(400).json({
        message: "Campos obligatorios para entrega en sucursal faltantes",
      });
    }

    let arrayProductos;
    try {
      arrayProductos = JSON.parse(productos.replace(/\\\\/g, "\\"));
    } catch (error) {
      return res.status(400).json({
        message: "Productos no tienen un formato válido",
      });
    }

    let coordenadas = null;
    if (entrega === "2") {
      coordenadas = await obtenerCoordenadas(direccion, "Paraguay");
    }

    const mailOptions = {
      from: "facundolizardotrabajosia@gmail.com",
      to: "facundolizardo75@gmail.com",
      subject: "Correo de test del agente de ventas",
      text: JSON.stringify(arrayProductos, null, 2),
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado con éxito" });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: "Error al enviar el correo", error });
  }
});

module.exports = router;
