
const ContactMessage = require("../models/contactModel");

const listAdminContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Admin contact messages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch contact messages.",
    });
  }
};

const updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["NEW", "READ", "RESOLVED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be NEW, READ, or RESOLVED.",
      });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message status updated.",
      data: message,
    });
  } catch (error) {
    console.error("Update contact message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update contact message.",
    });
  }
};

module.exports = {
  listAdminContactMessages,
  updateContactMessageStatus,
};