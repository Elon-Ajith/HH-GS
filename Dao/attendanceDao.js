const attendanceModel = require('../Model/attendance')

// FIND ALL
exports.getAll = async () => {
    return await attendanceModel.find();
};

exports.findByEmpId = async (empId) => {
    return await attendanceModel.findOne({empId});
};

exports.findAll = async(empId) =>{
    return await attendanceModel.find({empId:empId})
}

exports.getCheckInTime =async (empId) =>{
    return await attendanceModel.findOne({empId})
         .sort({ checkInTime: -1 }) // Sort by checkInTime in descending order
        .exec();
}