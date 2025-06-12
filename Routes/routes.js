const express = require('express');
const api = express.Router();

const empRoute = require('./empRoutes');
const attendanceRoute = require('./attendanceRoute')

api.use('/emp', empRoute);
api.use("/attendance", attendanceRoute)

module.exports = api;