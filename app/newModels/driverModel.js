const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");
const addressModel = require("./addressModel");

const Schema = mongoose.Schema;
const driverSchema = new Schema({
    ID: {
        type: Number,
        unique : true
    },
    carrier: {
        type: Schema.Types.ObjectId,
		ref: "carriers",
    },
    equipment: {
        type: Schema.Types.ObjectId,
		ref: "equipments",
    },
    asset: {
        type: Schema.Types.ObjectId,
		ref: "assets",
    },
    shift: {
        type: Schema.Types.ObjectId,
		ref: "shifts",
    },
    schedule: {
        type: Schema.Types.ObjectId,
		ref: "schedules",
    },
    depo: {
        type: Schema.Types.ObjectId,
		ref: "depos",
    },
    type: {
        type: String,
        enum: ['Own Operator', 'Company'],
        default: 'Own Operator'
    },
    eqType: {
        type: Object,
        default: null
    },
    status: {
        type: Number,
        default: null
    },
    startTime: {
        type: Date,
        default: null
    }, // may remove
    endTime: {
        type: Date,
        default: null
    }, // may remove

    fname: {
        type: String,
        default: null
    },
    lname: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    address: {
        ...addressModel
    },
    rate: {
        type: Number,
        default: null
    },
    hourlyRate: {
        type: Number,
        default: null
    },
    perMileRate: {
        type: Number,
        default: null
    },
    percentRate: {
        type: Number,
        default: null
    },
    fuelsurcharge: {
        type: Number,
        default: null
    },
    detention: {
        type: Number,
        default: null
    },
    bonuses: {
        type: Number,
        default: null
    },

    dob: {
        type: Date,
        default: null
    }, // Date of Birthday
    hdate: {
        type: Date,
        default: null
    }, // Hire date

    easypass: {
        type: Number,
        default: null
    }, // true false
    ex_rev_per_mile: {
        type: Number,
        default: null
    }, // Expected revenue per mile
    ex_rev_goal_week: {
        type: Number,
        default: null
    }, // Expected revenue goal of week
    lengthofhaul_min: {
        type: Number,
        default: null
    },
    lengthofhaul_max: {
        type: Number,
        default: null
    },
    drivinglicence: {
        type: JSON,
        default: null
    },
    use_sleeper_b_p: {
        type: Number,
        default: null
    }, // true/false  // Use Sleeper Birth Provision
    throughStates: {
        type: String,
        default: null
    },
    pickupDeliveryStates: {
        type: String,
        default: null
    },
    prefTruckStops: {
        type: String,
        default: null
    },
    tollRoutes: {
        type: String,
        default: null
    },
    mobileActive: {
        type: Number,
        default: null
    },
    routeNumber: {
        type: String,
        default: null
    }
},{ timestamps: true });

const drivers = mongoDB.model("drivers", driverSchema);
module.exports = drivers;