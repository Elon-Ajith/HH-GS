const mongoose = require('mongoose');

const empSchema = new mongoose.Schema({
    empId: {
        type: String,
        unique: true 
    },
    empName: {
        type: String
    },
    dateOfJoin: {
        type: String,
    },
    checkIn:{
         type: Boolean,
         default: false
    }    
})
module.exports = mongoose.model("Employee", empSchema);