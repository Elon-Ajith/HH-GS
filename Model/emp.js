const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const empSchema = new mongoose.Schema({
    empId: {
        type: String
    },
    empName: {
        type: String
    },
    dateOfJoin: {
        type: String,
    }
})
module.exports = mongoose.model("Employee", empSchema);