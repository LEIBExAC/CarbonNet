const mongoose = require("mongoose")
const {MONGO_URL} = require("../utility/keys")

mongoose.connect(MONGO_URL)
mongoose.connection.on("connected", () => {
    console.log("Cloud Database MongoDb Connected to Server......")
})
mongoose.connection.on("error", () => {
    console.log("Connection with Database failed ......")
})

module.exports = mongoose;