const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const specialneedsSchema = new Schema({
    name: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: null
    }
},{ timestamps: true });
const specialneeds = mongoDB.model("specialneeds", specialneedsSchema);
module.exports = specialneeds;