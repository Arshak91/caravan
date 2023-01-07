const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;
const transporttypesSchema = new Schema({
    index: {
        type: Number,
        default: null
    },
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
let transporttypes = mongoDB.model("transporttypes", transporttypesSchema);
module.exports = transporttypes;
