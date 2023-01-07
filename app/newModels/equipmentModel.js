const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");
const autoIncrement = require("simple-mongoose-autoincrement");


const Schema = mongoose.Schema;

const equipmentSchema = new Schema({
    ID: {
        type: Number,
        unique : true
    },
    type: {
        type: String,
        enum: ['Tractor', 'Trailer', 'Truck']
    },
    trailerType: {
        type: String,
        default: null
    },
    name: {
        type: String,
        default: null
    },
    horsePower: {
        type: Number,
        default: null
    },

    value: {
        type: Number,
        default: null
    },
    valueUnit: {
        type: String,
        default: null
    },

    // trailerSize: {
    //     type: String
    // },
    externalLength: {
        type: String,
        default: null
    },
    externalWidth: {
        type: String,
        default: null
    },
    externalHeight: {
        type: String,
        default: null
    },

    internalLength: {
        type: String,
        default: null
    },
    internalWidth: {
        type: String,
        default: null
    },
    internalHeight: {
        type: String,
        default: null
    },
    maxweight: {
        type: Number,
        default: null
    },
    maxVolume: {
        type: Number,
        default: null
    },
    eqType: {
        type: String,
        enum: ['Dry','Reefer','Frozen','Cooler','Multi']
    },
},{ timestamps: true });

equipmentSchema.plugin(autoIncrement, {field: 'ID'});

let equipments = mongoDB.model("equipments", equipmentSchema);
module.exports = equipments;
