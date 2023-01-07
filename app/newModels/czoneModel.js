const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const czonesSchema = new Schema({
    name: {
        type: String,
        default: null
    },
    color: {
        type: String,
        default: null
    }
},{ timestamps: true });
const czones = mongoDB.model("czones", czonesSchema);
module.exports = czones;