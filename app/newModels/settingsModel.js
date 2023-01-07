

const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const settingsSchema = new Schema({

    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    userType: {
        type: String,
        default: null
    },
    exchangeRate: {
        type: String,
        default: null
    },
    units: {
        type: Object,
        default: null
    },
    Currency: {
        type: Object,
        default: null
    },
    defaultCurrency: {
        type: String,
        default: null
    },
    defaultServiceTime: {
        type: Number,
        default: null
    },
    pieceTime: {
        type: Number,
        default: null
    },
    orders: {
        type: Object,
        default: null
    },
    loads: {
        type: Object,
        default: null
    },
    loadTemps: {
        type: Object,
        default: null
    },
    drivers: {
        type: Object,
        default: null
    },
    apiConfigs: {
        type: Object,
        default: null
    },
    autoplan: {
        type: Object,
        default: null
    },
    country: {
        type: String,
        default: null
    },
    countryCode: {
        type: String,
        default: null
    },
    durationMultiplier: {
        type: Number,
        default: null
    },
    fileHeaders: {
        type: Object,
        default: null
    },
    IterationMultiplier: {
        type: Number,
        default: null
    },
    timezone: {
        type: String,
        default: null
    },
    userSpecifiedTimezone: {
        type: String,
        default: null
    },
    metricsSystem: {
        type: Number,
        default: null
    },
    permisions: {
        type: Array,
        default: null
    },
    permisionConfig: {
        type: Boolean,
        default: null
    },
},{ timestamps: true });
const settings = mongoDB.model("settings", settingsSchema);
module.exports = settings;