const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const depoSchema = new Schema({
    ID: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    carrier: {
        type: Schema.Types.ObjectId,
		ref: "carriers",
    },
    streetaddress: {
        type: String,
        default: null
    },
    city:{
        type: String,
        default: null
    },
    state:{
        type: String,
        default: null
    },
    zip:{
        type: String,
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
    lat: {
        type: String,
        default: null
    },
    lon: {
        type: String,
        default: null
    },
    status: {
        type: Number,
        default: null
    },
    workinghours: {
        type: Object,
        default: null
    }
},{ timestamps: true });
const depos = mongoDB.model("depos", depoSchema);
module.exports = depos;