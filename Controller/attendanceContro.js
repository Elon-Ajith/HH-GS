
const attendanceService = require('../Services/attendanceService')

exports.checkIn = (req, res) => {
    //#swagger.tags = ['Attendance controller']
    const { empId } = req.body;
    if (!empId) {
        return res.status(201).json({
            message: "Emp id is required!..."
        })
    }
    attendanceService
        .checkIn(empId)
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
}

exports.checkOut = (req, res) => {
    //#swagger.tags = ['Attendance controller']
    const { empId } = req.body;
    if (!empId) {
        return res.status(201).json({
            message: "Emp id is required!..."
        })
    }
    attendanceService
        .checkOut(empId)
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
}

exports.getAll = (req, res) => {
    //#swagger.tags = ['Attendance controller']
    const { date,  month } = req.query;
    attendanceService
        .getAll(req.query)
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
};

exports.getAllById = (req, res) => {
    //#swagger.tags = ['Attendance controller']
    const { empId, date, month } = req.query;
    attendanceService
        .getAllById(req.query)
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
};

exports.getAllAttendance = (req, res) => {
    //#swagger.tags = ['Attendance controller']
    const {startDate, endDate, type } = req.query;
    attendanceService
        .getAllAttendance(req.query)
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
};
