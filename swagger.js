const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "Hike Healthgs private Limited",
        description: "Version 2.0"
    },
     host: "https://hh-gs.onrender.com",
    // host: "localhost:8000",
    basePath: "/",
    schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const routes = ["./index.js"];

swaggerAutogen(outputFile, routes, doc);

