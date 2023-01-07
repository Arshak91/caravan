const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const freightClassesSchema = new Schema({
    freightclass: {
        type: Number,
        default: 0
    },
    maxpcf: {
        type: Number,
        default: 0
    },
    minpcf: {
        type: Number,
        default: 0
    }
},{ timestamps: true });
let freightClasses = mongoDB.model("freightclasses", freightClassesSchema);
module.exports = freightClasses;
