const attendance = require('../Model/attendance');
const empModel = require('../Model/emp');
const attendanceDao = require('../Dao/attendanceDao')

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
                data:result
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



