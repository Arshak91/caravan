const authJwt = require("./verifyJwtToken");
const validator = require("../middlewares/validator");
const permisions = require("../middlewares/permision");

module.exports = function(app) {
    // Auth
    const AuthController = require("../FTLControllers/auth.controller");

    const RoleController = require("../FTLControllers/rolesController");
    const UserController = require("../FTLControllers/userController");
    const Ordercontroller = require("../FTLControllers/ordersController");
    const PermisionController = require("../FTLControllers/permisionsController");
    const SettingsController = require("../FTLControllers/settingsController");
    const DepoController = require("../FTLControllers/depoController");
    const handlingUnit_controller = require("../FTLControllers/handlingUnitController");
    const upload_controller = require("../FTLControllers/uploadController");
    const LocatioTypeController = require("../FTLControllers/locationTypeController");
    const AccessorialController = require("../FTLControllers/accessorialController");
    const PieceTypeController = require("../FTLControllers/pieceTypeController");
    const StatusController = require("../FTLControllers/statusController");
    const ShiftController = require("../FTLControllers/shiftController");
    const LocationController = require("../FTLControllers/locationController");
    const DriverController = require("../FTLControllers/driverController");
    const HandlingTypeController = require("../FTLControllers/handlingTypeController");
    const EquipmentTypeController = require("../FTLControllers/equipmentTypesController");
    const FreightClassesController = require("../FTLControllers/freightclassController");
    const FlowtypeController = require("../FTLControllers/flowtypeController");
    const EquipmentController = require("../FTLControllers/equipmentController");
    const PlanningController = require("../FTLControllers/planningController");
    const MathController = require("../FTLControllers/mathController");
    const MarkerController = require("../FTLControllers/markerController");
    const LoadsController = require('../FTLControllers/loadsController');
    const CZoneController = require('../FTLControllers/czoneController');
    const TransportTypeController = require('../FTLControllers/transportTypeController');
    const SpecialNeedController = require('../FTLControllers/specialNeedsController');
    const AssetsController = require('../FTLControllers/assetsController');
    const JobController = require("../FTLControllers/jobController");
    const NotificationController = require("../FTLControllers/notifiactionsController");
    const FileController = require("../FTLControllers/fileController");
    const ScriptController = require("../FTLControllers/scriptController");
    /****************************************************************************************************************************** */
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "timezone, x-access-token, Origin, Content-Type, Accept, url");
        next();
    });

    app.post("/auth/signin", AuthController.signin);
    app.post("/auth/signUp", validator.register, AuthController.signUp);

    app.get("/api/*", [authJwt.verifyToken], PermisionController.checkPermisions, (req, res, next) => {
        next();
    });
    app.get("/api/*/:id", [authJwt.verifyToken], PermisionController.checkPermisions, (req, res, next) => {
        next();
    });
    app.put("/api/*", [authJwt.verifyToken], PermisionController.checkPermisions, (req, res, next) => {
        next();
    });
    app.post("/api/*", [authJwt.verifyToken], PermisionController.checkPermisions, (req, res, next) => {
        next();
    });
    app.delete("/api/*", [authJwt.verifyToken], PermisionController.checkPermisions, (req, res, next) => {
        next();
    });

    app.post("/apiKey/*", [authJwt.verifyApiKey], (req, res, next) => {
        next();
    });

    // Roles API
    app.get("/roles", RoleController.getAll);

    app.post("/api/auth/changepassword", UserController.changePassword);//
    app.post("/api/signout", AuthController.logOut);

    // Markers
    app.get("/main-marker", MarkerController.getMainMarker);
    app.get("/marker", MarkerController.getMarker);
    app.get("/unplanned-marker", MarkerController.getUnplannedMarker);
    app.get("/planned-marker", MarkerController.getPlannedMarker);
    app.get("/event-marker", MarkerController.getEventMarker);
    app.get("/delivery-truck-marker", MarkerController.getDeliveryTruckMarker);
    app.get("/depot-marker", MarkerController.getDepotMarker);

    // order API
    app.post("/api/getAll/orders", Ordercontroller.getAll); // 1
    app.get("/api/orders/:id", Ordercontroller.getById); // 2
    app.post("/api/few/orders", Ordercontroller.getFew); // 3
    app.post("/api/orders", Ordercontroller.create); // 4
    app.put("/api/orders", Ordercontroller.edit); // 5
    app.delete("/api/orders", Ordercontroller.deleted); // 6
    app.post("/api/upload/orders", Ordercontroller.upload); // 7
    app.get("/api/orders/get/status", upload_controller.getOneStatus); // 8
    app.put("/api/orders-bulk-edit", Ordercontroller.bulkEdit); // 9
    app.post("/api/order/count", Ordercontroller.getAutoPlanCount);
    app.get("/images/:file", [Ordercontroller.getImage], FileController.getFile);
    // app.put("/test/ordersUpdate", Ordercontroller.updateTest)
    // app.post("/drop/collection", Ordercontroller.resetModel);

    // APIKey
    app.post("/apiKey/upload/orders", Ordercontroller.uploadByApiKey);

    // handlingUnits API
    app.post("/api/getAll/handlingunits", handlingUnit_controller.getAll); //
    app.get("/api/handlingunits/:id", handlingUnit_controller.getById); //
    // app.put("/api/handlingunits", handling_unit.edit);
    // app.post("/api/handlingunits", handlingUnit_controller.create);
    // app.delete("/api/handlingunits", handlingUnit_controller.delete);

    // Uploads API
    app.get("/api/uploads", upload_controller.getAll);
    app.get("/api/upload/uuid/:uuid", upload_controller.getByUUID);
    app.delete("/api/uploads", upload_controller.delete);

    // CZones API
    app.post("/api/getAll/czones", CZoneController.getAll);
    app.get("/api/czones/:id", CZoneController.getById);
    app.post("/api/czones", CZoneController.create);
    app.put("/api/czones", CZoneController.edit);
    app.delete("/api/czones", CZoneController.delete);

    // TransportType API
    app.post("/api/getAll/ttypes", TransportTypeController.getAll);
    app.get("/api/ttypes/:id", TransportTypeController.getById);
    app.post("/api/ttypes", TransportTypeController.create);
    app.put("/api/ttypes", TransportTypeController.edit);
    app.delete("/api/ttypes", TransportTypeController.delete);

    // SpecialNeeds API
    app.post("/api/getAll/specials", SpecialNeedController.getAll);
    app.get("/api/specials/:id", SpecialNeedController.getById);
    app.post("/api/specials", SpecialNeedController.create);
    app.put("/api/specials/:id", SpecialNeedController.edit);
    app.delete("/api/specials", SpecialNeedController.delete);

    // settings API
    app.get("/api/settings", SettingsController.getOne);
    app.put("/api/settings", SettingsController.edit);

    // permissions API
    app.get("/api/permisions", PermisionController.getAll);

    // depot API
    app.post("/api/getAll/depos", DepoController.getAll);
    app.get("/api/depo/:id", DepoController.getById);
    app.post("/api/depos", DepoController.create);
    app.put("/api/depo", DepoController.edit);
    app.delete("/api/depo", DepoController.delete);

    // Location types
    app.get("/api/locationtypes", LocatioTypeController.getAll);

    // Accessorial API
    app.get("/api/accessorials", AccessorialController.getAll);

    // Piecetype API
    app.get("/api/piecetypes", PieceTypeController.getAll);

    // EquipmentTypes API
    app.get("/api/equipmentTypes", EquipmentTypeController.getAll);

    // Statuses API
    app.get("/api/statuses", StatusController.getAll);

    // Shift API
    app.post("/api/shifts", ShiftController.getAll);
    app.put("/api/shifts/:id", ShiftController.edit);

    // Locations API
    app.post("/api/getAll/userLocation", LocationController.getAll);
    app.get("/api/userLocation/:id", LocationController.getById);
    app.post("/api/userLocation", LocationController.create);
    app.delete("/api/userLocation", LocationController.delete);
    app.put("/api/userLocation", [LocationController.edit], PlanningController.unplan);

    // Driver API
    app.post("/api/getAll/drivers", DriverController.getAll);
    app.post("/api/drivers", DriverController.create);
    app.put("/api/drivers", DriverController.edit);
    app.delete("/api/drivers", DriverController.delete);
    app.post("/api/drivers-quick", DriverController.quickCreate);
    app.post("/api/driver/user", DriverController.createUser);

    // HandlingType API
    app.post("/api/getAll/handlingTypes", HandlingTypeController.getAll);
    app.get("/api/handlingTypes/:id", HandlingTypeController.getById);
    app.post("/api/handlingTypes", HandlingTypeController.create);
    app.put("/api/handlingTypes", HandlingTypeController.edit);
    // await LocationHelperClass.callToUnPlanOrders({
    //     updOrders,
    //     timezone,
    //     user
    // })
    app.delete("/api/handlingTypes", HandlingTypeController.delete);

    // FreightClasses API
    app.get("/api/freightclasses", FreightClassesController.getAll);

    // Flowtype API
    app.post("/api/getAll/flowtype", FlowtypeController.getAll);

    // Equipment API
    app.post("/api/getAll/equipment", EquipmentController.getAll);
    app.get("/api/equipments/:id", EquipmentController.getById);
    app.post("/api/equipment", EquipmentController.create);
    app.put("/api/equipment", EquipmentController.edit);
    app.delete("/api/equipment", EquipmentController.delete);

    // Assets API
    app.post("/api/getAll/asset", AssetsController.getAll);
    app.get("/api/assets/:id", AssetsController.getById);
    app.post("/api/asset", AssetsController.create);
    app.put("/api/asset", AssetsController.edit);
    app.delete("/api/asset", AssetsController.delete);

    // Planning API
    app.post("/api/getAll/loadtemps", PlanningController.getAll);
    app.post("/api/loadtemp/getMany", PlanningController.getAllWitOutPagination);
    app.post("/api/loadtemps", PlanningController.create);
    app.delete("/api/loadtemps", PlanningController.delete);
    app.put("/api/loadtemps/:id", PlanningController.edit);
    app.post('/api/load/confirm', PlanningController.confirm);
    app.post('/api/load/strict/confirm', PlanningController.strictConfirm);
    app.put('/api/loadtemps/edit/sequences', PlanningController.sequence);
    app.post("/autoplan", PlanningController.creatPlanningByAlgo);
    app.post("/planning/sequence", PlanningController.planningSequence);

    // Driver Plannings

    app.post("/api/driver/plannings", PlanningController.getByDriverId) // 100
    app.get("/api/load/statuses", StatusController.getLoadStatuses); // 101
    app.get("/api/order/statuses", StatusController.getOrderStatuses); // 102
    app.get("/api/loads/:id", PlanningController.getByDriverAndById); // 103
    app.get("/api/drivers/:id", DriverController.getById); // 104
    app.post("/api/loads/changestatus/:id", PlanningController.changeOnWayStatus); // 105
    app.post("/api/orders/changestatus/:id", Ordercontroller.changeOnWayStatus, PlanningController.calculation); // 106
    app.post("/api/loads/driver/finish", PlanningController.finished); // 107
    app.post("/api/driver/loadsETA", PlanningController.updateETA); // 108
    app.post("/api/driver/lastLocation", PlanningController.updateLastLocation); // 109
    // app.post("/api/proof/approve"

    // orders in Planning
    app.put("/api/order/unplan", PlanningController.unplan);
    app.put("/api/order/unPlan/inPlanning", PlanningController.unPlanInPlanning);


    app.post("/api/loadtemps/updateOrdersPositionsInPlanning", PlanningController.updateOrdersPositionsInPlanning);
    app.post("/api/loadtemps/moveorderloadtoload", PlanningController.moveOrderloadtoload);
    app.put("/api/loadtemps/multi/addorderinload/map", PlanningController.addMultiOrdersInLoadOnMap);

    // Math
    app.post("/api/math/execute", MathController.execute);
    app.post("/api/math/executetime", MathController.executeTime);
    app.post("/api/math/cancel", MathController.cancel)

    // Job API
    app.post("/api/getAll/jobs", JobController.getAll);
    app.get("/api/jobs/:id", JobController.getById);
    app.get("/api/jobs/status", JobController.status);
    app.delete("/api/jobs", JobController.delete);


    // loads
    // app.post('/api/load/confirm', LoadsController.confirm);
    app.post("/api/getAll/loads", LoadsController.getAll);
    app.get("/api/load/:id", LoadsController.getById);

    // Notifications
    app.get("/api/notification/getList", NotificationController.getAll);
    app.put("/api/notification/seen", NotificationController.seen);
    app.get("/api/notification/setAllNotificationSeen", NotificationController.setAllNotificationSeen);
    app.get("/api/notification/:id", NotificationController.getById);
    app.delete("/api/notification/delete", NotificationController.delete);
    app.post('/planning/engine/error', MathController.handleError);

    // Scripts
    app.get("/locations/ID", ScriptController.script)
};
