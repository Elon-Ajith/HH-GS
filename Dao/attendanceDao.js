const attendanceModel = require('../Model/attendance')

// FIND ALL
exports.getAll = async () => {
    return await attendanceModel.find();
};

exports.findByEmpId = async (empId) => {
    return await attendanceModel.findOne({empId});
};