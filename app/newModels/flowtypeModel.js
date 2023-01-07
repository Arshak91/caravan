const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const flowtypeSchema = new Schema({
    index: { type: Number },
    name: { type: String },
    description: { type: String },
    modeltype: {type: String, enum: ['VRP', 'VRP-PDP', 'PDP'] },
    status: { type: Number }
},{ timestamps: true });
const flowtypes = mongoDB.model("flowtypes", flowtypeSchema);
module.exports = flowtypes;