const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const accessorialSchema = new Schema({
    Type: {
        type: String,
        default: null
    },
    ServiceOption: {
        type: String,
        default: null
    },
},{ timestamps: true });
let accessorials = mongoDB.model("accessorials", accessorialSchema);
module.exports = accessorials;
