
const { response } = require('express');
const empService = require('../Services/empService')

exports.upsert = (req, res) => {
    //#swagger.tags = ['Employee controller']
    const { id, empId, empName, dateOfJoin } = req.body;
    if (!empId || !empName || !dateOfJoin) {
        return res.status(201).json({
            message: "All fields are required!..."
        })
    }
    empService
        .upsert(req.body)
        .then((response) => {
            return res.status(200).json(response)
        })
        .catch((error) => {
            res.status(500).json({
                message: error.message || "Internal server error",
            });
        })
}

exports.getAll = (req, res) => {
    //#swagger.tags = ['Employee controller']
    empService
        .getAll()
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
};

exports.getById = (req, res) => {
    //#swagger.tags = ['Employee controller']
    const { empId } = req.params;
    if (!empId) {
        return res.status(201).json({
            message: "ID is required!..."
        });
    }
    empService
        .getById(empId)
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
};

exports.getAttendance = (req, res) => {
    //#swagger.tags = ['Employee controller']
    const { month } = req.query;
    if (!month) {
        return res.status(201).json({
            message: "month is required!..."
        })
    }
    empService
        .getAttendance(month)
        .then((response) => {
            res.status(200).json(response)
        })
        .catch((error) => {
            const status = error.statusCode || 500
            return res.status(status).json({
                success: false,
                message: error.message || "something went wrong"
            })
        })

}

exports.delete = (req, res) => {
    //#swagger.tags = ['Employee controller']
    const { id } = req.params;
    if (!id) {
        return res.status(201).json({
            message: "ID is required!..."
        });
    }
    empService
        .delete(id)
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message || "Internal server error",
            });
        });
};