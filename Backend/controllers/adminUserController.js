
const UserModel = require("../models/userModel");

const listAdminUsers = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = {};

    // Admin user-management page lists students and mentors only.
    const allowedRoles = ["STUDENT", "MENTOR"];

    if (req.query.role) {
      if (!allowedRoles.includes(req.query.role)) {
        return res.status(400).json({
          success: false,
          message: "Role must be STUDENT or MENTOR.",
        });
      }

      filter.role = req.query.role;
    } else {
      filter.role = { $in: allowedRoles };
    }

    if (req.query.status) {
      if (!["ACTIVE", "INACTIVE"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be ACTIVE or INACTIVE.",
        });
      }

      filter.isActive = req.query.status === "ACTIVE";
    }

    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100);

      if (search) {
        const escapedSearch = search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        filter.$or = [
          { name: { $regex: escapedSearch, $options: "i" } },
          { email: { $regex: escapedSearch, $options: "i" } },
        ];
      }
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select("name email role isActive createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      UserModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load users.",
    });
  }
};

module.exports = {
  listAdminUsers,
};
