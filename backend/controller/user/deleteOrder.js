const Order = require("../../models/Order");

const deleteOrder = async (req, res) => {
  const orderId = req.params.id;
  if (!orderId) {
    return res
      .status(400)
      .json({ success: false, message: "Order ID missing" });
  }
  const deleted = await Order.findByIdAndDelete(orderId);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  return res.json({ success: true, message: "Order deleted successfully" });
};
module.exports = deleteOrder;
