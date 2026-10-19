const mongoose = require("mongoose");
const BookingModel = require("../models/bookingModel");
const MentorAccountModel = require("../models/mentorAccountModel");
const UserModel = require("../models/userModel");
const EarningModel = require("../models/earningModel");

const createBooking = async (req, res) => {
  try {
    const { mentorId, slotStart, slotEnd } = req.body;

    if (!mentorId || !slotStart || !slotEnd) {
      return res.status(400).json({
        success: false,
        message: "mentorId, slotStart and slotEnd are required",
      });
    }

    if (!mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
      });
    }

    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only students can create bookings",
      });
    }

    const start = new Date(slotStart);
    const end = new Date(slotEnd);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start <= new Date() ||
      end <= start
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid future time slot",
      });
    }

    // Confirm the mentor exists and has the correct role.
    const mentor = await UserModel.findOne({
      _id: mentorId,
      role: "MENTOR",
      isActive: true,
    }).select("_id");

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Active mentor not found",
      });
    }

    // Look up the mentor account.
    const mentorAccount = await MentorAccountModel.findOne({
      mentorId: mentor._id,
    });

    if (!mentorAccount) {
      console.log("MongoDB database:", mongoose.connection.name);
      console.log(
        "Mentor account collection:",
        MentorAccountModel.collection.name
      );
      console.log(
        "Mentor account count:",
        await MentorAccountModel.countDocuments()
      );

      return res.status(404).json({
        success: false,
        message: "Mentor account record not found",
      });
    }

    if (
      mentorAccount.verificationStatus !== "VERIFIED" ||
      mentorAccount.payoutEnabled !== true
    ) {
      return res.status(403).json({
        success: false,
        message: "Mentor is not approved for booking",
      });
    }

    // Temporary development price: ₹1,000.
    // The client cannot set the booking price.
    const pricePaise = 100000;
    // const pricePaise = 100;
    const commissionRateBps = mentorAccount.commissionRateBps;

    const commissionPaise = Math.floor(
      (pricePaise * commissionRateBps + 5000) / 10000
    );

    const mentorGrossPaise = pricePaise - commissionPaise;

    const booking = await BookingModel.create({
      studentId: req.user._id,
      mentorId: mentor._id,
      slotStart: start,
      slotEnd: end,
      pricePaise,
      commissionRateBps,
      commissionPaise,
      mentorGrossPaise,
      holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};



const getMyBookings = async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      studentId: req.user._id,
    })
      .populate("mentorId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get student bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};


const getMentorBookings = async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      mentorId: req.user._id,
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get mentor bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor bookings",
    });
  }
};



const requestSessionCompletion = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can request session completion",
      });
    }

    const booking = await BookingModel.findOne({
      _id: bookingId,
      mentorId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(409).json({
        success: false,
        message: "Only confirmed bookings can be completed",
      });
    }

    if (booking.slotEnd > new Date()) {
      return res.status(409).json({
        success: false,
        message: "The session cannot be completed before its scheduled end",
      });
    }

    if (booking.completionRequestedAt) {
      return res.status(409).json({
        success: false,
        message: "Completion has already been requested",
      });
    }

    booking.completionRequestedAt = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Session completion requested. Student confirmation is required.",
      booking,
    });
  } catch (error) {
    console.error("Request session completion error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to request session completion",
    });
  }
};



const confirmSessionCompletion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { bookingId } = req.params;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only the student can confirm session completion",
      });
    }

    let response;

    await session.withTransaction(async () => {
      const booking = await BookingModel.findOne({
        _id: bookingId,
        studentId: req.user._id,
      }).session(session);

      if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = 404;
        throw error;
      }

      if (
        booking.status !== "CONFIRMED" ||
        !booking.completionRequestedAt ||
        booking.completionDisputedAt
      ) {
        const error = new Error(
          "Booking is not eligible for completion confirmation"
        );
        error.statusCode = 409;
        throw error;
      }

      if (booking.studentConfirmedAt || booking.completedAt) {
        const error = new Error("Session is already completed");
        error.statusCode = 409;
        throw error;
      }

      const earning = await EarningModel.findOne({
        bookingId: booking._id,
      }).session(session);

      if (!earning || earning.state !== "PENDING_SESSION") {
        const error = new Error(
          "Pending earning record not found; manual review is required"
        );
        error.statusCode = 409;
        throw error;
      }

      const now = new Date();
    //   const eligibleAt = new Date(now);
    //  eligibleAt.setDate(eligibleAt.getDate() + 15);

    // const eligibleAt = new Date(now.getTime() +  * 60 * 1000); // 5 minute
    const eligibleAt = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute


      booking.studentConfirmedAt = now;
      booking.completedAt = now;
      booking.payoutEligibleAt = eligibleAt;
      booking.status = "COMPLETED";

      earning.state = "HOLDING";
      earning.eligibleAt = eligibleAt;
      earning.holdReason = null;

      await booking.save({ session });
      await earning.save({ session });

      response = {
        success: true,
        message:
          "Session confirmed. Earnings will become eligible after 1 minute, subject to refund and dispute checks.",
        booking,
        earning,
      };
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Confirm session completion error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to confirm session completion",
    });
  } finally {
    await session.endSession();
  }
};

const disputeSessionCompletion = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only the student can dispute session completion",
      });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A dispute reason is required",
      });
    }

    let response;

    await session.withTransaction(async () => {
      const booking = await BookingModel.findOne({
        _id: bookingId,
        studentId: req.user._id,
      }).session(session);

      if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = 404;
        throw error;
      }

      if (
        booking.status !== "CONFIRMED" ||
        !booking.completionRequestedAt ||
        booking.studentConfirmedAt ||
        booking.completionDisputedAt
      ) {
        const error = new Error(
          "This booking cannot be disputed through this endpoint"
        );
        error.statusCode = 409;
        throw error;
      }

      const earning = await EarningModel.findOne({
        bookingId: booking._id,
      }).session(session);

      if (!earning || earning.state !== "PENDING_SESSION") {
        const error = new Error(
          "Pending earning record not found; manual review is required"
        );
        error.statusCode = 409;
        throw error;
      }

      booking.status = "DISPUTED";
      booking.completionDisputedAt = new Date();

      earning.state = "ON_HOLD";
      earning.holdReason = reason.trim().slice(0, 1000);

      await booking.save({ session });
      await earning.save({ session });

      response = {
        success: true,
        message: "Dispute recorded. The earning is on hold for review.",
        booking,
        earning,
      };
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Dispute session completion error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to record session dispute",
    });
  } finally {
    await session.endSession();
  }
};



const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId is required",
      });
    }

    const booking = await BookingModel.findOne({
      _id: bookingId,
      studentId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(409).json({
        success: false,
        message:
          "Only bookings awaiting payment can be cancelled using this endpoint",
      });
    }

    booking.status = "CANCELLED";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Pending booking cancelled successfully",
      bookingId: booking._id,
      status: booking.status,
    });
  } catch (error) {
    console.error("Cancel booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
};

module.exports = { createBooking, getMyBookings, getMentorBookings, requestSessionCompletion, confirmSessionCompletion, disputeSessionCompletion, cancelBooking };

