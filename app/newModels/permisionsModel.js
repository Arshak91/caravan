const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const permisionSchema = new Schema({
    url: {
        type: String
    },
    number: {
        type: Number,
    },
    method: {
        type: String
    }
},{ timestamps: true });
let permisions = mongoDB.model("permisions", permisionSchema);
module.exports = permisions;