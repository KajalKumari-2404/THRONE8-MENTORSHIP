
const express = require("express");
const { z } = require("zod");
const ContactMessage = require("../models/contactModel");

const router = express.Router();

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
});

router.post("/", async (req, res) => {
  try {
    const result = contactSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Please check your contact form details.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const contactMessage = await ContactMessage.create(result.data);

    return res.status(201).json({
      success: true,
      message: "Your message was submitted successfully.",
      data: {
        id: contactMessage._id,
        status: contactMessage.status,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Contact form error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your message right now.",
    });
  }
});

module.exports = router;
