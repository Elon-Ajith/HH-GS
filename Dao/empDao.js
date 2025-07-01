const attendance = require('../Model/attendance');
const empModel = require('../Model/emp')

exports.create = async (data) => {
    const register = new empModel(data)
    return await register.save();
}

exports.findById = async (id) => {
    const data = await empModel.findById(id);
    return  data;
}

exports.checkEmpId = async (empId) => {
    const check = empModel.findOne({ empId })
    return await check;
}

exports.update = async (id, updateData) => {
    
    const register = empModel.findByIdAndUpdate(
         id ,
         updateData,
        { new: true }
    )
    return register;
}

// FIND ALL
exports.getAll = async () => {
    return await empModel.find();
};

// FIND BY ID
exports.getById = async (id) => {
    return await empModel.findById(id);
};

// DELETE
exports.delete = async (id) => {
    return await empModel.findByIdAndDelete(id);
};

exports.findEmp = async(query) =>{
    return await attendance.find(query);
}

