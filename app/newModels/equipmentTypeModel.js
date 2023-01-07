const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const equipmentTypeSchema = new Schema({
    name: {
        type: String,
        default: null
    }
},{ timestamps: true });
const equipmentTypes = mongoDB.model("equipmenttypes", equipmentTypeSchema);
module.exports = equipmentTypes;