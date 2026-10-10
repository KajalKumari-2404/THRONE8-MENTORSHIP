
const mongoose = require("mongoose");
const BookingModel = require("../models/bookingModel");
const MentorAccountModel = require("../models/mentorAccountModel");
const UserModel = require("../models/userModel");

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
    // const pricePaise = 100000;
    const pricePaise = 100;
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

module.exports = { createBooking };







































// const mongoose = require("mongoose");
// const BookingModel = require("../models/bookingModel");
// const MentorAccountModel = require("../models/mentorAccountModel");

// const createBooking = async (req, res) => {
//   try {
//     const {
//       mentorId,
//       slotStart,
//       slotEnd
//     } = req.body;

//     // Validate required fields
//     if (!mentorId || !slotStart || !slotEnd) {
//       return res.status(400).json({
//         success: false,
//         message: "mentorId, slotStart and slotEnd are required"
//       });
//     }

//     if (!mongoose.isValidObjectId(mentorId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid mentor ID"
//       });
//     }

//     const start = new Date(slotStart);
//     const end = new Date(slotEnd);

//     if (
//       Number.isNaN(start.getTime()) ||
//       Number.isNaN(end.getTime()) ||
//       end <= start ||
//       start <= new Date()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid future time slot"
//       });
//     }

//     if (req.user.role !== "STUDENT") {
//       return res.status(403).json({
//         success: false,
//         message: "Only students can create bookings"
//       });
//     }

//     // Only verified mentors with payouts enabled can be booked.
//     // const mentorAccount = await MentorAccountModel.findOne({
//     //   mentorId,
//     //   verificationStatus: "VERIFIED",
//     //   payoutEnabled: true
//     // });

//     // if (!mentorAccount) {
//     //   return res.status(404).json({
//     //     success: false,
//     //     message: "Verified mentor is not available for booking"
//     //   });
//     // }

    
// console.log("Requested mentorId:", mentorId);

// const mentorAccount = await MentorAccountModel.findOne({
//   mentorId,
// });

// console.log(
//   "Found mentor account:",
//   mentorAccount
//     ? {
//         mentorId: mentorAccount.mentorId,
//         verificationStatus: mentorAccount.verificationStatus,
//         payoutEnabled: mentorAccount.payoutEnabled,
//       }
//     : null
// );

// if (
//   !mentorAccount ||
//   mentorAccount.verificationStatus !== "VERIFIED" ||
//   mentorAccount.payoutEnabled !== true
// ) {
//   return res.status(404).json({
//     success: false,
//     message: "Mentor account not found or not eligible for booking",
//     debug: mentorAccount
//       ? {
//           mentorId: mentorAccount.mentorId,
//           verificationStatus: mentorAccount.verificationStatus,
//           payoutEnabled: mentorAccount.payoutEnabled,
//         }
//       : null,
//   });
// }

//     // Temporary server-side price for initial development.
//     // Never accept the booking price from the client.
//     const pricePaise = 100000;
//     const commissionRateBps = mentorAccount.commissionRateBps;
//     const commissionPaise = Math.floor(
//       (pricePaise * commissionRateBps + 5000) / 10000
//     );
//     const mentorGrossPaise = pricePaise - commissionPaise;

//     const booking = await BookingModel.create({
//       studentId: req.user._id,
//       mentorId,
//       slotStart: start,
//       slotEnd: end,
//       pricePaise,
//       commissionRateBps,
//       commissionPaise,
//       mentorGrossPaise,
//       holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Booking created successfully",
//       booking
//     });
//   } catch (error) {
//     console.error("Create booking error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create booking"
//     });
//   }
// };

// module.exports = { createBooking };