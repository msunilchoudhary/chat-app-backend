import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated. Token missing.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    req.user = user; // attach user to request
    next();
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default isAuthenticated;
