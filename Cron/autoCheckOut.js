const Attendance = require('../Model/attendance')
const empModel = require('../Model/emp')
exports.autoCheckoutUnmarkedStaff = async () => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);

    // Find all check-ins today with no checkout
    const recordsToUpdate = await Attendance.find({
      checkInTime: { $gte: todayStart, $lte: checkoutTime },
      checkOutTime: { $exists: false },
    });

    if (recordsToUpdate.length === 0) {
      console.log("No pending check-outs for today.");
      return;
    }

    // Update each record
    for (const record of recordsToUpdate) {
      record.checkOutTime = checkoutTime;
      record.workingHours = '04:30:00';
      await record.save();
      console.log(`Auto checkout for employee ${record.empId}`);
                await empModel.findOneAndUpdate(
                    { empId:record.empId },              // Find by empId
                    { checkIn: false },      // Update the checkIn field to true
                    { new: true }           // Return the updated document (optional)
                );
    }

  } catch (err) {
    console.error("Error in auto-checkout service:", err);
  }
};

