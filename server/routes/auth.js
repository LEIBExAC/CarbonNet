const express = require("express");
const USER = require("../models/user");
const bcrypt = require('bcrypt');
const {JWT_SECRET} = require("../utility/keys")
const generateTokenAndSetCookie = require("../utility/generateTokenAndSetCookie")
const {sendVerificationConfrmEmail, sendPasswordResetEmail, sendVerificationEmail} = require("../config/emailsender")
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {


        console.log("Signup Route Hitted ..")
        const { name, email, password, role } = req.body;
        // console.log("name : " + name + "  email : " + email +  "  password : " + password );
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please Enter All Fields" });
        }

        const existingUser = await USER.findOne({ email });
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ message: "User already exists with this email" });
            }
            else {
                const newVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
                existingUser.verificationToken = newVerificationToken;
                existingUser.name = name;
                existingUser.password = await bcrypt.hash(password, 10);
                existingUser.verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000; // 5 min

                await existingUser.save(); // Important!

                sendVerificationEmail(email, newVerificationToken);
                generateTokenAndSetCookie(res, existingUser._id);
                return res.status(200).json({ message: "Verification email is resent" });

            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();


        const user = new USER({
            name,
            email,
            password: hashedPassword,
            role,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 5 * 60 * 1000 //5 min

        });

        savedUser = await user.save();
        sendVerificationEmail(email, verificationToken)
        generateTokenAndSetCookie(res, savedUser._id);

        res.status(201).json({ message: 'Signup successful', savedUser });
    }
    catch (error) {
        console.log("signup error : " + error)
        return res.status(500).json({ message: "Server Error" })
    }

})




router.post("/verify-otp", async (req, res) => {
    try {
        console.log("Verification Route Hitted..");

        const token = req.cookies.token;
        // console.log("Cookies: ", req.cookies); // Debug line

        if (!token) {
            return res.status(401).json({ message: "Unauthorized. No token provided." });
        }

        const decoded = jwt.verify(token,JWT_SECRET);
        const userId = decoded.userId;

        const user = await USER.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: "OTP is required." });
        }

        // Check if token matches and is still valid
        if (
            user.verificationToken !== otp ||
            !user.verificationTokenExpiresAt ||
            user.verificationTokenExpiresAt < Date.now()
        ) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();
        sendVerificationConfrmEmail(user.email,user)
        res.status(200).json({ message: "Account verified successfully." });

    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Server error." });
    }
});


router.post("/signin" ,async(req,res)=>{
    try{
        console.log("Signin Route Hitted...")
        const {email,password} = req.body;

         if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await USER.findOne({ email });

        if(!user){
            return res.status(404).json({ message: "User does not exist" });

        }
        const isMatch = await bcrypt.compare(password, user.password);

         if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        generateTokenAndSetCookie(res, user._id);
        res.status(200).json({ message: "Signin successful", user });

    }
    catch(error){
         console.error("Signin error:", error);
        res.status(500).json({ message: "Server error" });
    }
})

router.post("/request-reset-otp" , async(req,res)=>{
    const { email } = req.body;
    const user = await USER.findOne({email});
    if(!user){
        return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    user.resetPasswordToken = otp;
    user.resetPasswordExpiresAt = Date.now()+10*60*1000; //10min
    sendPasswordResetEmail(user,otp,email)
    await user.save();

    res.status(200).json({ message: "OTP sent to email." });

})

router.post("/verify-reset-otp", async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const user = await USER.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });



    if (
        user.resetPasswordToken !== otp ||
        !user.resetPasswordExpiresAt ||
        user.resetPasswordExpiresAt < Date.now()
    ) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
});


router.post("/change-password", verifyToken, async (req, res) => {
    console.log("Change Password route hitted..");

    try {
        const { password, newPassword } = req.body;

        if (!password || !newPassword) {
            return res.status(400).json({ message: "Both old and new passwords are required." });
        }

        const userId = req.userId; // should be set by verifyToken middleware
        const user = await USER.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Old password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;