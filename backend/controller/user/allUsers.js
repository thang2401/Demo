const userModel = require("../../models/userModel");

async function getAllUsers(req, res) {
  try {
    const users = await userModel.find().sort({ createdAt: -1 });
    res.json({
      message: "Lấy danh sách người dùng thành công",
      success: true,
      error: false,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách người dùng",
      success: false,
      error: true,
    });
  }
}

module.exports = getAllUsers;
