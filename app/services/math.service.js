const moment = require("moment");
const uuidv1 = require("uuid/v1");
const generate = require('project-name-generator');
const dateFormat = require('dateformat');
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const BaseService = require("../main_classes/base.service");
const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper();

const SettingsService = require("./settings.service");
const SettingsServiceClass = new SettingsService();
const DriverService = require("./driver.service");
const DriverServiceClass = new DriverService();
const OrderService = require("./order.service");
const OrderServiceClass = new OrderService();
const JobService = require("./job.service");
const JobServiceClass = new JobService();
const AlgorithmService = require("./algorithm.service");
const AlgorithmServiceClass = new AlgorithmService();
const NotificationService = require("./notifications.service");
const NotificationServiceClass = new NotificationService();

const DriverHelper = require("../helpers/driverHelpers");
const DriverHelperClass = new DriverHelper();
const OrderHelper = require("../helpers/orderHelpers");
const shifts = require("../newModels/shiftModel");
const depos = require("../newModels/depoModel");
const OrderHelperClass = new OrderHelper();

const constants = require('../constants/socket');
class MathService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }
    defaultStartDate = "1800-01-01T00:00:00.000Z";
    execute = async (data) => {
        let { endPoint, errorServerEndPoint } =  await GeneralHelperClass.getRemoteInfoForKey(data);
        let uid = uuidv1(), settings;
        let status = 1, message = "Success";
        settings = await SettingsServiceClass.getOne({ userId: data.user._id, where: {} })
        let {
            filters, depotId, loadStartTime, maxCount, timeLimit,
            selectedOrders, flowType, cluster, loadMinimize,
            fixedDriverCalc, firstStopCalc, Balanced, zoneGrouping,
            minNodesInCluster, deliverAsap, manualStartTime, shiftId, date,
            noTimeWindow, maxStop, equipments, assignDrivers, timeOptimization, timeRange, waitingTime } = data.body, { timezone, host } = data.headers, dateForm = moment(date)._i;
        let dreturn  = data.body.return, drivers, activeDrivers;
        if (flowType == 3) {
            depotId = null;
            // date
            // depotId
            // dreturn = null;
            // assignDrivers
            // zoneGrouping
            // Balanced
            // fixedDriverCalc
            // cluster
            // firstStopCalc
            // manualStartTime
        }
        if (noTimeWindow && !loadStartTime && flowType == 3) {
            return this.getResponse(0, "LoadStartTime is required!")
        }
        if (fixedDriverCalc) {
            drivers = await DriverServiceClass.getAllWithoutPagination({
                query: {
                    status: 1
                }
            })
            activeDrivers = await DriverHelperClass.getActiveDrivers({generalStartTime, drivers});
        }
        let isselected = false;
        let isfilters = false;
        if(filters)
            isfilters = true;

        if(selectedOrders.length > 0 ){
            isselected = true;
            if(selectedOrders.length < 3){
                status = 0;
                message = "the selected orders are less then 3";
                return this.getResponse(status, message);
            }
        }
        if(!maxStop){ maxStop = Number.MAX_VALUE;}
        const params = {
            priorityCalc: false,
            singleRouteCalc: false,
            dryRun: false,
            seqMode: false,
            loadMinimize: loadMinimize == 1 ? true : false,
            fixedDriverCalc: fixedDriverCalc == 1 ? true : false,
            date: date ? date : this.defaultStartDate,
            loadStartTime: loadStartTime ? loadStartTime : this.defaultStartDate,
            depoId: depotId ? depotId : null,
            flowType: flowType,
            maxStops: maxStop,
            timeLimit: timeLimit,
            selectedOrders: selectedOrders,
            oVRP: dreturn,
            shiftId: shiftId,
            cubeCalc: true,
            deliveryCalc: flowType == 2 ? true: false,
            DPC: 0, // -
            DurationMultiplier: !settings.data._doc.durationMultiplier ? 1.0 : settings.data._doc.durationMultiplier,
            IterationMultiplier: !settings.data._doc.IterationMultiplier ? 1.0 : settings.data._doc.IterationMultiplier,
            firstStopCalc: firstStopCalc ? true : false,
            Balanced: Balanced ? true : false,
            zoneGrouping: zoneGrouping ? true : false,
            noTimeWindow: noTimeWindow ? true : false,
            minNodesInCluster: +minNodesInCluster > 0 ? +minNodesInCluster : 7,
            deliverAsap: deliverAsap ? true : false,
            manualStartTime: manualStartTime ? true : false,
            timeOptimization: timeOptimization ? true : false,
            timeRange: timeRange,
            waitingTime: waitingTime,
            ftl: false
        };
        // if(filters != undefined){
        //     delete filters.deliverydateFrom;
        //     delete filters.pickupdateFrom;
        // }
        let ordersWhere = {};
        if(!isselected){
            ordersWhere = {
                flowType: flowType,
                isPlanned: 0,
            };
        }else{
            ordersWhere = {
                ids: selectedOrders,
            };
        }
        if(filters){
            if(!isselected){
                for (const item in filters) {
                    if(filters[item] != undefined) {
                        if (item != 'flowType' && item != "depotId") {
                            ordersWhere[item] = filters[item];
                        }

                    }
                }
            }
        }
        depotId && !isselected ? ordersWhere["depotId"] = depotId : null;
        let filterWhere = await OrderHelperClass.fixFillterForAlgo(ordersWhere, isselected, isfilters)
        // const OrdersByAttr = await OrderServiceClass.getAllByAttr({
        //     body: {
        //         ...filterWhere.where,
        //         limit: maxCount,
        //         orderBy: "pickupdateFrom",
        //         order: "asc"
        //     },
        //     user: data.user
        // }, filterWhere.status, "pickupdateFrom");
        // const minDate = moment(Math.min.apply(null,OrdersByAttr.data.orders)).format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
        // console.log(minDate);
        // console.log(OrdersByAttr.data.orders);
        const Orders = await OrderServiceClass.getAll({
            body: {
                ...filterWhere.where,
                limit: maxCount
            },
            user: data.user
        }, filterWhere.status)

        const OrderArr = await OrderHelperClass.sendAlgoOrders({
            orders: Orders.data.orders,
            noTimeWindow,
            flowType
        });
        const shift = await shifts.findById(shiftId);
        let obj;
        if (shift) {
            const depo = depotId ? await depos.findById(depotId).select("lat lon")  :null;
            obj = {
                "execid": uid,
                "PostServer":endPoint,
                "ErrorServer": errorServerEndPoint,
                "params": params,
                "depo": depo ? depo._doc : null,
                "host": host,
                "shift": shift._doc,
                "equipment": equipments,
                "Orders": OrderArr,
                "MapServer": `${env.mapHost}${env.mapPort}/table/v1/driving/`,
                "Returnees": JSON.stringify({
                    timezone,
                    manualStartTime: manualStartTime ? 1 : 0,
                    user: data.user,
                    loadType: "LTL"
                })
            };
            const name = generate().dashed;

            const now = new Date();
            const jobDate = dateFormat(now, "dd-mm-yyyy");
            const jobName = `${name}-${jobDate}`;
            const job = await JobServiceClass.create({
                name: jobName,
                UUID: uid,
                params: {
                    ...params,
                    assignDrivers
                },
            });
            let engine, message = "", status = 1, responseData, warning = false;
            if (job.status) {
                engine = flowType == 3 ? await AlgorithmServiceClass.sendReqToEnginePDP(obj,cluster) : await AlgorithmServiceClass.sendReqToEngine(obj,cluster);
                if (engine && engine.data.Data == 'Started.') {

                    const startJob =  await JobServiceClass.edit({
                        status: [0]
                    }, uid);
                    let ETA;
                    // ETA = await AlgorithmServiceClass.getStatusAutoplan(uid);
                    // message = 'Started.';
                    responseData = {
                        data: engine.data,
                        job: startJob.data._doc,
                        jobId: job.data._doc._id
                    }
                } else if(engine.data && !engine.data.Data) {
                    const failJob = await JobServiceClass.edit({
                        status: [2]
                    }, uid);
                    message = engine.data.Message;
                    responseData = {
                        status: false,
                        msg: engine.data.Message,
                        jobId: job.id,
                        data: engine.data
                    };
                    status = 0;
                } else {
                    await JobServiceClass.edit({
                        status: [3]
                    }, uid);
                    message = engine.data.Data;
                    responseData = {
                        status: false,
                        msg: engine.data.Data,
                        jobId: job.id,
                        data: engine.data
                    };
                    status = 0;
                }
                return this.getResponse(status, message, responseData)
            }
        }
    };

    executeFTL = async (data) => {
        let { endPoint, errorServerEndPoint } =  await GeneralHelperClass.getRemoteInfoForKey(data);
        let uid = uuidv1(), settings;
        let status = 1, message = "Success";
        settings = await SettingsServiceClass.getOne({ userId: data.user._id, where: {} })
        let {
            filters, depotId, maxCount, timeLimit, manualStartTime,
            selectedOrders, flowType, shiftId, noTimeWindow, maxStop,
            timeOptimization, timeRange, waitingTime, depotType, equipmentCount, loadStartTime } = data.body, { timezone, host } = data.headers;
        let dreturn  = data.body.return;
        // if ((noTimeWindow && !loadStartTime) || (!noTimeWindow && depotId && depotType == 0 && !loadStartTime)) {
        //     return this.getResponse(0, "LoadStartTime is required!")
        // }
        // if (fixedDriverCalc) {
        //     drivers = await DriverServiceClass.getAllWithoutPagination({
        //         query: {
        //             status: 1
        //         }
        //     })
        //     activeDrivers = await DriverHelperClass.getActiveDrivers({loadStartTime, drivers});
        // }
        let isselected = false;
        let isfilters = false;
        if(filters)
            isfilters = true;

        if(selectedOrders.length > 0 ){
            isselected = true;
            if(selectedOrders.length < 3){
                status = 0;
                message = "the selected orders are less then 3";
                return this.getResponse(status, message);
            }
        }
        if(!maxStop){ maxStop = Number.MAX_VALUE;}
        const equipments = [
            {
                "carCount": equipmentCount,
                "feet": 1000000,
                "weight": 1000000,
                "cube": 1000000
            }
        ];
        const params = {
            priorityCalc: false,
            singleRouteCalc: false,
            dryRun: false,
            seqMode: false,
            date: this.defaultStartDate,
            loadStartTime: loadStartTime ? loadStartTime : this.defaultStartDate,
            depoId: depotId ? depotId : null,
            flowType: 3,
            maxStops: maxStop,
            timeLimit: timeLimit,
            selectedOrders: selectedOrders,
            oVRP: dreturn,
            shiftId: shiftId,
            cubeCalc: true,
            deliveryCalc: false,
            DPC: 0, // -
            DurationMultiplier: !settings.data._doc.durationMultiplier ? 1.0 : settings.data._doc.durationMultiplier,
            IterationMultiplier: !settings.data._doc.IterationMultiplier ? 1.0 : settings.data._doc.IterationMultiplier,
            manualStartTime: manualStartTime ? true : false,
            noTimeWindow: noTimeWindow ? true : false,
            timeOptimization: timeOptimization ? true : false,
            timeRange: timeRange,
            waitingTime: waitingTime,
            ftl: true,
            DeliveryDepo: depotType ? true : false
        };
        // if(filters != undefined){
        //     delete filters.deliverydateFrom;
        //     delete filters.pickupdateFrom;
        // }
        let ordersWhere = {};
        if(!isselected){
            ordersWhere = {
                flowType: 3,
                isPlanned: 0,
            };
        }else{
            ordersWhere = {
                ids: selectedOrders,
            };
        }
        if(filters){
            if(!isselected){
                for (const item in filters) {
                    if(filters[item] != undefined) {
                        if (item != 'flowType' && item != "depotId") {
                            ordersWhere[item] = filters[item];
                        }

                    }
                }
            }
        }
        depotId ? ordersWhere["depotId"] = depotId : null;
        let filterWhere = await OrderHelperClass.fixFillterForAlgoTL(ordersWhere, isselected, isfilters)
        const Orders = await OrderServiceClass.getAll({
            body: {
                ...filterWhere.where,
                limit: maxCount
            },
            user: data.user
        }, filterWhere.status)

        const OrderArr = await OrderHelperClass.sendAlgoOrders({
            orders: Orders.data.orders,
            noTimeWindow,
            flowType: 3
        });
        const shift = await shifts.findById(shiftId);
        let obj;
        if (shift) {
            const depo = depotId ? await depos.findById(depotId).select("lat lon") : null;
            obj = {
                "execid": uid,
                "PostServer":endPoint,
                "ErrorServer": errorServerEndPoint,
                "params": params,
                "depo": depo ?  depo._doc : null,
                "host": host,
                "shift": shift._doc,
                "equipment": equipments,
                "Orders": OrderArr,
                "MapServer": `${env.mapHost}${env.mapPort}/table/v1/driving/`,
                "Returnees": JSON.stringify({
                    timezone,
                    manualStartTime: 1,
                    user: data.user,
                    loadType: "TL",
                    depotType: depotType
                })
            };
            const name = generate().dashed;

            const now = new Date();
            const jobDate = dateFormat(now, "dd-mm-yyyy");
            const jobName = `${name}-${jobDate}`;
            const job = await JobServiceClass.create({
                name: jobName,
                UUID: uid,
                params: {
                    ...params,
                    assignDrivers: 0
                },
            });
            let engine, message = "", status = 1, responseData, warning = false;
            if (job.status) {
                engine = await AlgorithmServiceClass.sendReqToEnginePDPFTL(obj);
                if (engine && engine.data.Data == 'Started.') {

                    const startJob =  await JobServiceClass.edit({
                        status: [0]
                    }, uid);
                    message = 'Started.';
                    responseData = {
                        data: engine.data,
                        job: startJob.data._doc,
                        jobId: job.data._doc._id                    }
                } else if(engine.data && !engine.data.Data) {
                    const failJob = await JobServiceClass.edit({
                        status: [2]
                    }, uid);
                    message = engine.data.Message;
                    responseData = {
                        status: false,
                        msg: engine.data.Message,
                        jobId: job.id,
                        data: engine.data
                    };
                    status = 0;
                } else {
                    console.log(`Algo fail: ${engine.data.Data}`);
                    await JobServiceClass.edit({
                        status: [3]
                    }, uid);
                    message = "AutoPlan Fail";
                    responseData = {
                        status: false,
                        msg: "AutoPlan Fail",
                        jobId: job.id,
                        data: engine.data
                    };
                    status = 0;
                }
            }
            return this.getResponse(status, message, responseData)
        }
    };

    cancel = async (data) => {
        console.log("Cancel AutoPlan");
        const { uuid } = data.body, { host } = data.headers;
        let status = 1, message = "Algo was running and canceled";
        const engine = await AlgorithmServiceClass.sendReqToEngineForCancel({uuid, host});
        if(!uuid) {
            status = 0;
            message = "UUID there isn't"
        }
        return this.getResponse(status, message, engine.data)
    };

    handleError = async (body) => {
        console.log("Post Error Server");
        const { UUID, Message, Returnees } = body;
        let status = 0, newMessage;
        const socket = require("../../server");
        const returnees = JSON.parse(Returnees);
        let { user, sequence } = returnees;
        if (!UUID) return this.getResponse(0, 'UUID is required', null);

        let job = await JobServiceClass.getOne({UUID});

        if (job.status) {
            job.data._doc.status = [3];
            job.data._doc.errorMessage = newMessage;
            JobServiceClass.save(job.data._doc);
        }
        newMessage = Message
        const datas = {
            title: "Algorithm Error",
            content: newMessage,
            type: 1,
            user: user ? user._id : null
        };
        const pushNotification = await NotificationServiceClass.create(datas);
        const {sequenceNotification, algoNotification} = constants.socketHandler;
        await socket.sendNotificationToUser(sequence ? sequenceNotification : algoNotification, user._id, pushNotification);

        return this.getResponse(1, 'OK');
    };
};

module.exports = MathService;