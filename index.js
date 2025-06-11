const express = require("express");
const app = express();
const uri = require('./MongoDb/mongo');
const mongoose = require('mongoose');
const route = require('./Routes/routes')

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
    .connect(uri.url)
    .then(() => {
        console.log("MongoDB connected!");
    })
    .catch((error) => {
        console.log(`Error connecting to MongoDB: ${err.message}`);
    })

// Default route
app.get("/", (req, res) => {
    res.send("Welcome to HH-GS!");
});

app.listen(8000, () => {
    console.log("Server connected on port 8000")
})