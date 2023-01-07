const BaseService = require('../main_classes/base.service');
const PlanningSchema = require('../newModels/planningModel');
const LoadSchema = require('../newModels/loadsModel');
const CalculationService = require('../services/calculation.service');
const PlanningHelper = require("../helpers/planningHelper");
const GeneralHelper = require('../main_classes/general.service');
const OSmapService = require("./osmap.service");

module.exports = class LoadsService extends BaseService {
    get Calc() { return new CalculationService() };
    get planningHelper() { return new PlanningHelper() };
    get generalHelper() { return new GeneralHelper() };
    get OSmap () { return new OSmapService() };

    flowType = {
        lp2d: 1,
        d2e: 2,
        e2e: 3
    };

    getAll = async (req) => {
        let { body } = req;
        let pagination = await this.pagination.sortAndPagination(body)
        let fillter = await this.fillters.loadsFilter(body)
        let loads, message = "Load list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await LoadSchema.countDocuments({...fillter});
        loads = await LoadSchema.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {loads, count});
    }

    getbyId = async (req) => {
        let _id = req.params.id;
        let load, message = "Success", status = 1;
        load = await LoadSchema.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!load) {
            status = 0;
            message = "such transportType doesn't exist!"
        }
        return this.getResponse(status, message, load);
    }

    confirm = async (body, user, timezone) => {
        const { idList } = body;

        const res = await this.checkExistPlanningOrders(idList);
        if (res && !res.data.existList.length) return this.getResponse(0, 'No exist planning orders to confirm');

        const list = res.data.existList, errors = res.data.errorList, loadsList = [];

        await Promise.all(list.map(async item => {
            let indexing = await this.generalHelper.indexingArr(item.orders.map(x => (x._id)));
            const sortOrders = await this.generalHelper.sortArray(indexing, item.orders);

            let { start, end, endOrderAddress } = await this.planningHelper.checkingByFlowType({
                sortOrders,
                depot: item.depo,
                ret: item.return,
                flowType: item.flowType
            });

            let feelRates = 0, permileRates = 0;

            item.orders.forEach(x => {
                feelRates += item.rate;
                permileRates += item.permileRate;
            })

            const LatLon = await this.planningHelper.getLatLon({
                depot: item.depo,
                flowType: item.flowType,
                ret: item.return
            }, sortOrders);

            // let traficInfo = await this.OSmap.GetDistDur(LatLon);
            let traficInfo = await this.OSmap.GetDistDurMapBox(LatLon);

            const planningModel = await this.planningHelper.generatePlanningModel({
                ret: item.return,
                driver: item.driver ? item.driver : null,
                depot: item.depo,
                orders: item.orders,
                endOrderAddress,
                feelRates,
                permileRates,
                driverId: item.driver._id,
                planType: "Manual",
                start,
                end,
                carTypes: [item.equipment],
                totalDistance: traficInfo.distDur.distance,
                user: user._id
            });

            const calcBody = {
                traficInfo: traficInfo.distDur,
                shift: item.shift,
                loadType: 1,
                loads: planningModel,
                timezone,
                sortOrders,
                flowType: item.flowType,
                loadId: item._id,
                user
            };
            calcBody.legs = traficInfo.arrLatLon;
            const calc = await this.Calc.stops(calcBody);
            console.log(calc);

            const body = {
                UUID: item.UUID,
                nickname: item.nickname,
                flowType: item.flowType,
                orders: item.orders,
                stops: item.orders.length,
                start: item.start,
                end: item.end,
                feet: item.feet,
                weight: item.weight,
                cube: item.cube,
                pallet: item.pallet,
                emptymile: item.emptymile,
                totalDistance: item.totalDistance,
                totalDuration: calc.totalDuration,
                freezed: item.freezed,
                loadCost: item.loadCost,
                loadCostPerMile: item.loadCostPerMile,
                fuelSurcharge: item.fuelSurcharge,
                startAddress: item.startAddress,
                endAddress: item.endAddress,
                startTime: item.startTime,
                endTime: item.endTime,
                comment: item.comment,
                totalcases: item.totalcases,
                feelRates: item.feelRates,
                permileRates: item.permileRates,
                return: item.return,
                carTypes: item.carTypes,
                stopLocations: calc.allStops,
                busy: item.busy,
                changed: item.changed,
                warning: item.warning,
                warningData: calc.warningsArr,
                disabled: item.disabled,
                confirmed: null, //remove
                equipment: item.equipment,
                driver: item.driver,
                depo: item.depo,
                shift: item.shift._id,
                planType: item.planType,
                user: item.user
            };

            const load = new LoadSchema(body);

            item.confirmed = 1;
            await Promise.all(item.orders.map(async order => {
                order.flowTypes.push(load.flowType);
                order.loadIds.push(load._id);
                await order.save();
            }));

            await Promise.all([
                item.save(),
                load.save()
            ]);

            loadsList.push(load._id);
        }));
        const response = {
            errors,
            loadsList,
            errorsCount: errors.length,
            createdCount: loadsList.length
        };

        return this.getResponse(1, 'Planning confirmed', response);

    };

    checkExistPlanningOrders = async (idList) => {

        const list = await PlanningSchema.find({ _id: { $in: idList }, confirmed: 0 }).populate('orders').populate('shift').populate('driver').populate('depo');
        const errorList = [];

        if (!idList.length || !list.length) return this.getResponse(0, 'idList can not be empty');

        const existList = [];

        list.forEach(async item => {
            const orders = item.orders;

            orders.forEach(async order => {

                if (order.flowTypes.length && (order.flowTypes.includes(this.flowType.d2e) || (order.flowTypes.includes(this.flowType.lp2d) && (item.flowType === this.flowType.lp2d)))) {
                    errorList.push({ planningId: item._id, orderId: order._id, flowType: item.flowType });
                } else {
                    const index = existList.findIndex(x => x._id === item._id);
                    if (index < 0) {
                        existList.push(item)
                    }
                };

            });

        });

        list.map(item => {
            const index = errorList.findIndex(x => x.planningId === item._id);
            if (index > -1) {
                list.splice(index, 1);
            }
        });
        return this.getResponse(1, 'ok', { errorList, existList });
    };

};