const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required: true
    },
    email:{
        type : String,
        required: true,
    },
    password : {
        type : String,
        required : true,
    },
    lastLogin:{
        type:Date,
        default:Date.now
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    role:{
        type : String,
        default:"user",
        enum:["individual","group" , "admin" , "superAdmin"]
    },


    resetPasswordToken : String,
    resetPasswordExpiresAt: Date,
    verificationToken:String,
    verificationTokenExpiresAt:Date,
})

module.exports = mongoose.model("USER" , userSchema);