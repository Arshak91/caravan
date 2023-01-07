const BaseController = require("../main_classes/base.controller");
const PlanningService = require("../services/planning.service");
const PlanningServiceClass = new PlanningService();

class PlanningController extends BaseController {
    constructor() {
        super()
    };

    getAll = async (req, res) => {
        try {
            const result = await PlanningServiceClass.getAll(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/getAll: ${error.message}`);
        }
    }

    getAllWitOutPagination = async (req, res) => {
        try {
            const result = await PlanningServiceClass.getAllWitOutPagination(req, true);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/getAllWitOutPagination: ${error.message}`);
        }
    };

    getByDriverAndById = async (req, res) => {
        try {
            const result = await PlanningServiceClass.getByDriverAndById(req, true);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/getByDriverAndById: ${error.message}`);
        }
    }

    create = async (req, res) => {
        try {
            const result = await PlanningServiceClass.create(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/create: ${error.message}`);
        }
    }
    edit = async (req, res) => {
        try {
            const result = await PlanningServiceClass.update(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/edit: ${error.message}`);
        }
    }
    delete = async (req, res) => {
        try {
            const result = await PlanningServiceClass.dissolveMany(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/delete: ${error.message}`);
        }
    }

    updateOrdersPositionsInPlanning = async (req, res) => {
        try {
            const result = await PlanningServiceClass.updateOrdersPositionsInPlanning(req, req.headers.timezone);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/updateOrdersPositionsInPlanning: ${error.message}`);
        }
    };

    moveOrderloadtoload = async (req, res) => {
        try {
            const result = await PlanningServiceClass.moveorderloadtoload(req, req.headers.timezone, req.user);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/moveOrderloadtoload: ${error.message}`);
        }
    };

    creatPlanningByAlgo = async (req, res) => {
        try {
            const result = await PlanningServiceClass.creatPlanningByAlgoNew(req.body, res);
            // return res.send(result);
        } catch (error) {
            console.log(`creatPlanningByAlgo: ${error.message}`)
            this.errorHandler.requestError(res, `PlanningController/creatPlanningByAlgo: ${error.message}`);
        }
    };

    confirm = async (req, res) => {
        try {
            const result = await PlanningServiceClass.confirm(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/confirm: ${error.message}`);
        }
    };

    strictConfirm = async (req, res) => {
        try {
            const result = await PlanningServiceClass.strictConfirm(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/strictConfirm: ${error.message}`);
        }
    };

    sequence = async (req, res) => {
        try {
            const result = await PlanningServiceClass.sequence(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/sequence: ${error.message}`);
        }
    };

    planningSequence = async (req, res) => {
        try {
            const result = await PlanningServiceClass.planningSequence(req);
            return res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/planningSequence: ${error.message}`);
        }
    }

    addMultiOrdersInLoadOnMap = async (req, res) => {
        try {
            const result = await PlanningServiceClass.addMultiOrdersInLoadOnMap(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/addMultiOrdersInLoadOnMap: ${error.message}`);
        }
    };

    unplan = async (req, res) => {
        try {
            const result = await PlanningServiceClass.unplanOrders(req, true);
            res.json(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/unPlanOrders: ${error.message}`);
        }
    }

    unPlanInPlanning = async (req, res) => {
        try {
            const result = await PlanningServiceClass.unPlanInPlanning(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/unPlanInPlanning: ${error.message}`);
        }
    };

    getByDriverId = async (req, res) => {
        try {
            const result = await PlanningServiceClass.getByDriverId(req)
            res.json(result)
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningController/getByDriverId: ${error.message}`);
        }
    };

    changeOnWayStatus = async (req, res) => {
        try {
            const result = await PlanningServiceClass.changeOnWayStatus(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningServiceClass/changeOnWayStatus: ${error.message}`);
        }
    };

    calculation = async (req, res) => {
        try {
            const result = await PlanningServiceClass.calculation(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningServiceClass/calculation: ${error.message}`);
        }
    };

    finished = async (req, res) => {
        try {
            const result = await PlanningServiceClass.finished(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningServiceClass/finished: ${error.message}`);
        }
    };

    updateETA = async (req, res) => {
        try {
            const result = await PlanningServiceClass.updateETA(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningServiceClass/updateETA: ${error.message}`);
        }
    };

    updateLastLocation = async (req, res) => {
        try {
            const result = await PlanningServiceClass.updateLastLocation(req);
            return res.send(result);
        } catch (error) {
            this.errorHandler.requestError(res, `PlanningServiceClass/updateLastLocation: ${error.message}`);
        }
    }
};

module.exports = PlanningController = new PlanningController();