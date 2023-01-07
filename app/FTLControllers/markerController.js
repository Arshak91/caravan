const MarkerService = require("../services/marker.service");
const MarkerServiceClass  = new MarkerService();
const BaseService = require("../main_classes/base.controller");


class MarkerController extends BaseService {
    constructor() {
        super()
    }

    getMainMarker = async (req, res) => {
        try {
            const result = await MarkerServiceClass.getMainMarker(req.query);
            res.writeHead(200, {'Content-Type': 'image/svg+xml'});
            res.write(result);
            res.end();
        } catch (error) {
            this.errorHandler.requestError(res, 'MarkerController/getMainMarker');
        }
    };
    getMarker = async (req, res) => {
        try {
            const result = await MarkerServiceClass.getMarker(req.query);
            res.writeHead(200, {'Content-Type': 'image/svg+xml'});
            res.write(result);
            res.end();
        } catch (error) {
            this.errorHandler.requestError(res, 'MarkerController/getMarker');
        }
    };
    getUnplannedMarker = async (req, res) => {
        try {
            const result = await MarkerServiceClass.getUnplannedMarker(req.query);
            res.writeHead(200, {'Content-Type': 'image/svg+xml'});
            res.write(result);
            res.end();
        } catch (error) {
            this.errorHandler.requestError(res, 'MarkerController/getUnplannedMarker');
        }
    };
    getPlannedMarker = async (req, res) => {
        try {
            const result = await MarkerServiceClass.getPlannedMarker(req.query);
            res.writeHead(200, {'Content-Type': 'image/svg+xml'});
            res.write(result);
            res.end();
        } catch (error) {
            this.errorHandler.requestError(res, 'MarkerController/getPlannedMarker');
        }
    };
    getEventMarker = async (req, res) => {
        try {
            const result = await MarkerServiceClass.getEventMarker(req.query);
            res.writeHead(200, {'Content-Type': 'image/svg+xml'});
            res.write(result);
            res.end();
        } catch (error) {
            this.errorHandler.requestError(res, 'MarkerController/getEventMarker');
        }
    };
    getDeliveryTruckMarker = async (req, res) => {
        try {
            const result = await MarkerServiceClass.getDeliveryTruckMarker(req.query);
            res.writeHead(200, {'Content-Type': 'image/svg+xml'});
            res.write(result);
            res.end();
        } catch (error) {
            this.errorHandler.requestError(res, 'MarkerController/getDeliveryTruckMarker');
        }
    };
    getDepotMarker = async (req, res) => {
        try {
            const result = await MarkerServiceClass.getDepotMarker(req.query);
            res.writeHead(200, {'Content-Type': 'image/svg+xml'});
            res.write(result);
            res.end();
        } catch (error) {
            this.errorHandler.requestError(res, 'MarkerController/getDepotMarker');
        }
    };
}

module.exports = MarkerController = new MarkerController();
