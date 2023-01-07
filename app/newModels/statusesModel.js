const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const statusSchema = new Schema({
    type: { type: String, enum: [ 'Load', 'Order', 'Both' ] },
    statustype: { type: String, enum: [ '*', '**' ] },
    name: {
        type: String,
        default: null
    },
    color: {
        type: String,
        default: null
    }
},{ timestamps: true });
const statuses = mongoDB.model("statuses", statusSchema);
module.exports = statuses;