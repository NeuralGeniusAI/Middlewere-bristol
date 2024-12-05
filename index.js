const express = require("express");
const buscarProductosRoute = require("./routes/buscarProductos");
const enviarEmailRoute = require("./routes/enviarEmail");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/buscarProductos", buscarProductosRoute);
app.use("/enviarEmail", enviarEmailRoute);

app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
