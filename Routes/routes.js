const express = require('express');
const api = express.Router();

const empRoute = require('./empRoutes')

api.use('/api', empRoute);

module.exports = api;