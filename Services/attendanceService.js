const attendance = require('../Model/attendance');
const empModel = require('../Model/emp');
const attendanceDao = require('../Dao/attendanceDao')

exports.checkIn = (empId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const attendances = new attendance({
                empId,
                checkInTime: new Date()
            });

            await attendances.save();
            await empModel.findOneAndUpdate(
                { empId },              // Find by empId
                { checkIn: true },      // Update the checkIn field to true
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

exports.checkOut = (empId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const attendances = await attendance.findOne({
                empId,
                checkOutTime: { $exists: false }
            }).sort({ checkInTime: -1 });

            if (!attendances) {
                return reject({
                    message: 'No active check-in found!...'
                })
            }
            attendances.checkOutTime = new Date();
            const getEmp = await attendanceDao.findByEmpId(empId);
            const checkInTime = getEmp.checkInTime;
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




