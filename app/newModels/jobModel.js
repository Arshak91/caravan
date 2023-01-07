const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");


const Schema = mongoose.Schema;

const jobSchema = new Schema({
    name: { type: String },
    UUID: { type: String },
    params: { type: Object },
    filters: { type: Object },
    status: { type: Array },
    eta: { type: Array },
    percentage: { type: Array },
    loadOrderIds: { type: Array },
    loads: { type: Array },
    drivingminutes: { type: Array },
    totalRunTime: { type: Array },
    totalDistance: { type: Array },
    totalDuration: { type: Array },
    Infeasible: {type: Array },
    InfeasibleCount: { type: Number },
    loadsCount: { type: Number },
    defaultStructure: { type: Array },
    errorMessage: { type: String }
},{ timestamps: true });
let jobs = mongoDB.model("jobs", jobSchema);
module.exports = jobs;