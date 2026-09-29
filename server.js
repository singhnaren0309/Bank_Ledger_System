const app = require("./src/app");
require("dotenv").config();
const connectDB = require("./src/config/db");


const PORT = process.env.PORT || 3000;
connectDB();
app.listen(PORT, () => {
    console.log(`Server started on port http://localhost:${PORT}`)
})