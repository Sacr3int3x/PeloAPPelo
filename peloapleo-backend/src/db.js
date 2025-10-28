// Configuración de conexión a MongoDB con Mongoose
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/peloapelo";

function connectDB() {
  return mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

module.exports = { connectDB, mongoose };
