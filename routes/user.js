import express from "express";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import  isAuthenticated  from "../middlewares/authMiddleware.js";
import { createTokenAndSavedCookie } from "../token/generateToken.js";

const router = express.Router();

/* =======================
   GET ALL USERS
======================= */
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    if (!users.length) {
      return res.status(404).json({
        message: "No users found",
      });
    }

    res.status(200).json({
      message: "All users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

/* =======================
   GET USER BY ID
======================= */
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User found successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* =======================
   REGISTER USER
======================= */
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, phone, thumb } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullname,
      email,
      phone,
      thumb,
      password: hashPassword,
    });

    createTokenAndSavedCookie(newUser._id, res);

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: {
        id: newUser._id,
        name: newUser.fullname,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

/* =======================
   LOGIN USER
======================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    createTokenAndSavedCookie(user._id, res);

    user.password = undefined;

    res.status(200).json({
      message: "Logged in successfully",
      success: true,
      user: {
        id: user._id,
        name: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

/* =======================
   LOGOUT USER
======================= */
router.post("/logout", isAuthenticated, (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Logout failed" });
  }
});

/* =======================
   UPDATE USER
======================= */
router.put("/update/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.body.password) {
      return res.status(400).json({
        message: "Password update not allowed here",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

/* =======================
   DELETE USER
======================= */
router.delete("/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
