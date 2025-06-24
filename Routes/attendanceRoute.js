const express = require('express');
const routes = express.Router();

const attendanceRoute = require('../Controller/attendanceContro')

routes.post('/checkIn', attendanceRoute.checkIn);
routes.post('/checkOut', attendanceRoute.checkOut)
routes.get('/getAll', attendanceRoute.getAll)
routes.get("/getAllById", attendanceRoute.getAllById)
routes.get("/getAllAttendance", attendanceRoute.getAllAttendance)


module.exports = routes;