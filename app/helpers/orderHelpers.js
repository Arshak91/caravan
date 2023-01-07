const moment = require("moment");
const fs = require("fs");
const OSmapService = require("../services/osmap.service");
const OSmapServiceClass = new OSmapService();
const CheckService = require("../services/checks.service");
const CheckServiceClass = new CheckService();
const OrderModel = require("../newModels/ordersModel");
const BaseService = require("../main_classes/base.service");
class OrderHelper extends BaseService {

    getOrderModel = async (data) => {
        
    }

    orderLatLon = async (data) => {
        try {
            let { pickupAddr, deliveryAddr } = data;
            let delCity, delCountry, delCountryCode, pickCity, pickCountry, pickCountryCode;
            const [pickupLatLon, deliveryLatLon] = await Promise.all([
                pickupAddr ? OSmapServiceClass.GeoLoc({query: pickupAddr}) : null,
                deliveryAddr ? OSmapServiceClass.GeoLoc({query: deliveryAddr}) : null
            ])
            if (deliveryLatLon && deliveryLatLon.status && deliveryLatLon.data.data.status == "OK") {
                for (const item of deliveryLatLon.data.data.results[0].address_components) {
                    if (item.types.includes("locality")) {
                        delCity = item.long_name;
                    }
                    if (item.types.includes("country")) {
                        delCountry = item.long_name;
                        delCountryCode = item.short_name;
                    }
                }
            }
            if (pickupLatLon && pickupLatLon.status && pickupLatLon.data.data.status == "OK") {
                for (const item of pickupLatLon.data.data.results[0].address_components) {
                    if (item.types.includes("locality")) {
                        pickCity = item.long_name;
                    }
                    if (item.types.includes("country")) {
                        pickCountry = item.long_name;
                        pickCountryCode = item.short_name;
                    }
                }
            }

            return {
                pickup: pickupLatLon && pickupLatLon.status && pickupLatLon.data.data.status == "OK" ? 1 : 0,
                pickupLatLon: pickupLatLon && pickupLatLon.status && pickupLatLon.data.data.status == "OK" ? pickupLatLon.data : null,
                pickupAddress: {
                    pickCity,
                    pickCountry,
                    pickCountryCode
                },
                delivery : deliveryLatLon && deliveryLatLon.status && deliveryLatLon.data.data.status == "OK" ? 1 : 0,
                deliveryLatLon: deliveryLatLon && deliveryLatLon.status && deliveryLatLon.data.data.status == "OK" ? deliveryLatLon.data : null,
                deliveryAddress: {
                    delCity,
                    delCountry,
                    delCountryCode
                }
            };

        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    }

    orderClac = async (data) => {
        let { products } = data;
        let orderTypes = {
            stackable: 0,
            turnable: 0,
            hazmat: 0
        };
        let cube = 0, feet = 0, weight = 0, quantity = 0;
        for (const item of products) {
            if (item.stackable) orderTypes.stackable = 1;
            if (item.turnable) orderTypes.turnable = 1;
            if (item.hazmat) orderTypes.hazmat = 1;
            if (item.Length && item.Width && item.Height) {
                let val = item.Length * item.Width * item.Height;
                cube += (val * item.Quantity);
            } else if (item.volume > 0) {
                cube += (item.volume * item.Quantity);
            }
            feet += item.Length ? (item.Length * item.Quantity) : 0;

            weight += item.Weight && item.Quantity ? (item.Weight * item.Quantity) : 0;
            quantity += item.Quantity;

        }
        return { cube, feet, weight, quantity, orderTypes }
    }

    getOrderImagePath = async (directory, fileName, refHost, dirName) => {
        const dir = `${dirName}/../../resources/0/${directory}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let paths, fullHost;
        if (refHost == "http://localhost:4200") {
            fullHost = "http://localhost:8080";
        } else {
            fullHost = refHost;
        }
        paths = {
            urls: {
                Path: `${fullHost}/${directory}/${fileName}`
            },
            filePath: `${dir}/${fileName}`
        };
        console.log("dir", dir);
        console.log("path", `${fullHost}/${directory}/${fileName}`);

        return paths;
    }

    fixFillterForAlgo = async (data, isselected, isFilters) => {
        let { date, flowType, ids } = data;
        let where = {}, status = 1, filterWhere, bool;
        if (!isselected && isFilters) {
            delete data.date;
            delete data.flowType;
            delete data.ids;
            filterWhere = await this.fillters.orderFilter(data);
            bool = true;
            if (!filterWhere.bool) {
                return {
                    status: 0,
                    msg: "filter error",
                    data: {
                        orders: [],
                        count: 0
                    }
                };
            }
            where = filterWhere.where
        }else if (!isselected) {
            status = 2;
            let start = date;
            let end = moment(start).add(23.9998, "h").toISOString();
            if (flowType && flowType == "1") {
                where["pickupdateFrom"]= { $gte: start, $lte: end };
            }
            if (flowType && flowType == "2") {
                where["deliverydateTo"]= { $gte: start, $lte: end };
            }
        }
        if (isselected) {
            where["ID"] = {$in: ids}
            delete data.ids
        }
        delete data.date;
        delete data.flowType;
        for (const key in data) {
            where[key] = data[key]
        }
        return {where, status}
    };

    fixFillterForAlgoTL = async (data, isselected, isFilters) => {
        let { ids } = data;
        let where = {}, status = 1, filterWhere, bool;
        if (!isselected && isFilters) {
            delete data.date;
            delete data.flowType;
            delete data.ids;
            filterWhere = await this.fillters.orderFilter(data);
            bool = true;
            if (!filterWhere.bool) {
                return {
                    status: 0,
                    msg: "filter error",
                    data: {
                        orders: [],
                        count: 0
                    }
                };
            }
            where = filterWhere.where
        }
        if (isselected) {
            where["ID"] = {$in: ids}
            delete data.ids
        }
        delete data.flowType;
        for (const key in data) {
            where[key] = data[key]
        }
        return {where, status}
    };

    getLocationByFlowType = async (data) => {
        let { flowType, order } = data, location;
        if (flowType == 2) {
            for (const loc of order._doc.locations) {
                if (order._doc.deliveryCompanyName == loc._doc.companyLegalName) {
                    location = loc._doc
                }
            }
        }
        if (flowType == 1) {
            for (const loc of order._doc.locations) {
                if (order._doc.pickupCompanyName == loc._doc.companyLegalName) {
                    location = loc._doc
                }
            }
        }
        if (flowType == 3) {
            location = null;
            // for (const loc of order._doc.locations) {
            //     if (order._doc.pickupCompanyName == loc._doc.companyLegalName) {
            //         location = loc._doc
            //     }
            // }
        }
        return location;
    }

    sendAlgoOrders = async (data) => {
        let { orders, noTimeWindow, flowType } = data;
        let result = [], indexObj = {};
        for (const [o, order] of orders.entries()) {
            if (noTimeWindow == 1) {
                if (order.deliverydateFrom) {
                    order.deliverydateFrom = "2018-01-01T00:00:00Z";
                    order.timeWindows.deliveryTimeWindows[0].From = "2018-01-01T00:00:00Z";
                }
                if (order.pickupdateFrom) {
                    order.pickupdateFrom = "2018-01-01T00:00:00Z";
                    order.timeWindows.pickupTimeWindows[0].From = "2018-01-01T00:00:00Z";
                }
                if (order.deliverydateTo) {
                    order.deliverydateTo = "2030-01-01T00:00:00Z";
                    order.timeWindows.deliveryTimeWindows[0].To = "2030-01-01T00:00:00Z";
                }
                if (order.pickupdateTo) {
                    order.pickupdateTo = "2030-01-01T00:00:00Z";
                    order.timeWindows.pickupTimeWindows[0].To = "2030-01-01T00:00:00Z";
                }
            }
            let full = false;
            if (order.loadtype == "2") {
                full = true;
            }
            let location = await this.getLocationByFlowType({
                flowType,
                order
            });
            indexObj[o+1] = order._id;

            result.push({
                id: order.ID,
                feet: order.feet,
                weight: order.weight,
                cube: order.cube,
                depoid: order.depo,
                rate: order.rate ? order.rate : 0,
                permileRate: order.permileRate ? order.permileRate : 0,
                // flowType: order.flowType,
                // consigneeid: order.consigneeid,
                deliveryLat: order.deliveryLat,
                deliveryLon: order.deliveryLon,
                pickupLat: order.pickupLat,
                pickupLon: order.pickupLon,
                deliverydateFrom: order.deliverydateFrom,
                deliverydateTo: order.deliverydateTo,
                pickupdateFrom: order.pickupdateFrom,
                pickupdateTo: order.pickupdateTo,
                servicetime: order.servicetime,
                full: full,
                timeWindows: order.timeWindows,
                pieceCount: order.pieceCount,
                driverId: location && location.driver ? location.driver : null,
                zoneId: location && location.czone ? location.czone : null,
                mustBeFirst: order.mustbefirst ? 1 : 0
            });
        }
        return result;
    };

    getIDby_id = async (data) => {
        let { ids, orderIDS } = data, IDSArr = [];
        let orders;
        if (ids) {
            for (const id of ids) {
                const order = await OrderModel.findById(id, "ID");
                IDSArr.push(order.get("ID"))
            }
        } else if (orderIDS) {
            for (const id of orderIDS) {
                const order = await OrderModel.findOne({ID: id}, "ID");
                IDSArr.push(order._id)
            }
        }
        return IDSArr
    }

    editServicetimes = async (data) => {
        let { serviceTime, pieceTime } = data;
        const orders = await OrderModel.updateMany({}, [{
            $set: {
                pieceTime,
                servicetime: {
                    $sum: [
                        +serviceTime, {
                            $multiply: [+pieceTime, "$pieceCount"]
                        }
                    ]
                }
            }
        }]).catch(err => {
            console.log(`editServiceTimes: ${err.message}`);
        });
        return { status: 1, message: "Success", data: orders.length}
    }

    checkErrors = (data) => {
        let obj = data, status = 1;
        for (const i in obj) {
            if (!i || (Array.isArray(i) && !i.length)) {
                status = 0;
            }
        }
        return status;
    }

    changeTimeWindows = async (data) => {
        let { orderIds } = data;
        let newOrders = await OrderModel.find({
            _id: {
                $in: orderIds
            }
        });
        for (const order of newOrders) {
            let timeWindows;
            timeWindows = await CheckServiceClass.newTimeWindow({
                pickupdateFrom: order._doc.pickupdateFrom,
                pickupdateTo: order._doc.pickupdateTo,
                deliverydateFrom: order._doc.deliverydateFrom,
                deliverydateTo: order._doc.deliverydateTo,
            });
            await OrderModel.findByIdAndUpdate(order._doc._id, {
                timeWindows
            }, { new: true });
        }
        return { status: 1, msg:  "Successfully updated"};
    }

    getLoadType = async (data) => {
        let name;
        if (data == 0) {
            name = "TL"
        }
        if (data == 1) {
            name = "LTL"
        }
        return name
    };

    getOrderAttributes = () => {
        return "ID orderNumber feet crossDock cube rate permileRate weight isPlanned loadIds loadTempIds deliveryLon deliveryState deliveryStreetAddress deliveryZip deliverydateFrom deliverydateTo deliveryCity deliveryCompanyName deliveryCountry deliveryCountryCode pickupCity pickupCompanyName pickupCountry pickupCountryCode pickupLat pickupLocationtypeid pickupLon pickupState pickupStreetAddress pickupZip pickupdateFrom pickupdateTo loadtype deliveryLat depo specialneeds servicetime pieceCount timeInfo driver czone mustbefirst status timeWindows locations deliveryLocationtypeid deliveryLocationId pickupLocationId";
    };

    checkAddrByLocation = async (data) => {
        let { address, order, newPoint } = data;
        let newAddress = {};
        if (address.city == order.deliveryCity && address.streetAddress == order.deliveryStreetAddress && address.zip == order.deliveryZip
        && address.state == order.deliveryState && address.country == order.deliveryCountry && address.countryCode == order.deliveryCountryCode) {
            let delivery = `${newPoint.zip} ${newPoint.city} ${newPoint.streetAddress} ${newPoint.state}`;
            newAddress = {
                delivery,
                deliveryStreetAddress: newPoint.streetAddress,
                deliveryCity: newPoint.city,
                deliveryState: newPoint.state,
                deliveryZip: newPoint.zip,
                deliveryCountry: newPoint.country,
                deliveryCountryCode: newPoint.countryCode,
                deliveryLon: newPoint.lon,
                deliveryLat: newPoint.lat
            }
        };
        if (address.city == order.pickupCity && address.streetAddress == order.pickupStreetAddress && address.zip == order.pickupZip
        && address.state == order.pickupState && address.country == order.pickupCountry && address.countryCode == order.pickupCountryCode) {
            let pickup = `${newPoint.zip} ${newPoint.city} ${newPoint.streetAddress} ${newPoint.state}`;
            newAddress = {
                ...newAddress,
                pickup,
                pickupStreetAddress: newPoint.streetAddress,
                pickupCity: newPoint.city,
                pickupState: newPoint.state,
                pickupZip: newPoint.zip,
                pickupCountry: newPoint.country,
                pickupCountryCode: newPoint.countryCode,
                pickupLon: newPoint.lon,
                pickupLat: newPoint.lat
            }
        };

        return newAddress;
    }

    changeAddressByLocation = async (data) => {
        let { oldLocation, points } = data, locations, orderIds = [];
        const orders = await OrderModel.find({locations: oldLocation._id}).populate("locations");
        for (const order of orders) {
            let orderObj;
            if (order.get("deliveryCompanyName") == oldLocation.companyLegalName || order.get("pickupCompanyName") == oldLocation.companyLegalName) {
                for (const [p, point] of oldLocation.points.entries()) {
                    const Address = await this.checkAddrByLocation({
                        address: point.address,
                        order: order._doc,
                        newPoint: points[p].address
                    })
                    orderObj = Address
                }
                await OrderModel.findByIdAndUpdate(order._doc._id, orderObj);
                orderIds.push(order._doc._id.toString())
            }
        }
        return orderIds;
    }
};

module.exports = OrderHelper;