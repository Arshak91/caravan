const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const rolesSchema = new Schema({
    name: {
        type: String
    }
},{ timestamps: true });
const roles = mongoDB.model("roles", rolesSchema);
module.exports = roles;