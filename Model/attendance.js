const mongoose = require('mongoose')

const attendanceSchema = new mongoose.Schema({
    empId: {
        type: String
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    checkOutTime: {
        type: Date
    },
     workingHours: {
        type: String
    }
})
module.exports = mongoose.model("Attendance", attendanceSchema);