const express = require("express")
const { MongoClient, ObjectId } = require("mongodb")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()  // <-- подключаем .env

const app = express()
app.use(express.json())

// ===== Конфигурация из .env =====
const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME
const SECRET_KEY = process.env.SECRET_KEY
const PORT = process.env.PORT || 3000

// ===== Подключение к базе =====
let users
async function connectDB() {
  try {
    const client = await MongoClient.connect(MONGO_URL)
    console.log("✅ MongoDB подключена")
    const db = client.db(DB_NAME)
    users = db.collection("users")

    // Подключаем маршруты
    const authRoutes = require("./service")(users, SECRET_KEY)
    app.use("/auth", authRoutes)
    app.use("/twoaction", authRoutes)

    // Запуск сервера
    app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`))
  } catch (err) {
    console.error("❌ Ошибка MongoDB:", err)
    process.exit(1)
  }
}

connectDB()