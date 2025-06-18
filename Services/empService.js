const empDao = require('../Dao/empDao')
const attendanceDao = require('../Dao/attendanceDao')

exports.upsert = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { id, empId, empName, dateOfJoin } = data;

            if (id) {
                const updateData = {
                    empId, empName, dateOfJoin
                }
                const update = await empDao.update(id, updateData);
                return resolve({
                    message: "Employee data update successfully!...",
                    data: update
                })

            } else {
                const create = {
                    empId, empName, dateOfJoin
                }
                const register = await empDao.create(create);
                return resolve({
                    message: "Employee data register successfully!...",
                    data: register
                })
            }

        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message,
            });
        }
    })
}

exports.getAll = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const employees = await empDao.getAll();
            resolve({
                message: "Employee data fetched successfully!...",
                data: employees
            });
        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    });
};

exports.getById = (empId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const employee = await empDao.checkEmpId(empId);

            if (!employee) {
                return resolve({
                    message: "No data found for the given Id!..."
                });
            }

            let time = null;

            if (employee.checkIn) {
                const { checkInTime } = await attendanceDao.getCheckInTime(empId);
                if (checkInTime) {
                    const istTime = new Date(checkInTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata' // ✅ Convert UTC to IST
                    });
                    time = istTime.toLowerCase(); // Example: "10:00 am"
                }
            }

            resolve({
                message: "Employee data fetched successfully!...",
                data: {
                    employee,
                    time
                }
            });


        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    });
};

exports.delete = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deletedEmployee = await empDao.delete(id);
            if (!deletedEmployee) {
                return resolve({
                    message: "No data found for the given Id!..."
                });
            }
            resolve({
                message: "Employee data deleted successfully!..."
            });
        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    });
};