const express = require('express');
const routes = express.Router();
const empContro = require('../Controller/empController')

routes.post('/register', empContro.upsert)
routes.get('/getAll', empContro.getAll)
routes.get('/getById/:empId', empContro.getById)
routes.get('/getAbsence',empContro.getAttendance)
routes.delete('/delete/:id', empContro.delete)


module.exports = routes;