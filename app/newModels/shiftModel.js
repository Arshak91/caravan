const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const shiftsSchema = new Schema({
    shiftName: {
        type: String,
        default: null
    },
    shift: {
        type: Number,
        default: null
    },
    break_time: {
        type: Number,
        default: null
    },
    drivingtime: {
        type: Number,
        default: null
    },
    max_shift: {
        type: Number,
        default: null
    },
    rest: {
        type: Number,
        default: null
    },
    recharge: {
        type: Number,
        default: null
    },
    status: {
        type: Number,
        default: null
    }
},{ timestamps: true });
const shifts = mongoDB.model("shifts", shiftsSchema);
module.exports = shifts;