const express = require("express")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const mongoose = require("mongoose")
const userModel = require("../models/user.model")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const tokenBlackListModel = require("../models/blackList.model")
const emailService = require("../services/email.service")

const router = express.Router()


/* ──────────────────────────────────────────
   Middleware helpers (view-layer only)
   ────────────────────────────────────────── */

/**
 * viewAuth – protects pages that require login.
 * Redirects to /login instead of returning JSON.
 */
async function viewAuth(req, res, next) {
    const token = req.cookies.token
    if (!token) return res.redirect("/login")

    const isBlacklisted = await tokenBlackListModel.findOne({ token })
    if (isBlacklisted) {
        res.clearCookie("token")
        return res.redirect("/login")
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId)
        if (!user) return res.redirect("/login")
        req.user = user
        next()
    } catch (err) {
        res.clearCookie("token")
        return res.redirect("/login")
    }
}

/**
 * guestOnly – redirects logged-in users to dashboard.
 */
async function guestOnly(req, res, next) {
    const token = req.cookies.token
    if (!token) return next()

    try {
        const isBlacklisted = await tokenBlackListModel.findOne({ token })
        if (isBlacklisted) return next()

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId)
        if (user) return res.redirect("/dashboard")
        next()
    } catch (err) {
        next()
    }
}

/**
 * Optionally attach user to req if a valid token exists.
 * Does NOT redirect — used for public pages that show
 * different nav links based on auth state.
 */
async function optionalAuth(req, res, next) {
    req.user = null
    const token = req.cookies.token
    if (!token) return next()

    try {
        const isBlacklisted = await tokenBlackListModel.findOne({ token })
        if (isBlacklisted) return next()

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await userModel.findById(decoded.userId)
    } catch (err) { /* ignore */ }
    next()
}


/* ──────────────────────────────────────────
   Public Pages
   ────────────────────────────────────────── */

/** GET / — Landing page */
router.get("/", optionalAuth, (req, res) => {
    res.render("landing", { user: req.user, title: "Bankify — Modern Digital Banking" })
})


/** GET /login */
router.get("/login", guestOnly, (req, res) => {
    res.render("login", { user: null, error: null })
})


/** GET /register */
router.get("/register", guestOnly, (req, res) => {
    res.render("register", { user: null, error: null })
})


/* ──────────────────────────────────────────
   Auth Actions
   ────────────────────────────────────────── */

/** POST /login */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.render("login", { user: null, error: "Email and password are required." })
        }

        const user = await userModel.findOne({ email }).select("+password")
        if (!user) {
            return res.render("login", { user: null, error: "Invalid email or password." })
        }

        const isValid = await user.comparePassword(password)
        if (!isValid) {
            return res.render("login", { user: null, error: "Invalid email or password." })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })
        res.cookie("token", token)
        return res.redirect("/dashboard")
    } catch (err) {
        return res.render("login", { user: null, error: "Something went wrong. Please try again." })
    }
})


/** POST /register */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.render("register", { user: null, error: "All fields are required." })
        }

        const exists = await userModel.findOne({ email })
        if (exists) {
            return res.render("register", { user: null, error: "An account with this email already exists." })
        }

        const user = await userModel.create({ name, email, password })

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })
        res.cookie("token", token)

        // Fire-and-forget email
        emailService.sendRegistrationEmail(user.email, user.name).catch(() => {})

        return res.redirect("/dashboard")
    } catch (err) {
        const msg = err.message || "Registration failed. Please try again."
        return res.render("register", { user: null, error: msg })
    }
})


/** GET /logout */
router.get("/logout", async (req, res) => {
    const token = req.cookies.token
    if (token) {
        try { await tokenBlackListModel.create({ token }) } catch (e) { /* already blacklisted */ }
        res.clearCookie("token")
    }
    return res.redirect("/")
})


/* ──────────────────────────────────────────
   Protected Pages
   ────────────────────────────────────────── */

/** GET /dashboard */
router.get("/dashboard", viewAuth, async (req, res) => {
    try {
        const accounts = await accountModel.find({ user: req.user._id })
        const accountsWithBalance = await Promise.all(
            accounts.map(async (acc) => {
                const balance = await acc.getBalance()
                return { ...acc.toObject(), balance }
            })
        )

        res.render("dashboard", {
            user: req.user,
            accounts: accountsWithBalance,
            title: "Dashboard — Bankify"
        })
    } catch (err) {
        res.render("dashboard", {
            user: req.user,
            accounts: [],
            title: "Dashboard — Bankify"
        })
    }
})


/** POST /accounts/create */
router.post("/accounts/create", viewAuth, async (req, res) => {
    try {
        await accountModel.create({ user: req.user._id })
    } catch (err) { /* ignore */ }
    return res.redirect("/dashboard")
})


/** GET /transfer */
router.get("/transfer", viewAuth, async (req, res) => {
    const accounts = await accountModel.find({ user: req.user._id })
    const accountsWithBalance = await Promise.all(
        accounts.map(async (acc) => {
            const balance = await acc.getBalance()
            return { ...acc.toObject(), balance }
        })
    )

    res.render("transfer", {
        user: req.user,
        accounts: accountsWithBalance,
        error: null,
        success: null,
        title: "Transfer — Bankify"
    })
})


/** POST /transfer */
router.post("/transfer", viewAuth, async (req, res) => {
    // Helper to re-render the form with a message
    async function renderForm(error, success) {
        const accounts = await accountModel.find({ user: req.user._id })
        const accountsWithBalance = await Promise.all(
            accounts.map(async (acc) => {
                const balance = await acc.getBalance()
                return { ...acc.toObject(), balance }
            })
        )
        return res.render("transfer", {
            user: req.user,
            accounts: accountsWithBalance,
            error,
            success,
            title: "Transfer — Bankify"
        })
    }

    try {
        const { fromAccount, toAccount, amount } = req.body

        if (!fromAccount || !toAccount || !amount) {
            return renderForm("All fields are required.", null)
        }

        if (fromAccount === toAccount) {
            return renderForm("Cannot transfer to the same account.", null)
        }

        const numericAmount = Number(amount)
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return renderForm("Please enter a valid amount.", null)
        }

        // Generate idempotency key server-side
        const idempotencyKey = crypto.randomUUID()

        const fromUserAccount = await accountModel.findOne({ _id: fromAccount, user: req.user._id })
        const toUserAccount = await accountModel.findOne({ _id: toAccount })

        if (!fromUserAccount) {
            return renderForm("Source account not found or doesn't belong to you.", null)
        }
        if (!toUserAccount) {
            return renderForm("Recipient account not found.", null)
        }
        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return renderForm("Both accounts must be ACTIVE.", null)
        }

        const balance = await fromUserAccount.getBalance()
        if (balance < numericAmount) {
            return renderForm(`Insufficient balance. Your balance is ₹${balance.toFixed(2)}.`, null)
        }

        // Execute transaction with MongoDB session
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const transaction = (await transactionModel.create([{
                fromAccount,
                toAccount,
                amount: numericAmount,
                idempotencyKey,
                status: "PENDING"
            }], { session }))[0]

            await ledgerModel.create([{
                account: fromAccount,
                amount: numericAmount,
                transaction: transaction._id,
                type: "DEBIT"
            }], { session })

            await ledgerModel.create([{
                account: toAccount,
                amount: numericAmount,
                transaction: transaction._id,
                type: "CREDIT"
            }], { session })

            await transactionModel.findOneAndUpdate(
                { _id: transaction._id },
                { status: "COMPLETED" },
                { session }
            )

            await session.commitTransaction()
            session.endSession()

            // Fire-and-forget email notification
            emailService.sendTransactionEmail(req.user.email, req.user.name, numericAmount, toAccount).catch(() => {})

            return res.redirect("/dashboard")
        } catch (txErr) {
            await session.abortTransaction()
            session.endSession()
            return renderForm("Transaction failed. Please try again.", null)
        }
    } catch (err) {
        return renderForm("Something went wrong. Please try again.", null)
    }
})


module.exports = router
