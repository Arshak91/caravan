const mongoose = require("mongoose"), autoIncrement = require('mongoose-auto-increment-cn');;

const env = process.env.SERVER == "local" ? require("./env.local.js") : require("./env.js");
const mongo = env.mongoCommon;
const uri = `mongodb://${mongo.user}:${mongo.pass}@${mongo.host}:${mongo.port}/${mongo.database}?authSource=admin`;

mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => console.log("MongoDB connected"))
.catch(err => console.log("Error: ", err.message));

autoIncrement.initialize(mongoose);

module.exports = mongoose;