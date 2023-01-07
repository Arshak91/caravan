const uuidv1 = require("uuid/v1");
const moment = require("moment");
const CheckService = require("../services/checks.service");
const CheckServiceClass = new CheckService();
// const CalcService = require("../services/calculation.service");
// const CalcServiceClass = new CalcService();
const BaseService = require('../main_classes/base.service');
const Errors = require("../errors/orderErrors");
const OrderHelper = require("../helpers/orderHelpers")
const OrderHelperClass = new OrderHelper();
const Warnings = require("../warnings/orderWarnings");
const WarningsClass = new Warnings();
const HandlingUnitService = require("./handlingUnit.service");
const HandlingUnitServiceClass = new HandlingUnitService();
const UploaderService = require("./uploader.service");
const UploaderServiceClass = new UploaderService();

const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper()
const PlanningHelper = require("../helpers/planningHelper");
const PlanningHelperClass = new PlanningHelper();

const DepoService = require("./depo.service");
const DepoServiceClass = new DepoService();
const SettingsService = require("./settings.service");
const SettingsServiceClass = new SettingsService();
const UploadService = require("./upload.service");
const UploadServiceClass = new UploadService();
const LogicService = require("./logics.service");
const LogicServiceClass = new LogicService();
const { ObjectID } = require('bson');
const map = require("../constants/mapping");

// Models
const StatusesSchema = require("../newModels/statusesModel");
const Orders = require("../newModels/ordersModel");
const PlanningSchema = require("../newModels/planningModel");
const transportTypeModel = require("../newModels/transportTypeModel");
const ProductModel = require("../newModels/handlingUnitModel");



const createOrderError = (order) => {
    let error = false;
    let msg = [];
    if (!order.products || !order.products.length) {
        error = true;
        msg.push({
            key: "Products",
            msg: `Add products to the Order.`
        });
    }
    if (order.products && order.products.length) {
        for (const [p, product] of order.products.entries()) {
            if (!product.Quantity) {
                error = true;
                msg.push({
                    key: "Quantity",
                    msg: `Add Quantity to the Product ${p}.`
                });
            }
        }
    }if (!order.pickupCompanyName || !order.pickupState || !order.pickupStreetAddress || !order.pickupCountryCode || !order.pickupCity || !order.pickupZip) {
        error = true;
        msg.push({
            key: "pickup Address",
            msg: "Please enter the full address."
        });
    }
    if (!order.deliveryCompanyName || !order.deliveryState || !order.deliveryStreetAddress || !order.deliveryCountryCode || !order.deliveryCity || !order.deliveryZip) {
        error = true;
        msg.push({
            key: "delivery Address",
            msg: "Please enter the full address."
        });
    }
    if (!order.pickupdateFrom || !order.pickupdateTo) {
        error = true;
        msg.push({
            key: "pickup date",
            msg: `Add date to the Order.`
        });
    }
    if (!order.deliverydateFrom || !order.deliverydateTo) {
        error = true;
        msg.push({
            key: "delivery date",
            msg: `Add date to the Order.`
        });
    }
    if (!order.eqType && order.eqType != 0) {
        error = true;
        msg.push({
            key: "eqType",
            msg: `Add Equipment Type to the Order.`
        });
    }
    return {
        error,
        msg
    };
};





class OrderService extends BaseService {


    constructor() {
        super();
    }

    orderErrorHandler = {
        create: async (orders) => ( await createOrderError(orders) )
    };

    getAll = async (body, algo) => {
        let pagination = await this.pagination.sortAndPagination(body.body)
        let fillter = await this.fillters.orderFilter(body.body, algo)

        let orders = [], count = 0, message = "Order list", status = 1, totalCount = 0;
        let { limit, offset, order } = pagination, user = body.user ? body.user._id : null;
        if (fillter.bool) {
            count = await Orders.countDocuments({
                ...fillter.where
            });
            totalCount = await Orders.countDocuments({});
            orders = await Orders.find({
                ...fillter.where
            }, OrderHelperClass.getOrderAttributes())
                .populate("locations").populate("loadtype").populate("depo").populate("products").populate("status")
                .sort(order).limit(limit).skip(offset).catch(err => {
                if (err) {
                    message = err.message;
                    status = 0;
                }
            });
        } else {
            status = 0;
            message = "fillter incorrect";
        }
        return this.getResponse(status, message, {orders, count, totalCount});
    };

    getAllByAttr = async (data, algo, attr) => {
        let pagination = await this.pagination.sortAndPagination(data.body)
        let fillter = await this.fillters.orderFilter(data.body, algo)

        let orders = [], count = 0, message = "Order list", status = 1, totalCount = 0;
        let { limit, offset, order } = pagination, user = data.user ? data.user._id : null;
        if (fillter.bool) {
            count = await Orders.countDocuments({
                ...fillter.where
            });
            totalCount = await Orders.countDocuments({});
            orders = await Orders.find({
                ...fillter.where
            }, attr).distinct(attr).catch(err => {
                if (err) {
                    message = err.message;
                    status = 0;
                }
            });
        } else {
            status = 0;
            message = "fillter incorrect";
        }
        return this.getResponse(status, message, {orders, count, totalCount});
    }

    getAllWithoutPagination = async (body) => {
        let fillter = await this.fillters.orderFilter(body.body)

        let orders, count, message = "Order list", status = 1;
        count = await Orders.countDocuments({
            ...fillter.where
        });
        orders = await Orders.find({
            ...fillter.where
        }).populate("products").populate("status").populate("locations").catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {orders, count});
    };
    getById = async (data) => {
        let _id = data.params.id;
        let order, message = "Success!", status = 1;
        order = await Orders.findById(_id).populate(["locations", "loadtype", "depo", "status"]).populate({
            path: "products",
            populate : {
                path : "images"
            }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, order);
    };
    getFew = async (data) => {
        let { ids } = data.body, user = data.user._id;
        let order, message = "Success!", status = 1;
        order = await Orders.find({
            _id: { $in: ids}
        }).populate("products").populate("status").catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, order);
    };

    changeTimeWindows = async (body) => {
        let { orderIds, companyName } = body;
        let newOrders = await Orders.find({
            id: {
                $in: orderIds
            }
        });
        for (const order of newOrders.rows) {
            let timeWindows;
            timeWindows = await CheckServiceClass.newTimeWindow({
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
        return this.getResponse(1, "Successfully updated");
    };

    create = async (data) => {
        const timeNow = new Date().getTime();
        const errors = await this.orderErrorHandler.create(data.body, data.companyName);
        let newStatus = 1, message = "Successfully created";
        let order = data.body;
        let userId = data.user._id;
        if (errors.error) {
            newStatus = 0;
            message = errors.msg
            return this.getResponse(newStatus, message, {
                ProbillNo: order.pro,
                OrderNo: order.orderNumber
            });
        } else {
            let pickupAddr = `${order.pickupZip}+${order.pickupCity}+${order.pickupStreetAddress}+${order.pickupState}`;
            let pickup = `${order.pickupZip} ${order.pickupCity} ${order.pickupStreetAddress} ${order.pickupState}`;
            let deliveryAddr = `${order.deliveryZip}+${order.deliveryCity}+${order.deliveryStreetAddress}+${order.deliveryState}`;
            let delivery = `${order.deliveryZip} ${order.deliveryCity} ${order.deliveryStreetAddress} ${order.deliveryState}`;
            let LatLons = await OrderHelperClass.orderLatLon({
                pickupAddr,
                deliveryAddr
            })
            if (!LatLons.pickup || !LatLons.delivery) {
                return this.getResponse(0, "Wrong Address", {
                    ProbillNo: order.pro,
                    OrderNo: order.orderNumber
                });
            } else {
                let newStatus = 1, message = "Successfully created";
                const [timeWindows, settings] = await Promise.all([
                    CheckServiceClass.newTimeWindow({
                        pickupdateFrom: order.pickupdateFrom,
                        pickupdateTo: order.pickupdateTo,
                        deliverydateFrom: order.deliverydateFrom,
                        deliverydateTo: order.deliverydateTo,
                        companyName: data.companyName,
                    }),
                    SettingsServiceClass.getOne({
                        where: {},
                        userId
                    })
                ]);
                let { cube, feet, weight, specialneeds, quantity, orderTypes } = await OrderHelperClass.orderClac({products: order.products })
                let pickLat = LatLons.pickupLatLon.data.results[0].geometry.location.lat,
                pickLon = LatLons.pickupLatLon.data.results[0].geometry.location.lng,
                delLat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat,
                delLon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
                const { distDur, msg, status } = await WarningsClass.createOrder({
                    pickupLat: pickLat,
                    pickupLon: pickLon,
                    deliveryLat: delLat,
                    deliveryLon: delLon
                });
                let orderModel, newOrder, locations = [];
                order.pickupLocationId ? locations.push(order.pickupLocationId) : null;
                order.deliveryLocationId ? locations.push(order.deliveryLocationId) : null;
                const lastOrderID = await this.lastOrderID();
                if (status) {
                    const serviceTime = order.serviceTime ? order.serviceTime : settings.data._doc.defaultServiceTime,
                    pieceCount = order.pieceCount ? order.pieceCount : 1,
                    pieceTime = order.pieceTime ? order.pieceTime : settings.data._doc.pieceTime;
                    orderModel = new Orders({
                        ID: lastOrderID+1,
                        // Load type
                        loadtype: order.loadtype ? order.loadtype : null,
                        user: userId,
                        // load_id: order.load_id,
                        depo: order.depoid ? order.depoid : null,
                        orderNumber: order.orderNumber ? order.orderNumber : null,

                        // Pickup
                        pickupCompanyName: order.pickupCompanyName,
                        pickupState: order.pickupState,
                        pickupStreetAddress: order.pickupStreetAddress,
                        pickupLocationtypeid: order.pickupLocationtype,
                        pickupLocationId: order.pickupLocationId,
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
                        pickupLon: pickLon,
                        pickupLat: pickLat,
                        // Delivery
                        deliveryCompanyName: order.deliveryCompanyName,
                        deliveryState: order.deliveryState,
                        deliveryStreetAddress: order.deliveryStreetAddress,
                        deliveryLocationtypeid: order.deliveryLocationtype,
                        deliveryLocationId: order.deliveryLocationId,
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
                        deliveryLon: delLon,
                        deliveryLat: delLat,

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
                        pieceCount: pieceCount,
                        mustbefirst: order.mustbefirst,
                        crossDock: order.crossDock,
                        orderTypes: orderTypes,
                        cube: cube ? cube : 0,
                        feet: feet ? feet : 0,
                        weight: weight ? weight : 0,
                        servicetime: order.serviceTime ? serviceTime : serviceTime + (pieceTime * pieceCount),
                        pieceTime: pieceTime,
                        specialneeds: specialneeds,
                        locations,
                        timeWindows: timeWindows,
                        proof: order.proof ? order.proof : null,
                    });
                }
                if (newStatus) {
                    let handlingUnits = await UploaderServiceClass.saveHandlingUnits({
                        req: data,
                        units: order.products,
                        orderId: orderModel._doc._id
                    });
                    let handlingIds = [];
                    for (const item of handlingUnits.handlingUnit) {
                        handlingIds.push(item.data._doc._id)
                    };
                    orderModel.products = handlingIds;
                    newOrder = await Orders.create(orderModel);
                }
                return this.getResponse(newStatus, message, newOrder._doc);
            }
        }
    };

    update = async (data) => {
        const errors = await this.orderErrorHandler.create(data.body);
        let newStatus = 1, message = "Successfully updated";
        let order = data.body;
        let userId = data.user._id;
        if (errors.error) {
            newStatus = 0;
            message = errors.msg
            return this.getResponse(newStatus, message);
        } else {
            let pickupAddr = `${order.pickupZip}+${order.pickupCity}+${order.pickupStreetAddress}+${order.pickupState}`;
            let pickup = `${order.pickupZip} ${order.pickupCity} ${order.pickupStreetAddress} ${order.pickupState}`;
            let deliveryAddr = `${order.deliveryZip}+${order.deliveryCity}+${order.deliveryStreetAddress}+${order.deliveryState}`;
            let delivery = `${order.deliveryZip} ${order.deliveryCity} ${order.deliveryStreetAddress} ${order.deliveryState}`;
            let LatLons = await OrderHelperClass.orderLatLon({
                pickupAddr,
                deliveryAddr
            })
            if (!LatLons.pickup || !LatLons.delivery) {
                return this.getResponse(0, "Wrong Address");
            } else {
                const [timeWindows, settings] = await Promise.all([
                    CheckServiceClass.newTimeWindow({
                        data: {
                            pickupdateFrom: order.pickupdateFrom,
                            pickupdateTo: order.pickupdateTo,
                            deliverydateFrom: order.deliverydateFrom,
                            deliverydateTo: order.deliverydateTo,
                            companyName: data.companyName
                        }
                    }),
                    SettingsServiceClass.getOne({
                        where: {},
                        userId
                    })
                ]);
                let { cube, feet, weight, quantity, orderTypes } = await OrderHelperClass.orderClac({products: order.products})
                let pickLat = LatLons.pickupLatLon.data.results[0].geometry.location.lat,
                pickLon = LatLons.pickupLatLon.data.results[0].geometry.location.lng,
                delLat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat,
                delLon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
                const { distDur, msg, status } = await WarningsClass.createOrder({
                    pickupLat: pickLat,
                    pickupLon: pickLon,
                    deliveryLat: delLat,
                    deliveryLon: delLon
                });
                let newOrder, locations = [];
                order.pickupLocationId ? locations.push(order.pickupLocationId) : null;
                order.deliveryLocationId ? locations.push(order.deliveryLocationId) : null;;
                if (status) {
                    const serviceTime = order.serviceTime ? order.serviceTime : settings.data._doc.defaultServiceTime,
                    pieceCount = order.pieceCount ? order.pieceCount : quantity ? quantity : 1,
                    pieceTime = order.pieceTime ? order.pieceTime : settings.data._doc.pieceTime;
                    newOrder = await Orders.findOneAndUpdate({
                        _id: order._id,
                    }, {
                        // Load type
                        loadtype: order.loadtype ? order.loadtype : null,
                        // load_id: order.load_id,
                        depo: order.depo ? order.depo : null,
                        orderNumber: order.orderNumber ? order.orderNumber : null,

                        // Pickup
                        pickupCompanyName: order.pickupCompanyName,
                        pickupState: order.pickupState,
                        pickupStreetAddress: order.pickupStreetAddress,
                        pickupLocationtypeid: order.pickupLocationtype,
                        pickupLocationId: order.pickupLocationId,
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
                        pickupLon: pickLon,
                        pickupLat: pickLat,
                        // Delivery
                        deliveryCompanyName: order.deliveryCompanyName,
                        deliveryState: order.deliveryState,
                        deliveryStreetAddress: order.deliveryStreetAddress,
                        deliveryLocationtypeid: order.deliveryLocationtype,
                        deliveryLocationId: order.deliveryLocationId,
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
                        deliveryLon: delLon,
                        deliveryLat: delLat,

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

                        //// Other
                        // servicetime: 900,
                        custDistance: status ? distDur.distance : 0,
                        custDuration: status ? distDur.duration : 0,
                        bh: order.bh,
                        delivery: `${delivery}, ${order.deliveryCountry}`,
                        pickup: `${pickup}, ${order.pickupCountry}`,
                        pieceCount: order.pieceCount ? order.pieceCount : quantity ? quantity : 0,
                        timeWindows: order.timeWindows,
                        mustbefirst: order.mustbefirst,
                        crossDock: order.crossDock,
                        orderTypes: orderTypes,
                        cube: cube ? cube : 0,
                        feet: feet ? feet : 0,
                        weight: weight ? weight : 0,
                        servicetime: order.serviceTime ? serviceTime : serviceTime + (pieceTime * pieceCount),
                        pieceTime: pieceTime,
                        locations,
                        timeWindows: timeWindows,
                        status: order.status ? order.status : null,
                        loadTempIds: order.loadTempIds,
                        loadIds: order.loadIds,
                        flowTypes: order.flowTypes,
                        timeInfo: order.timeInfo,
                        proof: order.proof ? order.proof : null
                    }, {new: true}).catch(err => {
                        if (err) {
                            newStatus = 0;
                            message = err.message;
                        }
                    });
                    if (newStatus) {
                        let handlingUnits = await UploaderServiceClass.saveHandlingUnits({
                            req: data,
                            units: order.products,
                            orderId: newOrder._doc._id
                        });
                        let handlingIds = [], specialneeds = [];
                        for (const item of handlingUnits.handlingUnit) {
                            handlingIds.push(item.data._doc._id)
                            specialneeds.push({
                                id: item.data._doc._id,
                                specialneeds: item.data._doc.specialneeds
                            });
                        }
                        newOrder = await Orders.findOneAndUpdate({_id: newOrder._doc._id}, {
                            products: handlingIds,
                            specialneeds
                        }, {new: true}).populate("products");
                    }
                    return this.getResponse(newStatus, message, newOrder._doc);
                }
            }
        }
    };

    delete = async (data) => {
        let newStatus = 1, message = "Successfully deleted!";
        let userId = data.user._id, { ids } = data.body, orders, handlingUnits, deleteHandlingUnits;
        let where = {
            _id: {
                $in: ids
            }
        };
        const getProductIds = await Orders.find(where).distinct("products");

        handlingUnits = await HandlingUnitServiceClass.getAllWithoutPagination({
            where: {
                _id: {
                    $in: getProductIds
                }
            }
        })
        for (const item of handlingUnits.data) {
            let imageIds = [];
            if (item.images && item.images.length) {
                for (const image of item.images) {
                    imageIds.push(image._id)
                }
            }
            await UploaderServiceClass.removeHandlingUnitImages(imageIds, item._id)
        }
        orders = await Orders.deleteMany({...where}).catch(err => {
            console.log(err);
            if (err) {
                newStatus = 0;
                message = err.message;
            }
        });

        deleteHandlingUnits = await HandlingUnitServiceClass.delete({
            _id: {
                $in: getProductIds
            }
        }).catch(err => {
            if (err) {
                newStatus = 0;
                message = err.message;
            }
        });
        return this.getResponse(newStatus, message, { orders, handlingUnits: deleteHandlingUnits.data })
    };

    upload = async (data) => {
        const uid = uuidv1();
        let fileArr = [], type = 2, info, newStatus = 1, message = "uploaded", logic;
        info = await GeneralHelperClass.getRemoteInfoForKey(data);
        let userId = data.user._id;
        if (!info) {
            console.log("fail on remote Info:");
            newStatus = 0;
            message = "fail on remote Info.";
            return this.getResponse(newStatus, message);
        }
        let { saveFields, timezone, depotId, fileHeaders, fileName } = data.body, depo, settings;
        depo = await DepoServiceClass.getOne({
            _id: depotId
        });
        // if (!depotId) {
        //     newStatus = 0;
        //     message = "depo is required";
        //     return this.getResponse(newStatus, message);
        // }
        settings = await SettingsServiceClass.getOne({
            where: {},
            userId
        });
        if (!settings.status) {
            newStatus = 0;
            message = "null settings.";
            return this.getResponse(newStatus, message);
        }
        if (saveFields != 0 && fileHeaders && userId) {
            await SettingsServiceClass.update({
                body: { fileHeaders: JSON.parse(fileHeaders) },
                user: data.user
            })
        }
        await UploadServiceClass.create({
            UUID: uid,
            user: userId
        });
        logic = await LogicServiceClass.UploadCaravan({
            data: JSON.parse(data.body.changedFile),
            info: {
                uuid: uid,
                userId: userId,
                fileName,
                serviceTime: settings.data._doc.defaultServiceTime,
                pieceTime: settings.data._doc.pieceTime,
                userType: settings.data._doc.userType,
                companyName: data.companyName
            },
            timezone,
            depo: depo && depo.status ? depo.data._doc : null,
            fileHeaders,
            req: data
        }).catch(err => {
            newStatus = 0;
            message = err.message;
        });
        console.log("Upload: ", newStatus, message);
        let { orderArr, errorArr } = logic.data;
        // createOrders = await Promise.all([this.createForUpload(orderArr, errorArr)]);
        let createOrders = await this.createForUpload(orderArr, errorArr);
        let upload = await UploadServiceClass.edit({
            UUID: uid,
            status: 2,
            failed: createOrders.data.errorArr,
            FileName: fileName,
            userId,
            orderCount: createOrders.data.orderArr.length
        }).catch(err => {
            console.log(err);
        });
        // console.log("createOrders", createOrders);
        if (createOrders.status) {
            newStatus = createOrders.status;
            message = `${createOrders.msg}, failed ${createOrders.data.errorArr.length} Order!!`
        } else {
            message = createOrders.msg;
            newStatus = createOrders.status;
        }
        return this.getResponse(newStatus, message, {
            UUID: uid,
            Errors: createOrders.data.errorArr
        });
    };

    uploadNew = async (data) => {
        const uid = uuidv1();
        let fileArr = [], type = 2, info, newStatus = 1, message = "uploaded", logic;
        info = await GeneralHelperClass.getRemoteInfoForKey(data);
        let userId = data.user._id;
        if (!info) {
            console.log("fail on remote Info:");
            newStatus = 0;
            message = "fail on remote Info.";
            return this.getResponse(newStatus, message);
        }
        let { saveFields, timezone, depotId, fileHeaders, fileName } = data.body;
        const [depo, settings] = await Promise.all([
            DepoServiceClass.getOne({
                _id: depotId
            }),
            SettingsServiceClass.getOne({
                where: {},
                userId
            })
        ]);
        if (saveFields != 0 && fileHeaders && userId) {
            SettingsServiceClass.update({
                body: { fileHeaders: JSON.parse(fileHeaders) },
                user: data.user
            })
        }
        UploadServiceClass.create({
            UUID: uid,
            user: userId
        });
        const lastOrderID = await this.lastOrderID();
        logic = await LogicServiceClass.UploadCaravanNew({
            data: JSON.parse(data.body.changedFile),
            info: {
                uuid: uid,
                userId: userId,
                fileName,
                serviceTime: settings.data._doc.defaultServiceTime,
                pieceTime: settings.data._doc.pieceTime,
                userType: settings.data._doc.userType,
                companyName: data.companyName
            },
            timezone,
            depo: depo && depo.status ? depo.data._doc : null,
            fileHeaders,
            req: data,
            lastOrderID
        }).catch(err => {
            newStatus = 0;
            message = err.message;
        });
        const { orderArr, productArr, errorArr } = logic.data;
        const { status, msg } = logic;
        console.log("logic");
        Orders.create(orderArr);
        ProductModel.create(productArr);
        UploadServiceClass.edit({
            UUID: uid,
            status: 2,
            failed: errorArr,
            FileName: fileName,
            userId,
            orderCount: orderArr.length
        }).catch(err => {
            console.log(err);
        });
        if (status) {
            newStatus = status;
            message = `${msg}, failed ${errorArr.length} Order!!`
        } else {
            message = msg;
            newStatus = status;
        }
        return this.getResponse(newStatus, message, {
            UUID: uid,
            Errors: errorArr
        });
    }
    uploadByApiKey = async (req) => {
        const uuid = uuidv1();
        let { data, fileName, dataType } = req.body;
        let { user, companyName } = req;
        let userId = user._id, settings, logic, newStatus = 1, message = "uploaded";
        const fileHeaders = map;
        settings = await SettingsServiceClass.getOne({
            where: {},
            userId
        });
        await UploadServiceClass.create({
            UUID: uuid,
            user: userId
        });
        const lastOrderID = await this.lastOrderID();
        logic = await LogicServiceClass.UploadCaravanNew({
            data: dataType == "json" ? data : JSON.parse(data),
            info: {
                uuid,
                userId,
                fileName,
                serviceTime: settings.data._doc.defaultServiceTime,
                pieceTime: settings.data._doc.pieceTime,
                userType: settings.data._doc.userType,
                companyName
            },
            timezone: settings.data._doc.userSpecifiedTimezone,
            fileHeaders,
            req: {
                user
            },
            lastOrderID
        }).catch(err => {
            newStatus = 0;
            message = err.message;
        });
        const { orderArr, productArr, errorArr } = logic.data;
        const { status, msg } = logic;
        console.log("logic");
        Orders.create(orderArr);
        ProductModel.create(productArr);
        // let { orderArr, errorArr } = logic.data;
        // let createOrders = await this.createForUpload(orderArr, errorArr);
        UploadServiceClass.edit({
            UUID: uuid,
            status: 2,
            failed: errorArr,
            FileName: fileName,
            userId,
            orderCount: orderArr.length
        }).catch(err => {
            console.log(err.message);
        });
        if (status) {
            newStatus = status;
            message = `${msg}, failed ${errorArr.length} Order!!`
        } else {
            message = msg;
            newStatus = status;
        }
        return this.getResponse(newStatus, message, {
            UUID: uuid,
            Errors: errorArr
        });
    }

    createForUpload = async (data, errorArr) => {
        let newOrder, orderArr = [], status = 1, message = "";
        for (const order of data) {
            newOrder = await this.create(order).catch(err => {
                if (err) {
                    console.log(`createForUpload Error: ${err.message}`);
                    status = 0;
                    message = err.message;
                }
            });
            if (newOrder.status) {
                orderArr.push(newOrder.data._id)
            } else {
                errorArr.push({
                    status: 0,
                    msgs: newOrder.msg,
                    ProbillNo: order.body.pro,
                    OrderNo: order.body.orderNumber
                })
            }
        }
        return this.getResponse(1, `Created ${orderArr.length} Order`, {orderArr, errorArr})
    };

    summOrderServicetime = async (data) => {
        const ids = data.ids.map(item => new ObjectID(item));
        const filter = {
            statusInternal: 1
        };
        let summServiceTime = await Orders.aggregate([
            {
                $match: {
                  _id: { $in: ids }
                }
            },
            {
                $project: {
                    "_id": 1,
                    "servicetime": 1
                }
            },
            {
                $group: {
                    _id: '$_id',
                    count: { '$sum': '$servicetime' },
                }
            },
            {
                $project: {
                    _id: '$_id',
                    count: 1,
                }
            }
        ]);
        // .match({ _id: { $in: ids } })
        let count = 0;
        summServiceTime.forEach(x => count += x.count);
        return this.getResponse(1, "Summ", { data: summServiceTime, count  })
    };

    deleteOrdersInPlanning = async (data) => {

    };

    unplannedOrdersInPlanning = async (data, load = null) => {
        let { loadArr } = data;
        let orderArr = [], OIds, flowTypeArr, info, pickupInfo, isPlanOrders;
        for (const item of loadArr) {
            isPlanOrders = await Orders.find({
                _id: { $in: item.orderIds }
            });
            let obj;
            for (let order of isPlanOrders) {
                obj = {};
                orderArr = load ? order._doc.loadIds : order._doc.loadTempIds;
                info = order._doc.timeInfo;
                pickupInfo = order._doc.pickupTimeInfo;
                flowTypeArr = order._doc.flowTypes;
                orderArr = orderArr && orderArr.length > 0 ? orderArr.filter(id => {
                    return id.toString() !== item._id.toString()
                }) : [];
                // let index = orderArr.indexOf(item._id);
                // if (index > -1) {
                //     orderArr.splice(index, 1);
                // }
                if (load) {
                    delete info.loads[item._id];
                    let loadIndex = [], pickupLoadIndex = [];
                    if (pickupInfo && pickupInfo.loads) {
                        delete pickupInfo.loads[item._id];
                        for (const loadItem of pickupInfo.loadsArr) {
                            if (loadItem._id != item._id) {
                                pickupLoadIndex.push(loadItem);
                            }
                        }
                        pickupInfo.loadsArr = pickupLoadIndex;
                    }
                    for (const loadItem of info.loadsArr) {
                        if (loadItem._id != item._id) {
                            loadIndex.push(loadItem);
                        }
                    }
                    info.loadsArr = loadIndex;
                    let flowIndex = flowTypeArr.indexOf(item.flowType);
                    if (flowIndex > -1) {
                        flowTypeArr.splice(flowIndex, 1);
                    }

                    obj = {
                        loadIds: orderArr,
                        flowTypes: flowTypeArr,
                        timeInfo: info,
                        pickupTimeInfo: pickupInfo,
                        status: 0,
                        confirmed: 0,
                        // isPlanned: 0
                    };
                } else {
                    if (info && info.loadTemps) {
                        delete info.loadTemps[item._id.toString()]
                    };
                    if (pickupInfo && pickupInfo.loadTemps) {
                        delete pickupInfo.loadTemps[item._id.toString()]
                    };
                    obj = {
                        loadTempIds: orderArr,
                        timeInfo: info,
                        pickupTimeInfo: pickupInfo,
                    };
                }
                await Orders.findByIdAndUpdate(order._doc._id, obj);
            }
        }
        return this.getResponse(1, "Success");
    };

    bulkEdit = async (data) => {
        const { depotId, orderIds, crossDock, loadtype, mustbefirst } = data.body;
        let timeWindow = {}, timeStatus = 0;
        for (const item in data.body) {
            if (item == "deliverydateFrom" && data.body[item]) {
                timeWindow[item] = data.body[item];
                timeStatus = 1;
            }
            if (item == "deliverydateTo" && data.body[item]) {
                timeWindow[item] = data.body[item];
                timeStatus = 1;
            }
            if (item == "pickupdateFrom" && data.body[item]) {
                timeWindow[item] = data.body[item];
                timeStatus = 1;
            }
            if (item == "pickupdateTo" && data.body[item]) {
                timeWindow[item] = data.body[item];
                timeStatus = 1;
            }
        };
        let cross = crossDock == 1 || crossDock == 0 ? {
            crossDock: +crossDock
        } : {};

        let transportType, tType = {};
        if (loadtype) {
            transportType = await transportTypeModel.findById(loadtype);
            if (transportType) {
                tType = {
                    loadtype: transportType._doc._id
                }
            }
        }
        let errorStatus;
        errorStatus = await OrderHelperClass.checkErrors({ depotId, orderIds });
        if (!errorStatus) {
            return this.getResponse(errorStatus, "Invalid data");
        };

        const orderBulkeditBodyType = {
            pickup: 0,
            delivery: 1
        };

        let depo = depotId ? await DepoServiceClass.getById({ params: { id: depotId } }) : null;
        let updateDepot = {}, updateMustBeFirst = {};
        if (depotId && depo && depo.status) {
            updateDepot = {
                depo: depo.data._doc._id,
            };
        } else if(depotId == 0) {
            updateDepot = {
                depo: null,
            };
        };
        if(mustbefirst) {
            updateMustBeFirst = {
                mustbefirst: 1
            };
        } else if(mustbefirst === false) {
            updateMustBeFirst = {
                mustbefirst: 0
            };
        }
        let updateData = {
            ...updateDepot,
            ...timeWindow,
            ...cross,
            ...tType,
            ...updateMustBeFirst
        };
        await Orders.updateMany({
            _id: {$in: orderIds}
        }, updateData);
        if (timeStatus) {
            OrderHelperClass.changeTimeWindows({orderIds});
        }
        return this.getResponse(1, "ok");
    };

    getAutoPlanCount = async (data) => {
        let { body } = data;
        let { filters, params } = body;
        let pagination = await this.pagination.sortAndPagination(params), filterWhere;
        let { limit, offset, order } = pagination;
        let where = {
            ...filters,
            ...params
        };
        let whereObj;
        if (where.depoid && where.depoid == where.depotId) {
            delete where.depotId;
        } else if (where.depoid && where.depoid != where.depotId) {
            return this.getResponse(1, "filter error", { count: 0 })
        } else if (!where.depoid && where.depotId) {
            where["$or"] = [{ depo: where.depotId }, { depo: null }];
            delete where.depotId;
        }
        if (!filters && where.date) {
            let start = where.date;
            let end = start ? moment(start).add(23.9999, "h").toISOString() : null;

            if (where.flowType && where.flowType == "1") {
                where.pickupdateFrom = {
                    $gte: start
                };
                where.pickupdateTo = {
                    $lte: end
                };
            }
            if (where.flowType && where.flowType == "2") {
                where.deliverydateFrom = {
                    $gte: start
                };
                where.deliverydateTo = {
                    $lte: end
                };
            }
            delete where.date;
            delete where.flowType;
            whereObj = where;
        } else {
            delete where.date;
            delete where.flowType;
            filterWhere = await this.fillters.orderFilter(where);
            if (!filterWhere.bool) {
                return this.getResponse(1, "filter error", { count: 0 })
            }
            whereObj = filterWhere.where;
        }
        const orders = await Orders.countDocuments(whereObj).limit(limit);
        let count = limit < orders ? limit : orders;
        return this.getResponse(1, "Success", { count })
    }

    updateForCalc = async (data) => {
        let { _id } = data;
        let message = "ok", statusCode = 1;
        let order = await Orders.findByIdAndUpdate(_id, data, {new: true}).catch(err => {
            if (err) {
                message = err.message;
                statusCode = 0
            }
        });
        return this.getResponse(statusCode, message, order)
    };

    changeOnWayStatus = async (data) => {
        let resStatus = 1, message = "Success";
        let nowDate = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
        let { timezone } = data.headers, { id } = data.params,
        { orders, statusId, loadId, ata, durations } = data.body, ataId;
        const status = await StatusesSchema.findById(statusId);
        let statusName = status.get("name");
        if (ata){
            ata = nowDate;
            ataId = ata.orderid
        };
        ata = statusName == "no status" || statusName == "In Transit" ? null : nowDate;

        const load = await PlanningSchema.findById(loadId);
        let orderETA = [];
        let ords = [];
        orders.map((item) => {
            ords.push(item._id.toString());
        })
        if (!ords.includes(id)) {
            resStatus = 0;
            message = `load ${loadId} not include order by id ${id}`
        }
        let stopLocations = load.get("stopLocations");
        if (stopLocations) {
            for (const [i, el] of stopLocations.entries()) {
                if (el.type.type == "order" && el.type.orders.includes(id)) {
                    for (const item of el.type.datas) {
                        if (item._id == id) {
                            item.statusId = status._id;
                            item.statusColor = status.color;
                            item.statusName = status.name;
                            item.timeInfo.loads[loadId].ata = statusName == "no status" || statusName == "In Transit" ? null : ata;
                            for (const load of item.timeInfo.loadsArr) {
                                if (load.id == loadId) {
                                    load.ata = statusName == "no status" || statusName == "In Transit" ? null : ata;
                                }
                            }
                            if(item.pickupTimeInfo && item.pickupTimeInfo.loads && item.pickupTimeInfo.loads[loadId]) {
                                item.pickupTimeInfo.loads[loadId].ata = statusName == "no status" || statusName == "In Transit" ? null : ata;
                            }
                            if (!durations) {
                                const updateBody = {
                                    status: statusId,
                                    timeInfo: item.timeInfo,
                                    pickupTimeInfo: item.pickupTimeInfo,
                                };
                                if (statusName !== "Delivered") updateBody.proof = null;
                                Orders.updateOne({ _id: item._id}, updateBody);
                            }

                        }
                    }
                }
            }
        }
        data.planningId = loadId;
        return this.getResponse(resStatus, message, orders)
    }

    updateTest = async (data) => {
        let { ids } = data.body;
        let orders = await Orders.updateMany({}, {
            depo: null
        })
        return this.getResponse(1, "Ok", orders)
    };

    resetModel = async () => {
        const orders = new Orders()
        orders.resetCount((err, nextCount) => {
            console.log(err);
            console.log(nextCount);
        })
        return this.getResponse(1, "Ok", orders)
    }
};

module.exports = OrderService;

