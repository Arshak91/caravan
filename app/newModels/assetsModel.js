const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const assetsSchema = new Schema({
    ID: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    companyType: {
        type: String,
        enum: ['shipper', 'broker', 'carrier']
    },
    equipment: {
        type: Schema.Types.ObjectId,
		ref: "equipments",
    },
    platNumber: {
        type: String,
        default: null
    },
    attachment: {
        type: String,
        default: null
    },
    licenses: {
        type: String,
        default: null
    },
    VIN: {
        type: String,
        default: null
    },
    brand: {
        type: String,
        default: null
    },
    cabinType: {
        type: String,
        enum: ['sleeper', 'non_sleeper']
    },
    inspaction: {
        type: Number,
        default: null
    },            //  yes / no
    yom: {
        type: String,
        default: null
    },                      //  year of manufacture
    model: {
        type: String,
        default: null
    },
    exploitation: {
        type: String,
        default: null
    },
    info: {
        type: String,
        default: null
    },
    depo: {
        type: Schema.Types.ObjectId,
		ref: "depos",
    },
},{ timestamps: true });
let assets = mongoDB.model("assets", assetsSchema);
module.exports = assets;
