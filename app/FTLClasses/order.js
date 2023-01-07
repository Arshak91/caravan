const Orders = require("../newModels/ordersModel");
const Check = require("../classes/checks");
const Helpers = require("../FTLClasses/helpersFTL");
const HandlingUnitClass = require("../FTLClasses/handlingUnit");
const BaseService = require('../FTLClasses/base');
const { handlingUnit } = require("../config/db.config");

module.exports = class OrderClassobjectLiteralShorthandMethods extends BaseService {


    constructor(params) {
        super()
        this.data = params.data;
        this.where = params.where;
    }

    async getAll() {
        let orders, count;
        let { limit, offset, order } = this.data;
        count = await Orders.countDocuments({...this.where});
        orders = await Orders.find({...this.where}).populate("products").populate("status").sort(order).limit(limit).skip(offset);
        return await Helpers.getResponse(1, "Order List", {orders, count});
    }
    async changeTimeWindows(){
        let { orderIds, companyName } = this.data;
        let newOrders = await Orders.find({
            id: {
                $in: orderIds
            }
        });
        for (const order of newOrders.rows) {
            let timeWindows;
            timeWindows = await Check.newTimeWindow({
                pickupdateFrom: order.dataValues.pickupdateFrom,
                pickupdateTo: order.dataValues.pickupdateTo,
                deliverydateFrom: order.dataValues.deliverydateFrom,
                deliverydateTo: order.dataValues.deliverydateTo,
                companyName: companyName
            });
            await Orders.findOneAndUpdate({ id: order.dataValues.id }, {
                timeWindows
            }, { new: true });
        }
        return await Helpers.getResponse(1, "Successfully updated");
    }

    async create(){
        let { order, pickupLatLon, deliveryLatLon, distDur, delivery, pickup, status } = this.data;
        let newStatus = 1, message = "Successfully created";
        let newOrder = await Orders.create({
            // Load type
            loadtype: order.loadtype ? order.loadtype : 0,
            user: order.user,
            // load_id: order.load_id,
            depo: order.depoid ? order.depoid : null,

            // Pickup
            pickupCompanyName: order.pickupCompanyName,
            pickupState: order.pickupState,
            pickupStreetAddress: order.pickupStreetAddress,
            pickupLocationtypeid: order.pickupLocationtype,
            // --
            pickupCountry: order.pickupCountry,
            pickupCountryCode: order.pickupCountryCode,
            pickupCity: order.pickupCity,
            pickupZip: order.pickupZip,
            pickupAccessorials: order.pickupAccessorials,
            // --
            pickupdateFrom: order.pickupdateFrom,
            pickupdateTo: order.pickupdateTo,
            // --
            pickupLon: pickupLatLon.lon,
            pickupLat: pickupLatLon.lat,
            // Delivery
            deliveryCompanyName: order.deliveryCompanyName,
            deliveryState: order.deliveryState,
            deliveryStreetAddress: order.deliveryStreetAddress,
            deliveryLocationtypeid: order.deliveryLocationtype,
            // --
            deliveryCountry: order.deliveryCountry,
            deliveryCountryCode: order.deliveryCountryCode,
            deliveryCity: order.deliveryCity,
            deliveryZip: order.deliveryZip,
            deliveryAccessorials: order.deliveryAccessorials,
            // --
            deliverydateFrom: order.deliverydateFrom,
            deliverydateTo: order.deliverydateTo,
            // --
            deliveryLon: deliveryLatLon.lon,
            deliveryLat: deliveryLatLon.lat,

            // Equipment Type
            eqType: order.eqType,

            // References
            bol: order.bol,
            pro: order.pro,
            po: order.po,

            // Rating
            currency: order.currency,
            rate: order.rate ? order.rate : null,

            // Notes
            notes: order.notes,

            //// Statuses
            isPlanned: 0,
            confirmed: 0,
            status: "60b0b9206f8b6c476f2a576f",  // order.status,
            statusInternal: 1,
            isfreezed: 0,

            //// Dimentions
            pallet: null,

            // Other
            companyid: null, // order.companyid ,
            carrierid: null, // order.carrierid ,
            customerid: null, // order.customerid ,

            //// Other
            // servicetime: 900,
            custDistance: status ? distDur.distance : 0,
            custDuration: status ? distDur.duration : 0,
            bh: order.bh,
            delivery: `${delivery}, ${order.deliveryCountry}`,
            pickup: `${pickup}, ${order.pickupCountry}`,
            loadTempIds: [],
            loadIds: [],
            flowTypes: [],
            timeInfo: {
                loadTemps: {},
                loads: {},
                loadsArr: []
            },
            pieceCount: order.pieceCount ? order.pieceCount : 0,
            timeWindows: order.timeWindows,
            mustbefirst: order.mustbefirst,
            crossDock: order.crossDock,
            cube: order.cube ? order.cube : 0,
            feet: order.feet ? order.feet : 0,
            weight: order.weight ? order.weight : 0,
            servicetime: order.servicetime ? order.servicetime : 0,
            pieceTime: order.pieceTime ? order.pieceTime : 0,
            locations: order.locations
        }).catch(err => {
            if (err) {
                message = err.message;
                newStatus = 0;
            }
        });
        return await Helpers.getResponse(newStatus, message, newOrder);
    }

    async update(){
        let { where, data } = this;
        let { order, pickupLatLon, deliveryLatLon, distDur, delivery, pickup, status } = data;
        let theLoad = await Orders.findOneAndUpdate(where, {
            ...order
        }, {
            new: true
        }).catch(err => {
            console.log(err);
        });
        return await Helpers.getResponse(1, "Successfully updated", theLoad._doc);
    }

    async delete() {
        let { where, data } = this, orders, handlingUnits;
        orders = await Orders.deleteMany(where).catch(err => {
            console.log(err);
        });
        const HandlingUnitCl = new HandlingUnitClass({where: {
            order: {$in: data}
        }});
        handlingUnits = await HandlingUnitCl.delete();
        return await Helpers.getResponse(1, "Deleted", { orders, handlingUnits: handlingUnits.data })
    }

};

