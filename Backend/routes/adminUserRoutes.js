
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const { listAdminUsers } = require("../controllers/adminUserController");

const router = express.Router();

// Only authenticated admins can access user management.
router.use(protect, authorize("ADMIN"));

router.get("/users", listAdminUsers);

module.exports = router;
