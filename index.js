const express = require("express");
const app = express();
const uri = require('./MongoDb/mongo');
const mongoose = require('mongoose');
const route = require('./Routes/routes')
const cors = require('cors')
const cron = require('node-cron')
const axios = require('axios')

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerDocument = require("./swagger-output.json");
const swaggerUi = require("swagger-ui-express");

// Swagger route
app.use("/apis", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use("/api", route);

mongoose
    .connect(uri.mongoURI)
    .then(() => {
        console.log("MongoDB connected!");
    })
    .catch((error) => {
        console.log(`Error connecting to MongoDB: ${error.message}`);
    })

// Function to hit the API
function hitApi() {
    axios
        .get("https://hh-gs.onrender.com/")
        .then((response) => {
            console.log("Render API Hit:", response.data);
        })
        .catch((error) => {
            console.error("Error hitting the API:", error);
        });
}

// Schedule to run every 5 minutes
cron.schedule("*/5 * * * *", hitApi);

// Default route
app.get("/", (req, res) => {
    res.send("Welcome to HH-GS!");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server connected on port${PORT}`)
})