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
    },
    checkIn:{
         type: Boolean,
    }    
})
module.exports = mongoose.model("Employee", empSchema);