const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;
const uploadsSchema = new Schema({
    status: {
        type: Number,
        default: null
    },
    failed: {
        type: Array,
        default: null
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    UUID: {
        type: String,
        default: null
    },
    FileName: {
        type: String,
        default: null
    },
    orderCount: {
        type: Number,
        default: null
    }
},{ timestamps: true });
let uploads = mongoDB.model("uploads", uploadsSchema);
module.exports = uploads;
