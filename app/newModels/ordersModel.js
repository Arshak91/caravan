const mongoose = require("mongoose");
const mongoDB = require("../config/mongo_common.config");
const autoIncrement = require("mongoose-auto-increment-cn");
const logger = require("mongoose-query-logger");
const queryLogger = new logger.MongooseQueryLogger()
const Schema = mongoose.Schema;

const ordersSchema = new Schema({
    ID: {
        type: Number,
        unique : true
    },
    user: {
        type: Schema.Types.ObjectId,
		ref: "users",
    },
    orderNumber: {
        type: String,
        default: null
    },
    bol: {
        type: String,
        default: null
    },
    pro: {
        type: String,
        default: null
    },
    po: {
        type: String,
        default: null
    },
    loadnumber: {
        type: Number,
        default: null
    },
    isPlanned: {
        type: Number,
        default: null
    },
    confirmed: {
        type: Number,
        default: null
    },
    status: {
        type: Schema.Types.ObjectId,
		ref: "statuses",
    },
    statusInternal: {
        type: Number,
        default: null
    },
    isFreezed: {
        type: Number,
        default: null

    },
    depo: {
        type: Schema.Types.ObjectId,
		ref: "depos",
    },

    /// Dimantions
    feet: {
        type: Number,
        default: null
    },
    weight: {
        type: Number,
        default: null
    },
    pallet: {
        type: Number,
        default: null
    },
    cube: {
        type: Number,
        default: null
    },

    // Finance
    currency: {
        type: String,
        default: null
    },
    rate: {
        type: Number,
        default: null
    },
    rateType: {
        type: String,
        enum: ["flat", "per_mile"]
    },
    flatRate: {
        type: Number,
        default: null
    },
    permileRate: {
        type: Number,
        default: null
    },
    fuelRate: {
        type: Number,
        default: null
    },
    fuelSurcharges: {
        type: Number,
        default: null
    },
    otherRate: {
        type: Number,
        default: null
    },

    // Types
    eqType: {
        type: Schema.Types.ObjectId,
		ref: "equipmenttypes",
    },
    loadtype: {
        type: Schema.Types.ObjectId,
		ref: "transporttypes",
    },

    // Dates
    pickupdateFrom: {
        type: Date,
        default: null
    },
    pickupdateTo: {
        type: Date,
        default: null
    },
    deliverydateFrom: {
        type: Date,
        default: null
    },
    deliverydateTo: {
        type: Date,
        default: null
    },

    // Delivery Pickup Points
    delivery: {
        type: String,
        default: null
    },
    pickup: {
        type: String,
        default: null
    },

    deliveryCompanyName:  {
        type: String,
        default: null
    },   // Delivery(end Point) clinet Company name
    deliveryStreetAddress: {
        type: String,
        default: null
    },
    deliveryCity: {
        type: String,
        default: null
    },
    deliveryState: {
        type: String,
        default: null
    },
    deliveryZip: {
        type: String,
        default: null
    },
    deliveryCountry: {
        type: String,
        default: null
    },
    deliveryCountryCode: {
        type: String,
        default: null
    },
    deliveryLon: {
        type: String,
        default: null
    },
    deliveryLat: {
        type: String,
        default: null
    },
    deliveryLocationtypeid: {
        type: Schema.Types.ObjectId,
		ref: "locationtypes",
    },
    deliveryAccessorials: {
        type: Schema.Types.ObjectId,
		ref: "accessorials",
    },
    deliveryLocationId: {
        type: String,
        default: null
    },
    pickupCompanyName: {
        type: String,
        default: null
    },      // Shipper/Broker Company/Person Name
    pickupStreetAddress: {
        type: String,
        default: null
    },
    pickupCity: {
        type: String,
        default: null
    },
    pickupState: {
        type: String,
        default: null
    },
    pickupZip: {
        type: String,
        default: null
    },
    pickupCountry: {
        type: String,
        default: null
    },
    pickupCountryCode: {
        type: String,
        default: null
    },
    pickupLon: {
        type: String,
        default: null
    },
    pickupLat: {
        type: String,
        default: null
    },
    pickupLocationtypeid: {
        type: Schema.Types.ObjectId,
		ref: "locationtypes",
    },
    pickupLocationId: {
        type: String,
        default: null
    },
    pickupAccessorials: {
        type: Schema.Types.ObjectId,
		ref: "accessorials",
    },

    // Other
    dispatchDate: {
        type: String,
        default: null
    }, // ?
    servicetime: {
        type: Number,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    productDescription: {
        type: String,
        default: null
    }, // ?
    custDistance: {
        type: Number,
        default: null
    },
    custDuration: {
        type: Number,
        default: null
    },
    specialneeds: {
        type: Array,
        default: null
    },
    bh: {
        type: Number,
        default: null
    },
    orderTypes: {
        type: Object,
        default: null
    },
    locations: [{
        type: Schema.Types.ObjectId,
		ref: "locations"
    }],
    products: [{
        type: Schema.Types.ObjectId,
		ref: "handlingUnits"
    }],
    timeInfo: {
        type: Object,
        default: null
    },
    pickupTimeInfo: {
        type: Object,
        default: null
    },
    pieceCount: {
        type: Number,
        default: null
    },
    loadTempIds: {
        type: Array,
        default: null
    },
    loadIds: {
        type: Array,
        default: null
    },
    pieceTime: {
        type: Number,
        default: null
    },
    flowTypes: {
        type: Array,
        default: null
    },
    timeWindows: {
        type: Object,
        default: null
    },
    mustbefirst: {
        type: Number,
        default: 0
    },
    crossDock: {
        type: Number,
        default: 0
    },
    proof: {
        type: Object,
        default: null
    }
}, {   timestamps: true });
// autoIncrement.initialize(mongoose.connection);
// ordersSchema.plugin(autoIncrement.plugin, { model: 'orders', field: 'ID', startAt: 1000 });
// ordersSchema.plugin(queryLogger.getPlugin());
let orders = mongoDB.model("orders", ordersSchema);
module.exports = orders;
