const attendance = require('../Model/attendance');
const empModel = require('../Model/emp');
const attendanceDao = require('../Dao/attendanceDao')
const empDao = require('../Dao/empDao')

exports.checkIn = (empId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let time;
            const attendances = new attendance({
                empId,
                checkInTime: new Date()
            });

            await attendances.save();
            const checkInTime = attendances.checkInTime
            const istTime = new Date(checkInTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata' // ✅ Convert UTC to IST
            });
            time = istTime.toLowerCase(); // Example: "10:00 am"
            await empModel.findOneAndUpdate(
                { empId },              // Find by empId
                { checkIn: true },      // Update the checkIn field to true
                { new: true }           // Return the updated document (optional)
            );
            const result = {
                attendances,
                time
            }
            resolve({
                message: "Employee CheckIn successfully!...",
                data: result
            });
        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    })
}

exports.checkOut = (empId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const attendances = await attendance.findOne({
                empId,
                checkOutTime: { $exists: false }
            }).sort({ checkInTime: -1 });
            console.log("attendances", attendances)
            if (!attendances) {
                return reject({
                    message: 'No active check-in found!...'
                })
            }
            attendances.checkOutTime = new Date();
            const checkInTime = attendances.checkInTime;
            const checkOutTime = attendances.checkOutTime;
            const durationMs = checkOutTime - checkInTime;
            const totalSeconds = Math.floor(durationMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const workingHours = `${hours}:${minutes}:${seconds}`;
            attendances.workingHours = workingHours
            await attendances.save();
            await empModel.findOneAndUpdate(
                { empId },              // Find by empId
                { checkIn: false },      // Update the checkIn field to true
                { new: true }           // Return the updated document (optional)
            );

            resolve({
                message: "Employee CheckIn successfully!...",
                data: attendances
            });
        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    })
}

exports.getAll = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { date, month } = data;
            // const employees = await attendanceDao.getAll();
            let filter = {};

            if (date) {
                const start = new Date(date);
                start.setUTCHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setUTCDate(end.getUTCDate() + 1);
                filter.checkInTime = { $gte: start, $lt: end };
            }

            if (month) {
                const [year, mon] = month.includes("-")
                    ? month.split("-")
                    : [new Date().getUTCFullYear(), month.padStart(2, '0')];

                const start = new Date(`${year}-${mon}-01T00:00:00.000Z`);
                const end = new Date(start);
                end.setUTCMonth(end.getUTCMonth() + 1);
                filter.checkInTime = { $gte: start, $lt: end };
            }
            // 2025-06-12T10:20:03.485Z
            if (!date && !month) {
                const date = new Date();
                const year = date.getFullYear();
                const mon = (date.getMonth() + 1).toString().padStart(2, '0');
                const start = new Date(`${year}-${mon}-01T00:00:00.000Z`);
                const end = new Date(start);
                end.setUTCMonth(end.getUTCMonth() + 1);
                filter.checkInTime = { $gte: start, $lt: end };
            }

            const records = await attendance.find(filter).sort({ checkInTime: -1 });
            resolve({
                message: "Employee CheckIn data fetched successfully!...",
                data: records
            });
        } catch (error) {
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    });
};

exports.getAllById = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("object", data)
            const { empId, date, month } = data;
            let filter = {};

            if (date) {
                const start = new Date(date);
                start.setUTCHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setUTCDate(end.getUTCDate() + 1);
                filter.checkInTime = { $gte: start, $lt: end };
                filter.empId = empId;
            }

            if (month) {
                const [year, mon] = month.includes("-")
                    ? month.split("-")
                    : [new Date().getUTCFullYear(), month.padStart(2, '0')];

                const start = new Date(`${year}-${mon}-01T00:00:00.000Z`);
                const end = new Date(start);
                end.setUTCMonth(end.getUTCMonth() + 1);
                filter.checkInTime = { $gte: start, $lt: end };
                filter.empId = empId;
            }
            // 2025-06-12T10:20:03.485Z
            if (!date && !month) {
                const date = new Date();
                const year = date.getFullYear();
                const mon = (date.getMonth() + 1).toString().padStart(2, '0');
                const start = new Date(`${year}-${mon}-01T00:00:00.000Z`);
                const end = new Date(start);
                end.setUTCMonth(end.getUTCMonth() + 1);
                filter.checkInTime = { $gte: start, $lt: end };
                filter.empId = empId;
            }
            const records = await attendance.find(filter).sort({ checkInTime: -1 });
            const WorkingHours = addWorkingHours(records);
            const data1 = {
                records,
                empId: empId,
                totalWorkingHours: WorkingHours
            }

            resolve({
                message: "Employee CheckIn data fetched successfully!...",
                data: data1
            });
        } catch (error) {
            console.log(error)
            reject({
                message: "An error occurred",
                error: error.message
            });
        }
    });
};

function addWorkingHours(records) {
    let totalSeconds = 0;

    for (const record of records) {
        const [h, m, s] = record.workingHours.split(':').map(Number);
        totalSeconds += h * 3600 + m * 60 + s;
    }

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    return `${totalHours}:${totalMinutes}:${totalSecs}`;
}

exports.getAllAttendance1 = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { startDate, endDate, type, month } = data;
            let WorkingHours = null;
            if (type === 'week') {
                const [sDay, sMonth, sYear] = startDate.split('/');
                const [eDay, eMonth, eYear] = endDate.split('/');

                const start = new Date(`${sYear}-${sMonth}-${sDay}T00:00:00Z`);
                const end = new Date(`${eYear}-${eMonth}-${eDay}T23:59:59Z`);

                const query = {
                    checkInTime: {
                        $gte: start,
                        $lte: end
                    }
                };
                const attendanceRecords = await attendanceDao.findworkingHours(query);
                const workingHoursData = calculateTotalWorkingHours(attendanceRecords);
                const empData = await empDao.getAll();
                const empMap = {};
                empData.forEach(emp => {
                    empMap[emp.empId] = emp.empName;
                });

                // 4. Merge data
                const enrichedData = Object.entries(workingHoursData).map(([empId, totalWorkingHours]) => ({
                    empId,
                    empName: empMap[empId] || "Unknown",
                    totalWorkingHours
                }));
                WorkingHours = enrichedData
            }
            if (type === "month") {
                const [yearStr, monthStr] = month.split('-');
                const year = parseInt(yearStr);
                const monthData = parseInt(monthStr) - 1;

                const start = new Date(Date.UTC(year, monthData, 1, 0, 0, 0));
                const end = new Date(Date.UTC(year, monthData + 1, 0, 23, 59, 59));
                const query = {
                    checkInTime: {
                        $gte: start,
                        $lte: end
                    }
                };
                const attendanceRecords = await attendanceDao.findworkingHours(query);
                const workingHoursData = calculateTotalWorkingHours(attendanceRecords);
                const empData = await empDao.getAll();
                const empMap = {};
                empData.forEach(emp => {
                    empMap[emp.empId] = emp.empName;
                });

                // 4. Merge data
                const enrichedData = Object.entries(workingHoursData).map(([empId, totalWorkingHours]) => ({
                    empId,
                    empName: empMap[empId] || "Unknown",
                    totalWorkingHours
                }));
                WorkingHours = enrichedData
                WorkingHours.sort((a, b) => a.empId.localeCompare(b.empId));

            }
            if (type === "day") {
                WorkingHours = "day"
            }
            resolve({
                message: "Total working hours fetch successfully!...",
                data: WorkingHours
            });

        } catch (error) {
            console.log(error)
            reject({
                message: "An error occurred",
                error: error.message
            });
        }

    })
}

exports.getAllAttendance = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { startDate, endDate, type, month } = data;
            // const validateStartDate = /^\d{2}\/\d{2}\/\d{4}$/.test(startDate)
            // const validateEndDate = /^\d{2}\/\d{2}\/\d{4}$/.test(endDate)
            // if (!validateStartDate && !validateEndDate) {
            //     return reject({
            //         success: false,
            //         statusCode: 201,
            //         message: "Invalid start date or end date",
            //     })
            // }

            let WorkingHours = null;

            const getEmployeeMap = async () => {
                const empData = await empDao.getAll();
                return empData.reduce((map, emp) => {
                    map[emp.empId] = emp.empName;
                    return map;
                }, {});
            };

            const enrichWithEmployeeNames = (workingHoursData, empMap) => {
                return Object.entries(workingHoursData).map(([empId, totalWorkingHours]) => ({
                    empId,
                    empName: empMap[empId] || "Unknown",
                    totalWorkingHours
                }));
            };

            let query = {};

            switch (type) {
                case 'week': {
                    const [sDay, sMonth, sYear] = startDate.split('/');
                    const [eDay, eMonth, eYear] = endDate.split('/');
                    const start = new Date(`${sYear}-${sMonth}-${sDay}T00:00:00Z`);
                    const end = new Date(`${eYear}-${eMonth}-${eDay}T23:59:59Z`);
                    query.checkInTime = { $gte: start, $lte: end };
                    break;
                }
                case 'month': {
                    const [yearStr, monthStr] = month.split('-');
                    const year = parseInt(yearStr);
                    const monthIndex = parseInt(monthStr) - 1;
                    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
                    const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59));
                    query.checkInTime = { $gte: start, $lte: end };
                    break;
                }
                case 'day': {
                    const [sDay, sMonth, sYear] = startDate.split('/');
                    const start = new Date(`${sYear}-${sMonth}-${sDay}T00:00:00Z`); console.log("object5454984231837454", start)
                    const end = new Date(`${sYear}-${sMonth}-${sDay}T23:59:59Z`); console.log("object5454984231837454", end)
                    query.checkInTime = { $gte: start, $lte: end };
                    break;
                }
                default:
                    throw new Error("Invalid type provided");
            }

            // Process for week/month
            if (type === 'week' || type === 'month' || type === 'day') {
                const attendanceRecords = await attendanceDao.findworkingHours(query);
                const workingHoursData = calculateTotalWorkingHours(attendanceRecords);
                const empMap = await getEmployeeMap();
                WorkingHours = enrichWithEmployeeNames(workingHoursData, empMap);

                // Optional sorting
                WorkingHours.sort((a, b) => a.empName.localeCompare(b.empName));
                // Add serial numbers
                WorkingHours = WorkingHours.map((item, index) => ({
                    sNo: index + 1,
                    ...item
                }));
            }

            const isEmpty = Array.isArray(WorkingHours) && WorkingHours.length === 0;

            return resolve({
                success: true,
                message: isEmpty ? "No working hours found for the given criteria." : "Total working hours fetched successfully!...",
                data: WorkingHours
            });
        } catch (error) {
            console.error(error);
            return reject({
                success: false,
                message: "An error occurred",
                error: error.message
            });
        }
    })
};


function calculateTotalWorkingHours(data) {
    const result = {};

    data.forEach(entry => {
        const { empId, workingHours } = entry;
        if (!workingHours) return; // Skip entries with no checkout time

        const [h, m, s] = workingHours.split(':').map(Number);
        const totalSeconds = h * 3600 + m * 60 + s;

        if (!result[empId]) {
            result[empId] = 0;
        }

        result[empId] += totalSeconds;
    });

    // Convert total seconds back to HH:mm:ss format
    for (let empId in result) {
        const totalSeconds = result[empId];
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        result[empId] = `${hours}:${minutes}:${seconds}`;
    }

    return result;
}

