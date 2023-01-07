const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const HandlingTypeSchema = new Schema({
    name: { type: String },
    Type: { type: String },
    weight: { type: Number },

    width: { type: Number },
    height: { type: Number },
    length: { type: Number },

    depth: { type: Number},
    density: { type: Number},

    disabled: { type: Number },
    description: { type: String }
},{ timestamps: true });
let HandlingTypes = mongoDB.model("handlingtypes", HandlingTypeSchema);
module.exports = HandlingTypes;
