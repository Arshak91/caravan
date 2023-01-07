const moment = require("moment");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const Planning = require("../newModels/planningModel");
const BaseService = require("../main_classes/base.service");
const DriverService = require("./driver.service");
const DriverServiceClass = new DriverService();
const OrderService = require("./order.service");
const OrderServiceClass = new OrderService();
const DepoService = require("./depo.service");
const DepoServiceClass = new DepoService();
const EquipmentService = require("./equipment.service");
const EquipmentServiceClass = new EquipmentService();
const ShiftService = require("./shift.service");
const ShiftServiceClass = new ShiftService();
const OSmapService = require("./osmap.service");
const OSmapServiceClass = new OSmapService();
const JobService = require("./job.service");
const JobServiceClass = new JobService();
const NotificationService = require("./notifications.service");
const NotificationServiceClass = new NotificationService();

const PlanningHelper = require("../helpers/planningHelper");
const PlanningHelperClass = new PlanningHelper();
const OrderHelper = require("../helpers/orderHelpers");
const OrderHelperClass = new OrderHelper();
const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper();

const PlanningErrors = require("../newErrors/loadBuildingErrors");
const PlanningErrorsClass = new PlanningErrors()
const Calculations = require("./calculation.service");
const CalculationsClass = new Calculations();
const OrderSchema = require('../newModels/ordersModel');
const DragAndDropHelperService = require('../services/draganddrop.service');
const AlgorithmService = require("./algorithm.service");

// Models
const AssetsSchema = require("../newModels/assetsModel");
const EquipmentSchema = require("../newModels/equipmentModel");
const DriverSchema = require("../newModels/driverModel");
const StatusesSchema = require("../newModels/statusesModel");
const TransportTypeSchema = require("../newModels/transportTypeModel");
const Job = require("../newModels/jobModel");
const DepotSchema = require("../newModels/depoModel");
const ShiftSchema = require("../newModels/shiftModel");
const SettingsSchema = require("../newModels/settingsModel");

// Constants
const constants = require('../constants/socket');
const FlowTypes = require("../newModels/flowtypeModel");

class PlanningService extends BaseService {
    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    flowType = {
        lp2d: 1,
        d2e: 2
    };

    getAll = async (data) => {
        let { body } = data;
        let plannings, status = 1, message = "Planning List", count;
        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.planningFilter(body)
        const { newWhere, filter } = fillter;
        if(!filter) {
            message = "filter incorrect";
            status = 0
        } else {
            let { limit, offset, order } = pagination;
            count = await Planning.countDocuments({...newWhere});
            plannings = await Planning.find({...newWhere}).populate("driver").populate("orders").populate(["depo", "loadType"]).sort(order).limit(limit).skip(offset).catch(err => {
                if (err) {
                    status = 0;
                    message = err.message;
                }
            });
        }
        return this.getResponse(status, message, {plannings, count});
    }
    getAllWitOutPagination = async (data, join) => {
        let { body } = data;
        let plannings, status = 1, message = "Planning List", count;
        let fillter = await this.fillters.planningFilter(body)
        count = await Planning.countDocuments({...fillter});
        plannings = !join ? await Planning.find({...fillter})
                : await Planning.find({...fillter}).populate("driver").populate("orders").populate("shift").populate("equipment").populate("depo");
        return this.getResponse(status, message, {plannings, count});
    };

    getByDriverAndById = async (data) => {
        let _id = data.params.id;
        let { user } = data;
        let planning, message = "Success", status = 1;
        planning = await Planning.findOne({
            _id,
            driver: user._id
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!planning) {
            status = 0;
            message = "such Planning doesn't exist!"
        }
        return this.getResponse(status, message, planning);
    };

    generateCalcResponse = async (data) => {
        let {
            flowType,
            loadId,
            user,
            settings,
            planning,
            newOrderIdsArr,
            host
        } = data, calcObj = {}, calculation;
        calculation = await CalculationsClass.calcByC({
            loads: planning,
            newOrderIdsArr,
            flowType,
            host,
            settings
        })
        calcObj = calculation.status ? {
            stopLocations: calculation.allStops,
            orders: calculation.orderIds ? calculation.orderIds : newOrderIdsArr,
            stops: calculation.stops ? calculation.stops : load.OrderIDs.length,
            status: calculation.statusId,
            warning: calculation.warning,
            warningData: calculation.warningsArr,
            totalDuration: calculation.totalDuration,
            Deadhead: calculation.Deadhead ? calculation.Deadhead : 0
        } : {};

        return calcObj;
    }

    create = async (body) => {
        const errors = await PlanningErrorsClass.manualLoadTempErrors(body);
        let { timezone, host } = body.headers;
        let planning, status = 1, message = "Successfully created";
        if (errors.error) {
            status = 0;
            message = errors.msg;
            return this.getResponse(status, message);
        } else {
            const data = body.body;
            let { user } = body;
            let { driverId, orders, depo, equipmentName, flowType, tl } = data;
            let loadType = tl ? "TL" : "LTL";
            const transportType = await TransportTypeSchema.findOne({
                name: loadType
            })
            let ret = data.return;
            const getDepotType = await PlanningHelperClass.getDepotTypeByFlowType({flowType, depotType: null});
            let cube = 0, weight = 0, feet = 0, feelRates = 0, permileRates = 0, pieceTotalQuantity = 0;
            // get Driver Depot  Equipment
            const [driver, depot, equipment, settings] = await Promise.all([
                DriverServiceClass.getOne({ _id: driverId }),
                DepoServiceClass.getOne({ _id: depo }),
                EquipmentServiceClass.getOne({ _id: equipmentName }),
                SettingsSchema.findOne({
                    user: user._id
                })
            ])
            // get Shift
            let shift = await ShiftServiceClass.getOne({_id: driver.data._doc.shift})

            const ordersArr = await OrderServiceClass.getAllWithoutPagination({
                body: {
                    id: orders
                },
                user
            })
            if (!ordersArr.data.orders.length) {
                return this.getResponse(0, "This orders not yours!!!");
            }
            let indexing = await GeneralHelperClass.indexingArr(orders.split(","));
            const sortOrders = await GeneralHelperClass.sortArray(indexing, ordersArr.data.orders)
            // console.log("body", data);
            // console.log("sortOrders", sortOrders);
            for (const item of sortOrders) {
                cube += item.cube*1;
                weight += item.weight*1;
                feet += item.feet*1;
                feelRates += item.rate;
                permileRates += item.permileRate;
                pieceTotalQuantity += item.pieceCount
            }

            let { start, end, endOrderAddress, startAddress } = await PlanningHelperClass.checkingByFlowType({
                sortOrders,
                depot,
                ret,
                flowType
            })

            const LatLon = await PlanningHelperClass.getLatLon({
                depot,
                flowType,
                ret
            }, sortOrders);
            let traficInfo = await OSmapServiceClass.GetDistDur(LatLon)
            if (!traficInfo.status) {
                return this.getResponse(0, traficInfo.msg);
            }
            if (!shift.status) {
                return this.getResponse(0, "Couldn't do manual plan. First add shift to the driver.");
            }
            const orderIds = typeof(data.orders) === 'string' ? data.orders.split(",") : data.orders;
            let planningModel = await PlanningHelperClass.generatePlanningModel({
                ...data,
                loadType: transportType._id,
                ordersCount: orderIds.length,
                ret,
                driver: driver ? driver.data._doc : null,
                depot,
                startAddress,
                endOrderAddress,
                cube,
                feet,
                weight,
                feelRates,
                permileRates,
                pieceTotalQuantity,
                planType: "Manual",
                start,
                end,
                carTypes: [equipment.data._doc],
                totalDistance: traficInfo.data.distance,
                depotType: getDepotType,
                user: user._id,
                shift: driver.data._doc.shift
            });

            planning = await Planning.create({
                ...planningModel,
            }).catch(err => {
                if (err) {
                    status = 0;
                    message = err.message;
                }
            });
            let newPlanning = await Planning.findById(planning._id).populate(["equipment", "shift", "depo"]);
            // Calculation
            let calculation = await CalculationsClass.calcByC({
                loads: newPlanning._doc,
                newOrderIdsArr: orderIds,
                flowType,
                host,
                settings
            });
            if (!calculation.status) {
                await Planning.findByIdAndDelete(planning._doc._id);
                console.log(`Algo timeCalculation: ${calculation.msg}`);
                return this.getResponse(0, "Planning not created from wrong stops");
            }
            planning = await PlanningHelperClass.changeForCalc({
                id: planning._doc._id,
                loadData: calculation
            }, flowType)
            planning = await Planning.findOneAndUpdate({
                _id: planning._doc._id
            },{
                stopLocations: calculation.allStops,
                orders: calculation.orderIds ? calculation.orderIds : orderIds,
                stops: calculation.stops ? calculation.stops : orderIds.length,
                status: calculation.statusId,
                busy: 0,
                warning: calculation.warning,
                warningData: calculation.warningsArr,
                totalDuration: calculation.totalDuration,
                Deadhead: calculation.Deadhead ? calculation.Deadhead : 0
            }, {new: true}).catch(err => {
                if (err) {
                    status = 0;
                    message = err.message;
                }
            });
            return this.getResponse(status, message, planning);
        }
    }
    update = async (req) => {
        let planning, status = 1, message = "Successfully updated";
        let { timezone, host } = req.headers, { user } = req;
        let { assetId, equipment, driverId, loadCost, startTime, endTime, nickname, editDriver, comment } = req.body;
        let loadId = req.params.id;
        const [eqAttrs, getPlanning, settings] = await Promise.all([
            PlanningHelperClass.getEquipmentAttributesForPlanning(),
            Planning.findById(loadId).populate(["depo", "shift", "equipment"]).populate({
                path: "orders",
                populate: "status"
            }),
            SettingsSchema.findOne({
                user: user._id
            })
        ]);
        let orderIds = [];
        getPlanning._doc.orders.forEach(order => {
            orderIds.push(order._id.toString())
        });
        const [compEquip, equip] = await Promise.all([
            assetId ? AssetsSchema.findById(assetId) : null,
            equipment ? EquipmentSchema.findById(equipment, eqAttrs) : null
        ])
        const carTypes = await PlanningHelperClass.generateCarTypes({
            compEquip, equip
        })
        const depot = getPlanning._doc.depo;
        let updateObj = {
            nickname: nickname,
            assets: assetId ? assetId : null,
            driver: driverId,
            equipment: equipment ? equipment : null,
            loadCost: loadCost,
            startTime: startTime,
            carTypes: [carTypes],
            endTime: endTime,
            comment
        };
        if (editDriver) {
            await DriverSchema.findByIdAndUpdate(driverId, {
                asset: assetId
            })
        }
        const ordersArr = await OrderServiceClass.getAllWithoutPagination({
            body: {
                id: orderIds.join(",")
            },
            user
        })
        let indexing = await GeneralHelperClass.indexingArr(orderIds)
        const sortOrders = await GeneralHelperClass.sortArray(indexing, ordersArr.data.orders)
        const LatLon = await PlanningHelperClass.getLatLon({
            depot,
            flowType: getPlanning._doc.flowType,
            ret: getPlanning._doc.return
        }, sortOrders);
        let traficInfo = await OSmapServiceClass.GetDistDur(LatLon)
        if (!traficInfo.status) {
            return this.getResponse(0, traficInfo.msg);
        }
        let shift = getPlanning._doc.shift;

        let calcResponseData = {
            traficInfo: traficInfo.data,
            shift: shift._doc,
            loadType: 1,
            loads: getPlanning._doc,
            timezone,
            sortOrders,
            flowType: getPlanning._doc.flowType,
            loadId: loadId,
            user,
            planning: {
                ...getPlanning._doc,
                equipment: equip
            },
            newOrderIdsArr: orderIds,
            host,
            settings: settings
        };
        let calculation = await this.generateCalcResponse(calcResponseData);

        planning = await Planning.findOneAndUpdate({_id: loadId}, {
            ...updateObj,
            ...calculation,
            $push: {
                changed: {
                    change: true,
                    user: {
                        id: user._id,
                        username: user.username
                    },
                    changeTime: new Date(Date.now()),
                    type: "edit"
                }
            }
        }, {new: true}).populate(["driver", "loadType"]).populate("orders").populate("depo").catch(err => {
            if (err) {
                status = 0;
                message = err.message;
            }
        });
        return this.getResponse(status, message, planning);
    }
    delete = async (where) => {
        let planning;
        planning = await Planning.deleteMany({...where});
        return this.getResponse(1, "Successfully deleted", planning);
    }

    dissolveMany = async (data) => {
        let { loadIds } = data.body, loadTemps;
        let status = 1, message = "planning(s) dissolved", loads;

        loadTemps = await Planning.find({
            _id: {$in: loadIds}
        }, "id orders UUID flowType").catch(err => {
            if (err) {
                status = 0;
                message = err.message
            }
        });
        if (loadTemps) {
            let loadArr = [];
            for (const loadTemp of loadTemps) {
                loadArr.push({
                    _id: loadTemp._doc._id,
                    orderIds: loadTemp._doc.orders,
                    flowType: loadTemp._doc.flowType
                });
            }
            let x =  await OrderServiceClass.unplannedOrdersInPlanning({
                loadArr
            });
            console.log(x);
            loads = await Planning.deleteMany({
                _id: {
                    $in: loadIds
                }
            }).catch(err => {
                if (err) {
                    status = 0;
                    message = err.message
                }
            });
        }
        return this.getResponse(status, message, loads);
    }

    unplanOrders = async (data, unPlan) => {
        let { user } = data, orders;
        let { host, timezone } = data.headers;
        let orderIds;
        if (unPlan) {
            orderIds = data.body.orderIds ? data.body.orderIds : JSON.parse(data.orderIds);
            orders = await OrderSchema.find({
                _id: {
                    $in: orderIds
                }
            });
        } else {
            orders = data.orders;
        }
        let planningIds = [];
        const DragDropHelper = new DragAndDropHelperService();
        for (const order of orders) {
            let loadTempIds = order._doc.loadTempIds,
                loadIds = order._doc.loadIds, info = order._doc.timeInfo;
            let orderEditData = {
                isPlanned: 0
            };
            if (loadTempIds && loadTempIds.length) {
                planningIds = planningIds.concat(order._doc.loadTempIds);
                for (const id of loadTempIds) {
                    delete info.loadTemps[id.toString()];
                    loadTempIds = loadTempIds.filter(item => {
                        return item.toString() == id.toString()
                    });
                    orderEditData = {
                        ...orderEditData,
                        info,
                        loadTempIds
                    };
                    const [planning, settings] = await Promise.all([
                        Planning.findById(id).populate("depo"),
                        SettingsSchema.findOne({
                            user: user._id
                        })
                    ]);
                    let remOrder;
                    let previousOrderIds = planning._doc.orders;
                    let newOrderIdsArr = planning ? planning._doc.orders.filter(ord => {
                        return ord != order._doc._id.toString();
                    }) : [], updatedPlanning;
                    remOrder = planning ? await DragDropHelper.removeOrderFromLoadTemp({
                        load: planning,
                        ordersIdsArr: newOrderIdsArr,
                        orders: [order],
                        user
                    }) : null;

                    if (remOrder && remOrder.status) {
                        let newLoadTemps;
                        if (!remOrder.delete) {
                            await Planning.findByIdAndUpdate(id, {
                                ...remOrder.updateObj
                            });
                        }
                        newLoadTemps = await DragDropHelper.calculationForLoadTemp({
                            arr: [id],
                            host,
                            settings
                        });
                        updatedPlanning = !remOrder.delete ? await PlanningHelperClass.changeForCalc({
                            id,
                            loadData: newLoadTemps.result[id.toString()]
                        }, planning.get("flowType")) : null;
                    }
                }
            }
            await OrderSchema.findByIdAndUpdate(order._doc._id, orderEditData);
        }
        return this.getResponse(1, "Success", {
            loadIds: planningIds,
            orderIds
        })
    };

    unPlanInPlanning = async (data) => {
        let { groupOrderIds, selectedLoads } = data.body, { user } = data, { timezone, host } = data.headers;
        let result = [], loadDeleted = [], removeOrders = [];
        for (const group of groupOrderIds) {
            const DragDropHelper = new DragAndDropHelperService();
            const [orders, planning, settings] = await Promise.all([
                OrderSchema.find({
                    _id: {
                        $in: group.orderIds
                    }
                }, OrderHelperClass.getOrderAttributes()).populate("locations").populate("loadtype").populate("depo").populate("products").populate("locations").populate("status"),
                Planning.findById(group.planningId).populate("depo"),
                SettingsSchema.findOne({
                    user: user._id
                })
            ]);
            let newOrderIdsArr = planning ? planning.get("orders").filter(ord => {
                return !group.orderIds.includes(ord.toString());
            }) : [], updatedPlanning;
            // remove Order from Load
            const remOrder = planning ? await DragDropHelper.removeOrderFromLoadTemp({
                load: planning,
                ordersIdsArr: newOrderIdsArr,
                orders: orders,
                user
            }) : null;
            removeOrders = removeOrders.concat(orders);
            loadDeleted = loadDeleted.concat(remOrder.deletedLoads);
            if (remOrder && remOrder.status) {
                let newLoadTemps;
                if (!remOrder.delete) {
                    await Planning.findByIdAndUpdate(group.planningId, {
                        ...remOrder.updateObj
                    });
                }
                newLoadTemps = await DragDropHelper.calculationForLoadTemp({
                    arr: [group.planningId], timezone, user, host, settings
                });
                updatedPlanning = !remOrder.delete ? await PlanningHelperClass.changeForCalc({
                    id: group.planningId,
                    loadData: newLoadTemps.result[group.planningId.toString()]
                }, planning.get("flowType")) : null;
                result.push({
                    status: 1,
                    msg: remOrder.msg,
                    delete: remOrder.delete ? remOrder.delete : false,
                });
            } else {
                result.push({
                    msg: remOrder.msg,
                    status: remOrder.status
                });
            }
        }
        let newPlannings = await this.getAllWitOutPagination({
            body: {
                ids: selectedLoads
            }
        }, true);

        return this.getResponse(1, "Success", {
            result,
            removeOrders,
            loadDeleted,
            selectedLoads: {
                data: newPlannings.data.plannings,
                total: newPlannings.data.count
            }
        })
    }

    updateOrdersPositionsInPlanning = async (data, timezone) => {
        const { planningId, idList } = data.body;
        const { host } = data.headers;
        const { user } = data;
        let resStatus = 1, message = "Success";
        let planning = await Planning.findById(planningId).populate(['depo', "equipment"]).populate('user').populate('shift').populate({
            path: "orders",
            populate: { path: "products" }
        });
        if (!planning) return this.getResponse(0, 'Wrong planning id');
        let indexing = await GeneralHelperClass.indexingArr(idList);

        const settings = await SettingsSchema.findOne({
            user: user._id
        });

        const calcModel = await CalculationsClass.calcByC({
            newOrderIdsArr: idList,
            loads: planning,
            flowType: planning.flowType,
            host,
            settings
        });
        planning = await PlanningHelperClass.changeForCalc({
            id: planning._doc._id,
            loadData: calcModel,
            changed: {
                changed: {
                    change: true,
                    user: {
                        id: user._id,
                        username: user.username
                    },
                    changeTime: new Date(Date.now()),
                    type: "updateOrdersPosition"
                }
            }
        }, planning.flowType);

        return this.getResponse(resStatus, message, planning);

    };

    moveorderloadtoload = async (data, timezone, user) => {
        const { targetPlanningId, currentPlanningId, orderId } = data.body;
        let { host } = data.headers;
        const order = await OrderSchema.findById(orderId);
        if (!order) return this.getResponse(0, 'Wrong order id');

        const [ currentPlanning, targetPlanning, settings] = await Promise.all([
            Planning.findById(currentPlanningId).populate("depo"),
            Planning.findById(targetPlanningId).populate("depo"),
            SettingsSchema.findOne({
                user: user._id
            })
        ]);

        if (!currentPlanning) return this.getResponse(0, 'Wrong current planning id');
        if (!targetPlanning) return this.getResponse(0, 'Wrong target planning id');

        const errors = await PlanningErrorsClass.addOrderFromLoadError({ load: currentPlanning, order });
        if (errors.error) return this.getResponse(0, errors.msg);

        const DragAndDropService = new DragAndDropHelperService();

        const addOrderFromLoadBody = {
            load: targetPlanning,
            orders: [order],
            depo: targetPlanning.depo,
            user
        };
        console.log(targetPlanning);
        let prevOrderIds = currentPlanning.orders;
        let remOrder, depo, addOrder, arr = [], loadArr = [];
        const addOrderFromLoad = await DragAndDropService.addOrderFromLoad(addOrderFromLoadBody);

        if (addOrderFromLoad && addOrderFromLoad.status) {
            await Planning.findByIdAndUpdate(targetPlanningId, {
                ...addOrderFromLoad.data
            });
            prevOrderIds = prevOrderIds.filter(id => {
                return id != orderId;
            });

            remOrder = await DragAndDropService.removeOrderFromLoadTemp({
                load: currentPlanning,
                ordersIdsArr: prevOrderIds,
                orders: [order],
                user
            });


            if (remOrder && remOrder.status) {
                let newLoadTemps;
                console.log(addOrderFromLoad.data);
                if (!remOrder.delete) {
                    await Planning.findByIdAndUpdate(currentPlanningId, {
                        ...remOrder.updateObj
                    });
                }
                if (!remOrder.delete) {
                    arr.push(currentPlanningId, targetPlanningId);
                } else {
                    arr.push(targetPlanningId);
                }
                newLoadTemps = await DragAndDropService.calculationForLoadTemp({
                    arr, timezone, user, host, settings
                });
                console.log(newLoadTemps.result[targetPlanningId.toString()]);
                console.log(newLoadTemps.result[currentPlanningId.toString()]);
                const updateTargetPlan = await PlanningHelperClass.changeForCalc({
                    id: targetPlanningId,
                    loadData: newLoadTemps.result[targetPlanningId.toString()]
                }, targetPlanning.get("flowType"));
                const updateCurrentPlan = !remOrder.delete ? await PlanningHelperClass.changeForCalc({
                    id: currentPlanningId,
                    loadData: newLoadTemps.result[currentPlanningId.toString()]
                }, currentPlanning.get("flowType")) : null;

                return this.getResponse(1, "Success", {
                    currLoad: updateTargetPlan, // target load
                    prevLoad: updateCurrentPlan
                })
            } else return this.getResponse(remOrder.status, reOrder.msg);
        } else return this.getResponse(addOrder.status, addOrder.msg);
    };

    checkOrdersByLoadFlowType = async (data) => {
        let { orders, flowType, planningId } = data, status = 1, msg = "ok";
        const flowTypes = await FlowTypes.find({ status: 1 });
        let ordersForUnPlan = [], newOrders = orders;
        for (const order of newOrders) {
            if (order.flowTypes && order.flowTypes.length) {
                if (order.flowTypes.includes(flowType)) {
                    ordersForUnPlan.push({
                        orderId: order._id,
                        planningId,
                        message: "You cannot confirm the loadTemp as its orders are already in the confirmed Load with the same flow type."
                    });
                }else if (flowType == 3) {
                    ordersForUnPlan.push({
                        orderId: order._id,
                        planningId,
                        message: "You cannot confirm the loadTemp."
                    });
                }else if (order.flowTypes.includes(3) && flowType) {
                    ordersForUnPlan.push({
                        orderId: order._id,
                        planningId,
                        message: "You cannot confirm the loadTemp as E2E FlowType."
                    });
                }
            }
        }
        if (ordersForUnPlan.length) {
            ordersForUnPlan.forEach(order => {
                newOrders = newOrders.filter(oId => {
                    return oId._id != order.orderId
                })
            });
        }
        return this.getResponse(status, msg, {
            ordersForUnPlan,
            orders: newOrders
        })
    };

    confirmOrders = async (data) => {
        let { orders, flowType, planningId } = data;
        let orderArr, flowTypes;
        for (const order of orders) {
            orderArr = order.loadIds ? order.loadIds : [];
            flowTypes = order.flowTypes ? order.flowTypes : [];
            orderArr.push(planningId);
            flowTypes.push(flowType);
            let isPlanned = 0;
            if (flowTypes.includes(3) || (flowTypes.includes(1) && flowTypes.includes(2))) {
                isPlanned = 1;
            }
            await OrderSchema.findByIdAndUpdate(order._id, {
                loadIds: orderArr,
                flowTypes,
                confirmed: 1,
                isPlanned
            });
        };
        return this.getResponse(1, "Success");
    };

    confirm = async (data) => {
        let { idList } = data.body, { user } = data, { timezone, host } = data.headers;
        let status = 1, message, ordersForUnPlan = [];
        const [plannings, settings] = await Promise.all([
            Planning.find({
                _id: { $in: idList },
                $or: [{confirmed: null}, { confirmed: 0}]
            }, "orders flowType depo return shift equipment startTime return").populate(["depo", "shift", "equipment"])
            .populate({
                path: "orders",
                populate: "status"
            }),
            SettingsSchema.findOne({
                user: user._id
            })
        ]) ;
        if (plannings && plannings.length) {
            console.log(plannings)
            for (const [index, planning] of plannings.entries()) {
                const orders = planning.get("orders");
                let orderIds = [];
                orders.forEach(order => {
                    orderIds.push(order._id.toString())
                });
                const flowType = planning.get("flowType");
                const depot = planning.get("depo");
                const ret = planning.get("return");
                const shift = planning.get("shift");
                const startTime = planning.get("startTime");
                const planningId = planning._id;
                // const orders = await OrderSchema.find({
                //     _id: { $in: orderIds }
                // }).catch(err => {
                //     console.log(err)
                // });
                const checkByFlowType = await this.checkOrdersByLoadFlowType({
                    orders, flowType, planningId
                })
                ordersForUnPlan = ordersForUnPlan.concat(checkByFlowType.data.ordersForUnPlan)
                if (!checkByFlowType.data.ordersForUnPlan.length) {
                    const conf = await this.confirmOrders({
                        orders,
                        flowType,
                        planningId
                    });
                    if (conf.status) {
                        const LatLon = await PlanningHelperClass.getLatLon({
                            depot,
                            flowType,
                            ret
                        }, orders);
                        let traficInfo = await OSmapServiceClass.GetDistDurMapBox(LatLon), calculation;

                        let calcResponseData = {
                            traficInfo: traficInfo.data,
                            shift: shift._doc,
                            loadType: 1,
                            loads: {
                                startTime,
                                return: ret
                            },
                            timezone,
                            sortOrders: orders,
                            flowType,
                            loadId: planningId,
                            user,
                            planning: planning._doc,
                            newOrderIdsArr: orderIds,
                            host,
                            settings
                        }
                        calculation = await this.generateCalcResponse(calcResponseData);

                        const planningModel = {
                            ...calculation,
                            busy: 0,
                            confirmed: 1
                        };
                        await Planning.findByIdAndUpdate(planningId, planningModel);
                    }
                }
            }
        } else {
            status = 0;
            message = "Select right Planning(s) for Confirm"
        }
        return this.getResponse(status, message, ordersForUnPlan);
    };

    strictConfirm = async (data) => {
        let { list } = data.body, { user } = data, { timezone, host } = data.headers;
        let confirmedPlannings = [], deletedPlannings = [];
        for (const item of list) {
            let planningId = item.planningId, orderIds = item.orderIds;
            const currentPlanning = await Planning.findById(planningId).populate("depo");
            let prevOrderIds = currentPlanning.get("orders"), remOrder, updateCurrentPlan;
            prevOrderIds = prevOrderIds.filter(id => {
                return !orderIds.includes(id.toString());
            });
            const DragAndDropService = new DragAndDropHelperService();
            const [orders, settings] = await Promise.all([
                OrderSchema.find({
                    _id: { $in: orderIds }
                }),
                SettingsSchema.findOne({
                    user: user._id
                })
            ]);
            remOrder = await DragAndDropService.removeOrderFromLoadTemp({
                load: currentPlanning,
                ordersIdsArr: prevOrderIds,
                orders,
                user
            });
            if (remOrder && remOrder.status) {
                let newLoadTemps, arr = [];
                if (!remOrder.delete) {
                    await Planning.findByIdAndUpdate(planningId, {
                        ...remOrder.updateObj
                    });
                    arr.push(planningId);
                    newLoadTemps = await DragAndDropService.calculationForLoadTemp({
                        arr, timezone, user, host, settings
                    });
                    updateCurrentPlan = await PlanningHelperClass.changeForCalc({
                        id: planningId,
                        loadData: newLoadTemps.result[planningId.toString()]
                    }, currentPlanning.get("flowType"));
                    confirmedPlannings.push(planningId);
                } else {
                    deletedPlannings.push(planningId)
                }
            }
        }
        const confirmPlannings = await this.confirm({
            body: {idList: confirmedPlannings},
            user,
            headers: {
                timezone
            }
        })
        return this.getResponse(1, `Confirmed ${confirmedPlannings.length} Planning(s), and Deleted ${deletedPlannings.length} Planning(s)`, {confirmPlannings: confirmPlannings.data, deletedPlannings});
    };

    sequence = async (data) => {
        let status = 1, message = "ok";
        let { loadId } = data.body, { timezone, host } = data.headers;
        let { user } = data;
        const load = await Planning.findById(loadId);
        if (!load) {
            return this.getResponse(0, "such Planning doesn't exist.");
        }
        if (!load.orders.length || load.orders.length == 1 || load.ordersCount == 1) {
            return this.getResponse(0, "Planning can't sequence because haven't Orders or have 1 Order.");
        }
        const job = load._doc.UUID ? await Job.findOne({ UUID: load._doc.UUID }) : null;
        const AlgorithmServiceClass = new AlgorithmService();
        const sequence = await PlanningHelperClass.getSingleLoadSequence({data, load: load._doc, job, user, timezone, host});

        let engine = await AlgorithmServiceClass.sendReqToEngineForSequence({
            ...sequence,
            host,
            flowType: load._doc.flowType
        });
        if (engine && engine.data.Data == 'Started.') {
            message = "Sequence started"
        } else {
            status = 0;
            message = engine.data.Message
        }
        return this.getResponse(status, message);
    };

    planningSequence = async (data) => {
        console.log("Sequence POST Request");
        let seqData = data.body[0], resStatus = 1, message = "Planning SuccessFully sequenced";
        let { Loads, Returnees, Status, UUID, Infeasibles, Algorithm, FlowType, Exception } = seqData;
        let { loadId, user, timezone, orders, startTime, ret, depotId, shiftId, confirmed, host } = JSON.parse(Returnees);
        const [depot, shiftData, plan] = await Promise.all([
            depotId ? DepotSchema.findById(depotId) : null,
            shiftId ? ShiftSchema.findById(shiftId) : null,
            Planning.findById(loadId).populate(["loadType", "orders"])
        ])
        let OrderIDs, FirstNodeStartTime;
        if (Status == 3) {
            OrderIDs = Loads[0].OrderIDs;
            FirstNodeStartTime = Loads[0].FirstNodeStartTime;
        }
        const infCount = Infeasibles.length;
        let seqStatus = Status;
        let seqWarning = {
            msg: "false"
        };
        let ordersStr;
        if (seqStatus == 3 && infCount == 0) {
            ordersStr = await PlanningHelperClass.changeIDTo_id({
                orderIDS: OrderIDs
            });
            startTime = FirstNodeStartTime;
        } else if (seqStatus == 2) {
            ordersStr = orders;
            startTime = startTime;
            seqWarning.msg = Exception.Message;
        } else {
            seqStatus = 2;
            ordersStr = orders;
            startTime = startTime;
            seqWarning.msg = "Sequence algorithm cannot be used as there is an infeasible order in the load.";
        }
        const ordersArr = await OrderServiceClass.getAllWithoutPagination({
            body: {
                id: ordersStr.join(",")
            },
            user
        })
        if (!ordersArr.data.orders.length) {
            return this.getResponse(0, "This orders not yours!!!");
        }
        const socket = require("../../server");
        let planning;
        if(seqStatus == 3) {
            let { StartLocation, EndLocation, TotalPieceCount, TotalRate, TotalVolume, TotalVolumeCube,TotalWeight, TotalPermileRate } = Loads[0];
            let calculation = await CalculationsClass.stopsFromC({
                load: Loads[0],
                planningId: loadId,
                loadType: plan.loadType.name,
                FlowType
            });
            this.orderEditForCalc(calculation.updateData)
            planning = await Planning.findByIdAndUpdate(loadId, {
                cube: TotalVolumeCube,
                feet: TotalVolume,
                weight: TotalWeight,
                feelRates: TotalRate,
                permileRates: TotalPermileRate,
                pieceTotalQuantity: TotalPieceCount,
                start: StartLocation,
                end: EndLocation,
                stopLocations: calculation.allStops,
                orders: calculation.orderIds ? calculation.orderIds : ordersStr,
                stops: calculation.stops ? calculation.stops : ordersStr.length,
                status: calculation.statusId,
                busy: 0,
                warning: calculation.warning,
                warningData: calculation.warningsArr,
                totalDuration: calculation.totalDuration,
                totalDistance: calculation.totalDistance,
                Deadhead: calculation.Deadhead ? calculation.Deadhead : 0
            }, {new: true}).populate(["orders", "depo"]).catch(err => {
                if (err) {
                    console.log(err.message)
                    resStatus = 0;
                    message = "Planning can't update";
                }
            });
        } else {
            message = seqWarning.msg
        };
        const notData = {
            title: "Sequence",
            content: message,
            type: 1,
            user: user ? user._id : null
        };

        const pushNotification = await NotificationServiceClass.create(notData);
        await socket.sendNotificationToUser(constants.socketHandler.sequenceNotification, user._id, {...pushNotification, planning: planning ? planning._doc : plan});
        return this.getResponse(resStatus, message);
    }

    addMultiOrdersInLoadOnMap = async (data) => {
        let { timezone, host } = data.headers, { user } = data;
        let { orderIds, selectedLoadIds, loadId } = data.body,
        arrIds = [], arr = [], addOrder, loadArr = [], warnings, sLoads;
        const [planning, settings] = await Promise.all([
            Planning.findById(loadId).populate("depo"),
            SettingsSchema.findOne({
                user: user._id
            })
        ]);
        const selectedPlannings = selectedLoadIds && selectedLoadIds.length ? await this.getAllWitOutPagination({
            body: { ids: selectedLoadIds }
        }, true) : [];
        const loadOrderIds = planning._doc.orders.map(item => {
            return item = item.toString()
        });
        let success = [], failed = [], msg = "ok", failorders = "";
        orderIds.map((orderId) => {
            console.log(loadOrderIds.includes(orderId));
            if (!loadOrderIds.includes(orderId)) {
                arrIds.push(orderId);
            }
        })
        let addOrderIds = [];
        const depo = planning._doc.depo;
        for (const id of arrIds) {
            const order = await OrderServiceClass.getById({ params: { id }});
            const errors = await PlanningErrorsClass.addOrderFromLoadError({ load: planning._doc, order: order.data });
            if (errors.error) {
                failorders += `${id},`;
                failed.push({
                    orderId: id,
                    msg: errors.msg
                });
            } else {
                addOrderIds.push(id);
            }
        }
        const addOrders = await OrderServiceClass.getAllWithoutPagination({
            body: {
                _id: {
                    $in: addOrderIds
                }
            }
        });

        const DragAndDropService = new DragAndDropHelperService();
        const addOrderFromLoadBody = {
            load: planning,
            orders: addOrders.data.orders,
            depo: depo,
            user
        };
        const addOrderFromLoad = await DragAndDropService.addOrderFromLoad(addOrderFromLoadBody);
        let updateTargetPlan, newLoadTemps;
        if (addOrderFromLoad && addOrderFromLoad.status) {
            await this.unplanOrders({
                orders: addOrders.data.orders,
                user, headers: { host, timezone }
            })
            const newPlanning = await Planning.findByIdAndUpdate(loadId, {
                ...addOrderFromLoad.data
            }, {new: true});
            newLoadTemps = await DragAndDropService.calculationForLoadTemp({
                arr: [loadId],
                timezone,
                user,
                host,
                settings
            });
            updateTargetPlan = await PlanningHelperClass.changeForCalc({
                id: loadId.toString(),
                loadData: newLoadTemps.result[loadId.toString()]
            }, planning.get("flowType"));
        }
        return this.getResponse(1, "Success", {
            newLoad: updateTargetPlan,
            selectedLoads: selectedPlannings.data.plannings
        })
    }

    getDriverForAlgo = async (data) => {
        let { flowType, orderIds, user } = data, driverId;
        let newOrders = await OrderServiceClass.getAllWithoutPagination({
            body: {
                ID: { $in: orderIds }
            },
            user
        });
        for (const order of newOrders.data) {
            for (const location of order._doc.locations) {
                if (flowType == "2") {
                    if (order._doc.deliveryCompanyName == location.companyLegalName) {
                        driverId = location.driver ? location.driver : null;
                        break;
                    }
                }
                if (flowType == "1") {
                    if (order._doc.pickupCompanyName == location.companyLegalName) {
                        driverId = location.driver ? location.driver : null;
                        break;
                    }
                }
            }
        }
        return driverId;
    }

    createLoadTempNew = async (data) => {
        const { load, Loads, params, returnees } = data;
        const {UUID, FlowType, Algorithm, Infeasibles, Percentage, RuntimeSeconds, GrandTotalDistance, GrandTotalDuration, Status, ETA} = load;
        let { timezone, manualStartTime, user, loadType, depotType } = returnees;
        const { depoId, loadStartTime, oVRP, shiftId, fixedDriverCalc, assignDrivers } = params;
        //get Depot
        const depo = depoId ? await DepoServiceClass.getOne({_id: depoId}) : null;
        let drivingMinutes = [];
        let con = [];
        let i = 0, loadIds = [], loadTemps, equipment;
        let planningsArr = [], calculation, orderUpdateData = [];
        for (const load of Loads) {
            let driverId;
            if (load.Equipment && load.Equipment.Driver && load.Equipment.Driver.Id) {
                driverId = load.Equipment.Driver.Virtual ? null : load.Equipment.Driver.Id;
            } else if (fixedDriverCalc) {
                driverId = await this.getDriverForAlgo({
                    user,
                    orderIds: load.OrderIDs,
                    flowType: FlowType
                })
            };

            con = con.concat(load.OrderIDs);
            drivingMinutes.push(load.DrivingMinutes);
            let cube = 0, weight = 0, feet = 0,
            feelRates = 0, permileRates = 0, pieceTotalQuantity = 0;
            const [orders, indexing] = await Promise.all([
                OrderServiceClass.getAllWithoutPagination({
                    body: {
                        ID: load.OrderIDs
                    },
                    user
                }),
                GeneralHelperClass.indexingArr(load.OrderIDs)
            ])
            const List = await GeneralHelperClass.sortArrayByID(indexing, orders.data.orders);
            let { orderList, order_ids } = List;
            const [addreses, getDepotType, startEndAndEmptymile] = await Promise.all([
                PlanningHelperClass.getAddressByFlowType(FlowType, oVRP, depo, orderList),
                PlanningHelperClass.getDepotTypeByFlowType({flowType: FlowType, depotType}),
                CalculationsClass.getEmptyMileageByFlowType({flowType: FlowType, oVRP, depo, orderList})
            ])
            let { meters, start } = startEndAndEmptymile;

            cube = load.TotalVolumeCube ? load.TotalVolumeCube : 0;
            feet = load.TotalVolume ? load.TotalVolume : 0;
            weight = load.TotalWeight ? load.TotalWeight : 0;
            feelRates = load.TotalRate ? load.TotalRate : 0;
            permileRates = load.TotalPermileRate ? load.TotalPermileRate : 0;
            pieceTotalQuantity = load.TotalPieceCount ? load.TotalPieceCount : 0;
            let end = load.EndLocation;

            // get Equipment
            if (load.Equipment && load.Equipment.typeId && load.Equipment.typeId !== "0") {
                equipment = await EquipmentServiceClass.getOne({
                    _id: load.Equipment.typeId
                });
            }
            // get SHIFT
            const [ shift, transportType ] = await Promise.all([
                ShiftServiceClass.getOne({_id: shiftId}),
                TransportTypeSchema.findOne({
                    name: loadType
                })
            ])

            let carTypes = equipment && equipment.status ? [{...equipment.data._doc}] : [{
                ...load.Equipment
            }]

            let startTime;
            if (FlowType == 3) {
                startTime = moment(load.FirstNodeStartTime, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z"
            } else {
                startTime = manualStartTime == 1 ? moment(loadStartTime, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z"
                : moment(load.FirstNodeStartTime, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z"
            }
            let planningModel = {
                user: user._id,
                UUID: UUID,
                equipment: load.Equipment && load.Equipment.typeId ? load.Equipment.typeId : null,
                driver: driverId && driverId != -1 ? driverId : null,
                shift: shiftId,
                depo: depoId,
                orders: order_ids,
                ordersCount: order_ids.length,
                stops: load.OrderIDs.length,
                start,
                end,
                carTypes,
                startTime,
                totalDistance: Number(load.TotalDistance).toFixed(2),
                totalDuration: load.TotalMinutes*60,
                flowType: FlowType,
                cube,
                feet,
                return: oVRP,
                weight,
                feelRates,
                permileRates,
                pieceTotalQuantity,
                planType: "Auto",
                disabled: 0,
                startAddress: addreses.startAddress,
                endAddress: addreses.endAddress,
                emptymile: meters,
                loadType: transportType._id,
                depotType: getDepotType,
                busy: 0,
            };
            const newLoad = new Planning(planningModel);
            // let newLoad = await Planning.create(planningModel).catch(err => {
            //     console.log(err);
            // });

            loadIds.push(newLoad._id);
            calculation = await CalculationsClass.stopsFromC({
                load,
                planningId: newLoad._id.toString(),
                loadType,
                FlowType
            })
            orderUpdateData = calculation.updateData ? orderUpdateData.concat(calculation.updateData) : []
            let planningOrderIds = calculation.orderIds ? calculation.orderIds : order_ids;
            newLoad.stopLocations = calculation.allStops;
            newLoad.orders = planningOrderIds;
            newLoad.stops = calculation.stops ? calculation.stops : load.OrderIDs.length;
            newLoad.status = calculation.statusId;
            newLoad.warning = calculation.warning;
            newLoad.warningData = calculation.warningsArr;
            newLoad.totalDuration = calculation.totalDuration;
            newLoad.Deadhead = calculation.Deadhead ? calculation.Deadhead : 0;
            planningsArr.push(newLoad);
        }
        let defaultStructure;
        if (assignDrivers == 1) {
            // await Helper.addDriver(loadTemps.rows);
        }
        defaultStructure = planningsArr.map(x => ({ loadId: x._id, orders: x.get("orders") }));
        JobServiceClass.edit({defaultStructure}, UUID);

        return this.getResponse(1, "Success", {
            status: Status,
            eta: ETA,
            percentage: Percentage,
            loadOrderIds: con,
            drivingminutes: drivingMinutes,
            totalRunTime: RuntimeSeconds,
            totalDistance: GrandTotalDistance,
            totalDuration: GrandTotalDuration,
            Infeasible: Infeasibles,
            planningsArr,
            orderUpdateData
        })
    };

    // orderEditForCalc = (data) => {
    //     for (const item of data) {
    //         OrderSchema.findByIdAndUpdate(item.id, item.data).catch(err => {
    //             console.log(`orderEdit errMessage: ${err.message}`);
    //         })
    //     }
    // }

    creatPlanningByAlgoNew = async (data, res) => {
        console.log("Post Request")
        let now1 = Date.now();
        let uuid = data[0].UUID,
            status = [],
            eta = [],
            percentage = [],
            loadOrderIds = [],
            drivingminutes = [],
            totalRunTime = [],
            totalDistance = [],
            totalDuration = [],
            Infeasible = [],
            loads = [],
            InfeasibleCount = 0,
            loadsCount = 0,
            flag = false,
            jobUpdate;
        let totalDist = 0, planUser, successMessage = "";
        const socket = require("../../server");
        res.json(this.getResponse(1, "Planning create started"))
        for (const load of data) {
            const returnees = JSON.parse(load.Returnees);
            planUser = returnees.user;

            if (load.Status == 3) {
                const Loads = load.Loads;
                if(Loads.length > 10) {
                    const startNot = {
                        title: "AutoPlan",
                        content: "AutoPlan Started"
                    };
                    await socket.sendNotificationToUser(constants.socketHandler.algoNotificationStart, planUser._id, {
                        status: 1,
                        msg: "Started!",
                        data: startNot
                    });
                }
                // const Loads = load.FlowType == 3 ? load.PDPLoads : load.Loads;
                const job = await JobServiceClass.getOne({UUID: load.UUID});
                flag = true;
                let { data } = await this.createLoadTempNew({
                    load,
                    Loads,
                    params: job.data._doc.params,
                    returnees
                });
                Planning.create(data.planningsArr);
                data.orderUpdateData ? this.orderEditForCalc(data.orderUpdateData) : null;
                status.push(data.status);
                eta.push(data.eta);
                percentage.push(data.percentage);
                loadOrderIds.push(data.loadOrderIds);
                drivingminutes.push(data.drivingminutes);
                totalRunTime.length == 0 ? totalRunTime.push(data.totalRunTime) : null;
                totalDistance.length == 0 ? totalDistance.push(data.totalDistance) : null;
                totalDuration.length == 0 ? totalDuration.push(data.totalDuration) : null;
                Infeasible = Infeasible.concat(data.Infeasible);
                loads = loads.concat(data.planningsArr);
                InfeasibleCount += data.Infeasible.length;
                loadsCount += data.planningsArr.length;
                successMessage = "AutoPlan successfully finished";
            } else {
                status.push(load.Status);
                eta.push(load.ETA);
                percentage.push(load.percentage);
                InfeasibleCount += load.InfeasibleCount;
                Infeasible = Infeasible.concat(load.Infeasibles);
                successMessage = load.StatusMessage;
            }
        }
        if (flag) {
            jobUpdate = await JobServiceClass.edit({
                status,
                eta,
                percentage,
                loadOrderIds,
                drivingminutes,
                totalRunTime,
                totalDistance,
                totalDuration,
                Infeasible,
                InfeasibleCount,
                loads,
                loadsCount
            }, uuid)
        } else {
            jobUpdate = await JobServiceClass.edit({
                totalRunTime: [0],
                status,
                eta,
                percentage,
                Infeasible,
                InfeasibleCount
            }, uuid)
        }
        console.log("successMessage: ", successMessage);
        const datas = {
            title: "AutoPlan",
            content: !flag ? "AutoPlan failed!" : successMessage,
            type: 1,
            user: planUser ? planUser._id : null
        };
        const pushNotification = await NotificationServiceClass.create(datas);
        console.log("socket notification");
        let now2 = Date.now();
        let mill = now2 - now1;
        console.log(`seconds elapsed = ${Math.floor(mill / 1000)}`)
        await socket.sendNotificationToUser(constants.socketHandler.algoNotification, planUser._id, pushNotification);
        await socket.sendNotificationToUser(constants.socketHandler.notification, planUser._id, pushNotification);

        return this.getResponse(1, "Success", jobUpdate.data);
    };

    getByDriverId = async (data) => {
        let { body, user } = data;
        let plannings, status = 1, message = "Planning List", count;
        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.planningFilter(body)
        let { limit, offset, order } = pagination;
        count = await Planning.countDocuments({
            ...fillter,
            driver: user._id
        });
        plannings = await Planning.find({
            ...fillter,
            driver: user._id
        }).populate("driver").populate("orders").populate("depo").sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                status = 0;
                message = err.message;
            }
        });
        return this.getResponse(status, message, {plannings, count});
    };

    changeOnWayStatus = async (data) => {
        let { id } = data.params, { statusId: loadStatus } = data.body;
        let updateObj = {}, startTime, stopLocations;
        updateObj.status = loadStatus;
        const newStatus = loadStatus ? await StatusesSchema.findById(loadStatus) : null;
        const load = await Planning.findById(id).populate("status");
        const curStatus = load.get("status.name"), finishRequest = load.get("finishRequest"), orderIds = load.get("orders");
        if(newStatus && newStatus.get("name") == "In Transit" && (finishRequest == 1 || finishRequest == 0) && curStatus != "Terminated") {
            startTime = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
            updateObj.startedTime = startTime+"Z";
            updateObj.finishedTime = null;
            const oStatus = await StatusesSchema.findOne({
                name: "In Transit",
                type: "Order"
            });

            await OrderSchema.updateMany({
                _id: { $in: orderIds }
            }, {status: oStatus._doc._id});

            stopLocations = load.get("stopLocations");
            if(stopLocations){
                for (const stop of stopLocations) {
                    if( stop.type.type == "order" ) {
                        for (const item of stop.type.datas) {
                            item.status = oStatus._doc._id;
                            item.statusId = oStatus._doc._id;
                            item.statusColor = oStatus._doc.color;
                            item.statusName = oStatus._doc.name;
                            item.timeInfo.loads[lid].ata = null;
                            for (const load of item.timeInfo.loadsArr) {
                                if (load._id == id) {
                                    load.ata = null;
                                }
                            }
                            await OrderSchema.findByIdAndUpdate(item._id, {timeInfo: item.timeInfo});
                        }
                    }
                }
            }
            updateObj.stopLocations = stopLocations;
            updateObj.finishRequest = 0;
        }
        const planning = await Planning.findByIdAndUpdate(id, updateObj, {new: true});
        return this.getResponse(1, "Success", planning);
    };

    calculation = async (data) => {
        let { planningId, user, start } = data, { timezone, host } = data.headers;
        const [load, settings] = await Promise.all([
            Planning.findById(planningId).populate(["depo", "shift", "equipment"]).populate({
                path: "orders",
                populate: "status"
            }),
            SettingsSchema.findOne({
                user: user._id
            })
        ]);
        let sortOrders = load.get("orders"),
            depot = load.get("depo"),
            ret = load.get("return"),
            flowType = load.get("flowType");
            shift = load.get("shift");
            startTime = load.get("startTime");
        let idList = [];
        for (const order of sortOrders) {
            if(!idList.includes(order._id.toString())) {
                idList.push(order._id.toString())
            }
        }
        const calcModel = await CalculationsClass.calcByC({
            newOrderIdsArr: idList,
            loads: load,
            flowType,
            host,
            settings
        });
        const newPlanning = await Planning.findByIdAndUpdate(planningId, {
            stopLocations: calcModel.allStops,
            orders: calcModel.orderIds ? calcModel.orderIds : idList,
            stops: calcModel.stops ? calcModel.stops : idList.length,
            status: calcModel.statusId,
            busy: 0,
            warning: calcModel.warning,
            warningData: calcModel.warningsArr,
            totalDuration: calcModel.totalDuration,
            Deadhead: calcModel.Deadhead ? calcModel.Deadhead : 0
        }, { new: true })
        return this.getResponse(1, "Success", newPlanning);
    };

    finished = async (data) => {
        let { loadId } = data.body, status = 1, message = "ok";
        const endTime = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
        const planning = await Planning.findByIdAndUpdate(loadId, {
            finishRequest: 2,
            status: "60b0b9226f8b6c476f2a57a1",
            finishedTime: endTime+"Z"
        }, { new: true }).catch(err => {
            status = 0;
            message = err.message
        })
        return this.getResponse(status, message, planning)
    };

    updateETA = async (data) => {
        let { timezone, host } = data.headers, { start, loadId } = data.body;
        let { user } = data;
        const startTime = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
        let updObj = {};
        if (start == 1) {
            updObj = {
                // startedTime: startTime+"Z",
                finishedTime: null
            };
        }
        start == 1 ? await Planning.findByIdAndUpdate(loadId, updObj, { new: true }) : null;
        const newPl = this.calculation({
            planningId: loadId, user, start,
            headers: {
                timezone,
                host
            }
        });
        return newPl;
    };

    updateLastLocation = async  (data) => {
        const { loadId, location } = data.body;
        let status = 1, message = "Success";
        const planning = Planning.findByIdAndUpdate(loadId, {
            lastLocations: location
        }, { new: true }).catch(err => {
            if(err) {
                status = 0;
                message = err.message
            }
        });
        return this.getResponse(status, message, planning)
    }
};

module.exports = PlanningService;
