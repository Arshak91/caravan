const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const notificationsSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    seen: {
        type: Number,
        default: null
    },
    type: {
        type: Number,
        default: null
    },
    title: {
        type: String,
        default: null
    },
    content: {
        type: String,
        default: null
    },
    seenAt: {
        type: Date,
        default: null
    },
},{ timestamps: true });
let notifications = mongoDB.model("notifications", notificationsSchema);
module.exports = notifications;