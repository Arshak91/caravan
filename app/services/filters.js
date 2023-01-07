const moment = require("moment");
const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper();
const transportTypeModel = require("../newModels/transportTypeModel");
const HandlingUnitModel = require("../newModels/handlingUnitModel");
const LocationsModel = require("../newModels/locationModel");
const OrdersModel = require("../newModels/ordersModel");

class FiltersService {

    orderFilter = async (obj, algo) => {
        let where = await GeneralHelperClass.trim(obj)
        let newWhere = {
            $and: []
        };
        let type, bool = true;
        let pickupCompany, deliveryCompany, orderId;
        if (where["userId"]) {
            newWhere.$and.push({
                user: where["userId"]
            });
            delete where["userId"];
        }
        if (where["statuses"]) {
            newWhere.$and.push({
                status: { $in: where["statuses"].split(",") }
            });
            delete where["statuses"];
        }
        if (where["deliverydateTo"] && where["deliverydateFrom"] && moment(where["deliverydateTo"]) <= moment(where["deliverydateFrom"]) && !algo) {
            delete where["deliverydateTo"];
            delete where["deliverydateFrom"];
            bool = false;
        }
        if (where["deliverydateFrom"] && !algo) {
            newWhere.$and.push({
                deliverydateFrom: { $gte: where["deliverydateFrom"] }
            });
            delete where["deliverydateFrom"];
        } else if (where["deliverydateFrom"] && algo) {
            newWhere.$and.push({
                deliverydateFrom: where["deliverydateFrom"]
            });
            delete where["deliverydateFrom"];
        }
        if (where["deliverydateTo"] && !algo) {
            newWhere.$and.push({
                deliverydateTo: { $lte: where["deliverydateTo"] }
            });
            delete where["deliverydateTo"];
        } else if (where["deliverydateTo"] && algo) {
            newWhere.$and.push({
                deliverydateTo: where["deliverydateTo"]
            });
            delete where["deliverydateTo"];
        }
        if ((where.totalRateMin && where.totalRateMax) && (+where.totalRateMax > +where.totalRateMin)) {
            newWhere.$and.push({
                rate: {
                    $gte: +where.totalRateMin,
                    $lte: +where.totalRateMax
                }
            });
            delete where.totalRateMin;
            delete where.totalRateMax;
        } else if (where.totalRateMin && !where.totalRateMax) {
            newWhere.$and.push({
                rate: {
                    $gte: +where.totalRateMin
                }
            });
            delete where.totalRateMin;
        } else if (where.totalRateMax && !where.totalRateMin) {
            newWhere.$and.push({
                rate: {
                    $lte: +where.totalRateMax
                }
            });
            delete where.totalRateMax;
        } else if (+where.totalRateMax <= +where.totalRateMin) {
            delete where.totalRateMin;
            delete where.totalRateMax;
            bool = false;
        }
        if (where["pickupdateFrom"] && where["pickupdateTo"] && moment(where["pickupdateTo"]) <= moment(where["pickupdateFrom"]) && !algo) {
            delete where["pickupdateTo"];
            delete where["pickupdateFrom"];
            bool = false;
        }
        if (where["pickupdateFrom"] && !algo) {
            newWhere.$and.push({
                pickupdateFrom: { $gte: where["pickupdateFrom"] }
            })
            delete where["pickupdateFrom"];
        } else if (where["pickupdateFrom"] && algo) {
            newWhere.$and.push({
                pickupdateFrom: where["pickupdateFrom"]
            })
            delete where["pickupdateFrom"];
        }
        if (where["pickupdateTo"] && !algo) {
            newWhere.$and.push({
                pickupdateTo: { $lte: where["pickupdateTo"] }
            })
            delete where["pickupdateTo"];
        } else if (where["pickupdateTo"] && algo) {
            newWhere.$and.push({
                pickupdateTo: where["pickupdateTo"]
            })
            delete where["pickupdateTo"];
        }
        if (where["delivery"]) {
            newWhere.$and.push({
                delivery: { $regex: where["delivery"], $options:'i' }
            })
            delete where["delivery"];
        }
        if (where["pickup"]) {
            newWhere.$and.push({
                pickup: { $regex: where["pickup"], $options:'i' }
            })
            delete where["pickup"];
        }
        if (where["pickupState"]) {
            newWhere.$and.push({
                pickupState: { $regex: where["pickupState"], $options:'i' }
            })
            delete where["pickupState"];
        }
        if (where["deliveryState"]) {
            newWhere.$and.push({
                deliveryState: { $regex: where["deliveryState"], $options:'i' }
            })
            delete where["deliveryState"];
        }
        if (where["orderType"]) {
            const orderType = where.orderType.split(",");
            const obj = {};
            for (const item of orderType) {
                item == "stackable" ? newWhere.$and.push({"orderTypes.stackable": 1}) : "";
                item == "turnable" ? newWhere.$and.push({"orderTypes.turnable": 1}) : "";
                item == "hazmat" ? newWhere.$and.push({"orderTypes.hazmat": 1}) : "";
            }
            delete where.orderType;
        }
        if ( where["pickupCompanyName"]) {
            pickupCompany = {
                pickupCompanyName: { $regex: where["pickupCompanyName"], $options:'i' }
            }
            delete where["pickupCompanyName"];
        }
        if (where["deliveryCompanyName"]) {
            deliveryCompany = {
                deliveryCompanyName: { $regex: where["deliveryCompanyName"], $options:'i' }
            }
            delete where["deliveryCompanyName"];
        }
        let companyObj = {}, locFilter = false;
        if (where["locations"]) {
            if (where.locationFilters.all) {
                companyObj = { $or: [
                    { locations: { $in: where["locations"].split(",") } },
                    pickupCompany, deliveryCompany
                ] };
                locFilter = true
            } else {
                const regex = where.locationNames.map((e) => { return new RegExp(e, "i"); });
                if (where.locationFilters.pickup) {
                    companyObj = { $or: [ pickupCompany, deliveryCompany, { pickupCompanyName: { $in: regex } } ]};
                } else {
                    companyObj = { $or: [ pickupCompany, deliveryCompany, { deliveryCompanyName: { $in: regex } } ]};
                }
            }
            companyObj['$or'] = companyObj['$or'].filter(item => {
                return item
            })
            newWhere.$and.push(companyObj)
            delete where.locationNames;
            delete where.locationFilters;
            delete where.locations;
        } else {
            pickupCompany ? newWhere.$and.push(pickupCompany) : null;
            deliveryCompany ? newWhere.$and.push(deliveryCompany) : null;
        }

        if (where.sizeType) {
            type = where.sizeType;
            delete where.sizeType;
            if ((where.sizeMin && where.sizeMax) && (+where.sizeMax > +where.sizeMin)) {
                newWhere.$and.push({
                    [type]: { $gte: where.sizeMin * 1, $lte: where.sizeMax * 1 }
                })
                delete where.sizeMin;
                delete where.sizeMax;
            } else if (+where.sizeMin && !where.sizeMax) {
                newWhere.$and.push({
                    [type]: {
                        $gte: where.sizeMin
                    }
                })
                delete where.sizeMin;
            } else if (+where.sizeMax && !where.sizeMin) {
                newWhere.$and.push({
                    [type]: {
                        $lte: where.sizeMax
                    }
                })
                delete where.sizeMax;
            } else if (+where.sizeMax <= +where.sizeMin) {
                delete where.sizeMin;
                delete where.sizeMax;
                bool = false;
            }
        } else if (where.sizeMax || where.sizeMin) {
            delete where.sizeMin;
            delete where.sizeMax;
        }
        if (where.depotId) {
            newWhere.$and.push({
                $or: [{ depo: where.depotId }, { depo: null }]
            })
            delete where.depotId;
        }
        if (where["id"]) {
            orderId = {
                _id: { $in: where["id"].split(",") }
            };
            delete where["id"];
        }
        if (where["loadtype"]) {
            newWhere.$and.push({
                loadtype: where["loadtype"]
            });
            delete where["loadtype"];
        }
        if (where["specialNeeds"]) {
            let sid = where["specialNeeds"];
            const orderIds = await HandlingUnitModel.find({specialneeds: sid}).distinct("order");
            orderId ? newWhere.$and.push({ $or: [orderId, {"_id": { $in: orderIds }}] })
                : newWhere.$and.push({"_id": { $in: orderIds }});
            delete where["specialNeeds"];
        } else {
            orderId ? newWhere.$and.push(orderId) : null
        }
        if (where.zoneIds) {
            let zoneIds, query, location, locations = [], locationIds = [], zoneNull = 0;
            zoneIds = where.zoneIds.split(",");
            for (const [z, zoneId] of zoneIds.entries()) {
                if (zoneId == 0) {
                    zoneNull = 1;
                }
            }
            locations = zoneNull ? await LocationsModel.find({
                czone: null
            }) : locations;
            location = await LocationsModel.find({
                czone: {
                    $in: zoneIds
                }
            });
            locations = locations.concat(location);
            locations.forEach(loc => {
                if (where.locationid && where.locationid[$in].length) {
                    if (where.locationid[Op.in].includes(loc._doc._id.toString())) {
                        locationIds.push(loc._doc._id.toString());
                    }
                } else if (!where.locationid) {
                    locationIds.push(loc._doc._id.toString());
                }

            });
            newWhere.$and.push({
                locations: { $in: locationIds }
            })
            delete where.zoneIds;
        }

        if (where["ID"] && !where["ID"].$in) {
            let IDObj;
            if (typeof where["ID"] == "string") {
                IDObj = {
                    ID: { $in: where["ID"].split(",") }
                };
            } else {
                IDObj = {
                    ID: { $in: where["ID"] }
                };
            }
            IDObj ? newWhere.$and.push(IDObj) : null;
            delete where["ID"];
        }
        for (const key in where) {
            newWhere.$and.push({[key]: where[key]});
        }
        if (!newWhere.$and.length) {
            delete newWhere.$and
        }
        return {where: newWhere, bool};
    }

    depoFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }

    handlingunitFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    HandlingTypeFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }

    locationTypeFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }

    accessorialFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }

    pieceTypeFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }

    locationFilter = async (where) => {
        let newWhere = {
            $and: []
        };
        if (where["companyLegalName"]) {
            newWhere.$and.push({
                companyLegalName: { $regex: where["companyLegalName"], $options:'i' }
            })
            delete where["companyLegalName"];
        }
        if (where["_id"]) {
            newWhere.$and.push({
                _id: { $in: where["_id"].split(",") }
            })
            delete where["_id"];
        }
        if (where["text"]) {
            newWhere.$and.push({
                companyLegalName: { $regex: where["text"], $options:'i' }
            })
            delete where["text"];
        }
        if (where["name"]) {
            newWhere.$and.push({
                name: { $regex: where["name"], $options:'i' }
            })
            delete where["name"];
        }
        if (where["contactPerson"]) {
            newWhere.$and.push({
                contactPerson: { $regex: where["contactPerson"], $options:'i' }
            })
            delete where["contactPerson"];
        }
        for (const key in where) {
            newWhere.$and.push({[key]: where[key]});
        }
        if (!newWhere.$and.length) {
            delete newWhere.$and
        }
        return newWhere;
    }

    driverFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    roleFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    settingsFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    permisionFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    equipmentTypeFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    FreightClassesFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    imageFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    planningFilter = async (where) => {
        let newWhere = {}, filter = true;
        let whereForDriver = "", id = "", depot = "";
        if (where.driverAssigned == 0) {
            whereForDriver = null;
        } else if ((where.driverAssigned == 1 && where.driversIds) || (!where.driverAssigned && where.driversIds)) {
            whereForDriver = {
                $in: where.driversIds.split(",")
            };
        } else if (where.driverAssigned == 1 && !where.driversIds) {
            whereForDriver = {
                $ne: null
            };
        }
        if(where.id) {
            id = {
                $in: where.id.split(",")
            }
        }
        if(where.depo) {
            depot = where.depo
        }
        if(where.locations) {
            if (where.locationFilters.all) {
                const loadTempIds = await OrdersModel.find({
                    locations: { $in: where.locations.split(",") }
                }).distinct("loadTempIds");
                where.ids = loadTempIds;
            } else {
                const regex = where.locationNames.map((e) => { return new RegExp(e, "i"); });
                let companyObj;
                if (where.locationFilters.pickup) {
                    companyObj = { pickupCompanyName: { $in: where.locationNames } };
                } else {
                    companyObj = { deliveryCompanyName: { $in: where.locationNames } };
                }
                const loadTempIds = await OrdersModel.find({
                    ...companyObj
                }).distinct("loadTempIds");
                where.ids = loadTempIds;
            }
        }
        if(where.bol) {
            const loadTempIds = await OrdersModel.find({
                bol: where.bol
            }).distinct("loadTempIds");
            where.ids ? where.ids = where.ids.concat(loadTempIds) : where.ids = loadTempIds;
        }
        if(where.po) {
            const loadTempIds = await OrdersModel.find({
                po: where.po
            }).distinct("loadTempIds");
            where.ids ? where.ids = where.ids.concat(loadTempIds) : where.ids = loadTempIds;
        }
        if(where.pro) {
            const loadTempIds = await OrdersModel.find({
                pro: where.pro
            }).distinct("loadTempIds");
            where.ids ? where.ids = where.ids.concat(loadTempIds) : where.ids = loadTempIds;
        }
        if(where.orderNumber) {
            const loadTempIds = await OrdersModel.find({
                orderNumber: where.orderNumber
            }).distinct("loadTempIds");
            where.ids ? where.ids = where.ids.concat(loadTempIds) : where.ids = loadTempIds;
        }
        let orders = "";
        if(where.orderIds) {
            let orderIds = await GeneralHelperClass.getIDby_id({
                orderIDS: where.orderIds.split(",")
            })
            orders = {
                $in: orderIds
            };
        }
        let stops = "", miles = "", size = {};
        if(where.stopsMin) {
            stops = { $gte: +where.stopsMin }
        }
        if(where.stopsMax) {
            stops = where.stopsMin ? {
                ...stops,
                $lte: +where.stopsMax
            } : {
                $lte: +where.stopsMax
            }
        }
        if(where.stopsMin && where.stopsMax && (+where.stopsMin > +where.stopsMax)){
            stops = "";
            filter = false
        }
        if(where.mileMin) {
            miles = { $gte: +where.mileMin }
        }
        if(where.mileMax) {
            miles = where.mileMin ? {
                ...miles,
                $lte: +where.mileMax
            } : {
                $lte: +where.mileMax
            }
        }
        if(where.mileMin && where.mileMax && (+where.mileMin > +where.mileMax)){
            miles = "";
            filter = false
        }
        let type;
        if (where.sizeType) {
            type = where.sizeType;
            delete where.sizeType;
            if ((where.sizeMin && where.sizeMax) && (+where.sizeMax > +where.sizeMin)) {
                size[type] = { $gte: +where.sizeMin, $lte: +where.sizeMax }
                delete where.sizeMin;
                delete where.sizeMax;
            } else if (+where.sizeMin && !where.sizeMax) {
                size[type] = {
                    $gte: where.sizeMin
                }
                delete where.sizeMin;
            } else if (+where.sizeMax && !where.sizeMin) {
                size[type] = {
                    $lte: where.sizeMax
                }
                delete where.sizeMax;
            } else if (+where.sizeMax < +where.sizeMin) {
                delete where.sizeMin;
                delete where.sizeMax;
                filter = false;
            }
        } else if (where.sizeMax || where.sizeMin) {
            delete where.sizeMin;
            delete where.sizeMax;
        }
        let startDate = "";
        if(where.startDate) {
            let startFrom = moment.utc(where.startDate).format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z",
            startTo = moment.utc(where.startDate).add(1, "days").format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z";
            console.log(startFrom,   startTo)
            startDate = {
                $gte: startFrom,
                $lte: startTo
            }
        }
        let planIds = []
        if(where.ids){
            where.ids.forEach(id => {
                !planIds.includes(id) ? planIds.push(id) : null
            });
        }
        newWhere = {
            _id: where.ids ? {
                $in: planIds
            } : "",
            loadType: where.loadType ? where.loadType : "",
            flowType: where.flowType ? +where.flowType : "",
            return: where.return ? +where.return : "",
            planType: where.planType ? where.planType : "",
            driver: whereForDriver,
            startTime: startDate,
            ID: id,
            depo: depot,
            stops: stops,
            totalDistance: miles,
            orders: orders
        }
        type ? newWhere = {
            ...newWhere,
            ...size
        } : null;
        newWhere = await GeneralHelperClass.trim(newWhere)
        // for (const key in where) {
        //     newWhere[key] = where[key];
        // }
        return {newWhere, filter};
    };
    flowtypeFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    equipmentFilter = async (where) => {
        let newWhere = {};
        if (where.id) {
            newWhere["ID"] = {
                $in: where.id.split(",")
            }
            delete where.id;
        }
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    uploadFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    shiftFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    };
    statusFilter = async (where) => {
        let newWhere = {};
        if (where["type"]) {
            newWhere["$or"] = [{type: where["type"]}, {type: "Both"}];
            delete where["type"];
        }
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    jobFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    czoneFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    transportTypeFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    specialneedFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    loadsFilter = async (where) => {
        let newWhere = {};
        for (const key in where) {
            newWhere[key] = where[key];
        }
        return newWhere;
    }
    assetFilter = async (where) => {
        let newWhere = {
            $and: []
        };
        if (where["equipment"]) {
            newWhere.$and.push({
                equipment: where["equipment"]
            });
            delete where["equipment"];
        }
        for (const key in where) {
            newWhere.$and.push({[key]: where[key]});
        }
        if (!newWhere.$and.length) {
            delete newWhere.$and
        }
        return newWhere;
    }
    notificationsFilter = async (where) => {
        let newWhere = {};
        where.seen == 0
            ? newWhere["$or"] = [{seen: where.seen}, {seen: null}]
            : where.seen == 1 ? newWhere["seen"] = where.seen
            : null;
        // for (const key in where) {
        //     newWhere[key] = where[key];
        // }
        return newWhere;
    }
};

module.exports = FiltersService;
