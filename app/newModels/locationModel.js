const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");

const Schema = mongoose.Schema;
const locationSchema = new Schema({
    ID: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    companyLegalName: {
        type: String,
        default: null
    },
    email: {
        type: String,
		default: null,
    },
    address: {
        type: String,
		default: null,
    },
    address2: {
        type: String,
        default: null
    },
    phone1:{
        type: String,
        default: null
    },
    phone2:{
        type: String,
        default: null
    },
    contactPerson:{
        type: String,
        default: null
    },
    points: {
        type: Object,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    rating: {
        type: String,
        enum: ['A', 'B', 'C']
    },
    serviceTime: {
        type: Number,
        default: null
    },
    driver: {
        type: Schema.Types.ObjectId,
		ref: "drivers",
    },
    czone: {
        type: Schema.Types.ObjectId,
		ref: "czones",
    },
    depo: {
        type: Schema.Types.ObjectId,
		ref: "depos",
    },
    mustbefirst: {
        type: Number,
        default: 0
    },
    disable: {
        type: Number,
        default: 0
    },
},{ timestamps: true });
const locations = mongoDB.model("locations", locationSchema);
module.exports = locations;