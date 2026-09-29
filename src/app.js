const express = require("express")
const cookieParser = require("cookie-parser")
const path = require("path")



const app = express()

/**
 * - View engine configuration
 */
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "../views"))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

/**
 * - Routes required
 */
const authRouter = require("../routes/auth.routes")
const accountRouter = require("../routes/account.routes")
const transactionRoutes = require("../routes/transaction.routes")
const viewRouter = require("../routes/view.routes")

/**
 * - Use Routes
 */

app.use("/", viewRouter)

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

module.exports = app