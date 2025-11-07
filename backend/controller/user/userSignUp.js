const userModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");

async function userSignUpController(req, res) {
  try {
    const { email, password, name } = req.body;

    // Kiểm tra người dùng đã tồn tại
    const user = await userModel.findOne({ email });
    if (user) {
      throw new Error("Người dùng đã tồn tại");
    }

    // Kiểm tra dữ liệu đầu vào
    if (!email) throw new Error("Vui lòng cung cấp email");
    if (!password) throw new Error("Vui lòng cung cấp mật khẩu");
    if (!name) throw new Error("Vui lòng cung cấp tên");

    // 🔐 Kiểm tra mật khẩu mạnh
    if (password.length < 12)
      throw new Error("Mật khẩu phải dài ít nhất 12 ký tự");
    if (!/[A-Z]/.test(password))
      throw new Error("Mật khẩu phải có ít nhất 1 chữ hoa");
    if (!/[a-z]/.test(password))
      throw new Error("Mật khẩu phải có ít nhất 1 chữ thường");
    if (!/[0-9]/.test(password))
      throw new Error("Mật khẩu phải có ít nhất 1 số");
    if (!/[\W_]/.test(password))
      throw new Error("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");

    // Mã hóa mật khẩu
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    // Tạo payload lưu vào DB
    const payload = {
      name,
      email,
      role: "GENERAL",
      password: hashPassword,
    };

    const userData = new userModel(payload);
    const saveUser = await userData.save();

    res.status(201).json({
      data: saveUser,
      success: true,
      error: false,
      message: "Đăng kí thành công!",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = userSignUpController;
