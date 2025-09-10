const JWT_SECRET = require("./keys")
const jwt= require("jsonwebtoken");


const generateTokenAndSetCookie =(res,userId)=>{
    const token = jwt.sign({userId}, JWT_SECRET ,{ expiresIn:"7d"});
    res.cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,  // Cookie expires in 7 days
        httpOnly: false,  // Ensure the cookie is only accessible via HTTP requests, not client-side JS
        secure: false,  // Set to false for development over HTTP
        sameSite: 'None',  // Helps with cross-origin requests while keeping some protection
    });

    return token; // Return the token for further use
}

module.exports = generateTokenAndSetCookie 