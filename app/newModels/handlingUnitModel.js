const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const handlingUnitSchema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
		ref: "orders",
    },
    HandlingType: {
        type: Schema.Types.ObjectId,
		ref: "HandlingTypes",
    },
    Quantity: { type: Number, default: null },
    piecetype_id: {
        type: Schema.Types.ObjectId,
        ref: "pieceTypes"
    },
    productdescription: {
        type: String,
        default: null
    },
    freightclasses_id: {
        type: Schema.Types.ObjectId,
        ref: "freightclasses"
    },
    images: [{
        type: Schema.Types.ObjectId,
        ref: "images"
    }],
    nmfcnumber: {
        type: String,
        default: null
    },
    nmfcsubcode: {
        type: String,
        default: null
    },
    Weight: {
        type: Number,
        default: null
    },
    Length: {
        type: Number,
        default: null
    },
    Width: {
        type: Number,
        default: null
    },
    Height: {
        type: Number,
        default: null
    },
    mintemperature: {
        type: Number,
        default: null
    },
    maxtemperature: {
        type: Number,
        default: null
    },
    stackable: {
        type: Boolean,
        default: null
    },
    turnable: {
        type: Boolean,
        default: null
    },
    hazmat: {
        type: Boolean,
        default: null
    },

    density: {
        type: Number,
        default: null
    },
    options: {
        type: String,
        default: null
    },
    volume: {
        type: Number,
        default: null
    },
    sku: {
        type: String,
        default: null
    },
    brand: {
        type: String,
        default: null
    },
    specialneeds: {
        type: Schema.Types.ObjectId,
        ref: "specialneeds"
    }
},{ timestamps: true });
let handlingUnits = mongoDB.model("handlingUnits", handlingUnitSchema);
module.exports = handlingUnits;
