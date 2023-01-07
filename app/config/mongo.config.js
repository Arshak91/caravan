const env = process.env.SERVER == "local" ? require("./env.local.js") : require("./env.js");
const mongoose = require("mongoose");

mongoose.connect(`mongodb://${env.mongo.user}:${env.mongo.pass}@${env.mongo.host}:${env.mongo.port}/${env.mongo.database}?authSource=admin`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => console.log("MongoDb Connect"))
    .catch(err => console.log("Error: ", err.message));

module.exports = mongoose;