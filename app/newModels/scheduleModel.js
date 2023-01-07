const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const scheduleSchema = new Schema({
    monday: {
        type: Object,
        default: { "from": null }
    },
    tuesday: {
        type: Object,
        default: { "from": null }
    },
    wednesday: {
        type: Object,
        default: { "from": null }
    },
    thursday: {
        type: Object,
        default: { "from": null }
    },
    friday: {
        type: Object,
        default: { "from": null }
    },
    saturday: {
        type: Object,
        default: { "from": null }
    },
    sunday: {
        type: Object,
        default: { "from": null }
    }
},{ timestamps: true });
const schedules = mongoDB.model("schedules", scheduleSchema);
module.exports = schedules;