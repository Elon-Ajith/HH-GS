const empDao = require('../Dao/empDao')
const attendanceDao = require('../Dao/attendanceDao');
const { $where } = require('../Model/attendance');

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
};

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

exports.getAttendance = (month) => {
    return new Promise(async (resolve, reject) => {
        try {
            const validateStartDate = /^\d{4}\-\d{2}$/.test(month);
            if (!validateStartDate) {
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
                    const halfDayRecords = await calculateWorking(new Date(d));
                    const halfDayEmpIds = new Set(halfDayRecords.map(r => r.empId));
                    const absentEmpIds = allEmpIds.filter(id => !presentSet.has(id));

                    absentEmpIds.forEach(empId => {
                        leaveData.push({
                            date: isoDate,
                            employeeName: empMap[empId],
                            leaveType: 'Absent'
                        });
                    });
                    halfDayRecords.forEach(record => {
                        leaveData.push({
                            date: record.date,
                            employeeName: empMap[record.empId],
                            leaveType: "Halfday absent"
                        });
                    });
                }
                d.setDate(d.getDate() + 1);
            }
            return resolve({
                message: "Leave data fetched successfully (excluding weekends)",
                leaveData
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

async function calculateWorking(date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    end.setUTCHours(0, 0, 0, 0); // start of next day

    const query = {
        checkInTime: {
            $gte: start,
            $lt: end
        }
    };

    const empAttendance = await empDao.findEmp(query);

    const HALF_DAY_THRESHOLD_HOURS = 5; // threshold for half day

    const empWorkMap = {};

    // Group all time durations by empId
    empAttendance.forEach(record => {
        if (!record.empId || !record.checkInTime || !record.checkOutTime) return;

        const empId = record.empId;
        const durationHrs = convertToDecimalHours(record.workingHours);

        if (!empWorkMap[empId]) {
            empWorkMap[empId] = 0;
        }

        empWorkMap[empId] += durationHrs;
    });

    const halfDayList = [];

    for (const [empId, totalHours] of Object.entries(empWorkMap)) {
        if (totalHours > 0 && totalHours < HALF_DAY_THRESHOLD_HOURS) {
            halfDayList.push({
                empId,
                date: start.toISOString().split('T')[0],
                workedHours: totalHours.toFixed(2),
                leaveType: 'Half Day'
            });
        }
    }

    console.log("Half Day Records:", halfDayList);
    return halfDayList;
}

function convertToDecimalHours(timeStr) {
    const [hoursStr, minutesStr, secondsStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);

    return hours + (minutes / 60) + (seconds / 3600);
}