const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const locationTypeSchema = new Schema(
    {
        location_type: {
            type: String,
            default: null
        },
    },
    {   timestamps: true    }
);
let locationTypes = mongoDB.model("locationtypes", locationTypeSchema);
module.exports = locationTypes;
