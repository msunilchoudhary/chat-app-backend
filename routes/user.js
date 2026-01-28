import express from "express";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      message: "All Users",
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    
    const user = await User.findById(req.params.id).select("-password");

    res.status(200).json({
      message: "User found successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, phone, thumb } = req.body;
    const existingUser =
      (await User.findOne({ email })) || (await User.findOne({ phone }));

    if (existingUser) {
      res.status(400).json({
        message: "Already exist",
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      phone,
      thumb,
      password: hashPassword,
    });

    const savedUser = user.save();

    res.status(200).json({
      message: "Register successfully",
      data: await savedUser,
      id: (await savedUser)._id,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Internal server error",
      success: true,
    });
  }
});

router.post("/login", async (req, res)=>{
    try {
        const {email, password} = req.body;        

        const user = await User.findOne({email}).select("+password");
        const comparePassword = await bcrypt.compare(password, user.password)
        if(!user || !comparePassword){
            return res.status(400).json({message:"Invalid credentials"})
        }

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:"7d"})
        res.cookie("token", token, {
            httpOnly:true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        
        // 6️⃣ Remove password before sending user
         user.password = undefined;

        res.status(201).json({
            message:"Loggedin successfully.",
            userId:user._id,
            token:token,
        })
        
    } catch (error) {
        console.log(error.message);
    res.status(500).json({
      message: "Internal server error",
      success: true,
    });
    }
});

router.post("/logout", isAuthenticated, async (req, res) => {
    try {
        res.clearCookie("token",{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            sameSite:"strict"
        })

        res.status(200).json({
            message:"logged out successfully"
        })
        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: "Logout failed",
        })
    }
})

router.put("/update/:id", isAuthenticated, async (req, res) => {
    try {
        const {fullname, email, phone, thumb} = req.body;

             
        if(req.body.password){
            return res.status(400).json({
                message:"Password update not allowed."
            })
        }

        const updateUser = await User.findByIdAndUpdate(req.params.id, {
            fullname,
            email,
            phone,
            thumb
        },{
            new:true,
            runValidators:true
        }).select("+password")

        if(!updateUser){
            return res.status(404).json({
                message:"User not found"
            })
        }

        res.status(200).json({
            success:true,
            message:"User updated successfully",
            user:updateUser
        })
        
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            message:"Internal server error",
            success:false
        })
    }
})

router.delete("/delete/:id", isAuthenticated, async (req, res) => {
    try {
        const removedUser = await User.findByIdAndDelete(req.params.id);
        if(!removedUser){
            return res.status(404).json({
                success:false,
                message:"User not found."
            })
        }
        res.status(200).json({
            message:"User deteted successfully",
            success:true,
            deletedUser:removedUser
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            message:"Internal server error"
        })
    }
})

export default router;
