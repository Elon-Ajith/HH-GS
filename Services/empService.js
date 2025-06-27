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
            employees.sort((a, b) => a.empName.localeCompare(b.empName));
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
            const employeeData = employee.toObject();
            employeeData.time = time;

            resolve({
                message: "Employee data fetched successfully!...",
                data: employeeData
            });
        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    });
};

exports.getAttendance1 = (month) => {
    return new Promise(async (resolve, reject) => {
        try {
            const start = new Date(`${month}-01T00:00:00.000Z`);
            const end = new Date(`${month}-01T00:00:00.000Z`);
            end.setMonth(end.getMonth() + 1);
            const query = {
                checkInTime: {
                    $gte: start,
                    $lt: end
                }
            }
            const getData = await attendanceDao.findworkingHours(query);
            // Step 2: Get all employee IDs
            const allEmployees = await empDao.getAll(); // Replace with your actual employee DAO
            const allEmpIds = allEmployees.map(emp => emp.empId);

            // Step 3: Group attendance by empId and date
            const presentMap = {};
            getData.forEach(record => {
                const empId = record.empId;
                const date = new Date(record.checkInTime).toISOString().split('T')[0];
                if (!presentMap[date]) presentMap[date] = new Set();
                presentMap[date].add(empId);
            });

            // Step 4: Generate all days in the month
            const allDates = [];
            let d = new Date(start);
            while (d < end) {
                allDates.push(d.toISOString().split('T')[0]);
                d.setDate(d.getDate() + 1);
            }

            // Step 5: Build absence list
            const absenceMap = {};
            for (const date of allDates) {
                const presentEmpSet = presentMap[date] || new Set();
                const absentList = allEmpIds.filter(id => !presentEmpSet.has(id));
                absenceMap[date] = absentList;
            }

            return resolve({
                message: "data fetch suceessfully!....",
                absenceData: absenceMap
            })
        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    })
}

exports.getAttendance = (month) => {
    return new Promise(async (resolve, reject) => {
        try {
             const validateStartDate = /^\d{4}\-\d{2}$/.test(month);
            if (!validateStartDate ) {
                return reject({
                    success: false,
                    statusCode: 201,
                    message: "Invalid month format",
                })
            }
            const start = new Date(`${month}-01T00:00:00.000Z`);
            const end = new Date(`${month}-01T00:00:00.000Z`);
            end.setMonth(end.getMonth() + 1);

            const query = {
                checkInTime: {
                    $gte: start,
                    $lt: end
                }
            };

            const getData = await attendanceDao.findworkingHours(query);

            // Get all employees
            const allEmployees = await empDao.getAll(); // { empId, empName }
            const empMap = {};
            const allEmpIds = allEmployees.map(emp => {
                empMap[emp.empId] = emp.empName || 'Unknown';
                return emp.empId;
            });

            // Group attendance by empId and date
            const presentMap = {};
            getData.forEach(record => {
                const empId = record.empId;
                const date = new Date(record.checkInTime).toISOString().split('T')[0];
                if (!presentMap[date]) presentMap[date] = new Set();
                presentMap[date].add(empId);
            });

            // Build leaveData without weekends
            const leaveData = [];
            let d = new Date(start);
            while (d < end) {
                const isoDate = d.toISOString().split('T')[0];
                const day = d.getDay(); // 0 = Sunday, 6 = Saturday
                if (day !== 0 && day !== 6) {
                    const presentSet = presentMap[isoDate] || new Set();
                    const absentEmpIds = allEmpIds.filter(id => !presentSet.has(id));
                    absentEmpIds.forEach(empId => {
                        leaveData.push({
                            date: isoDate,
                            employeeName: empMap[empId],
                            leaveType: 'Absent'
                        });
                    });
                }
                d.setDate(d.getDate() + 1);
            }
            return resolve({
                message: "Leave data fetched successfully (excluding weekends)",
                leaveData
            });

        } catch (error) {console.log("object",error)
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

