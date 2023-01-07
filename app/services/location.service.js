const Locations = require("../newModels/locationModel");
const BaseService = require("../main_classes/base.service");
const LocationError = require("../newErrors/locationErrors");
const LocationErrorClass = new LocationError();

// Helpers
const LocationHelper = require("../helpers/locationHelpers");
const LocationHelperClass = new LocationHelper();
const OrderHelper = require("../helpers/orderHelpers");
const OrderHelperClass = new OrderHelper();

// Models
const OrderSchema = require("../newModels/ordersModel");

class locationService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    getAll = async (data) => {
        let { body } = data;
        let pagination = await this.pagination.sortAndPagination(body);
        let fields;
        if(body && body.fields) {
            fields = body.fields;
            delete body.fields;
        } else {
            fields = ""
        };
        let fillter = await this.fillters.locationFilter(body)
        let locations, count, message = "locations list", status = 1;
        let { limit, offset, order } = pagination;
        count = await Locations.countDocuments({
            ...fillter,
            $or: [
                {disable: null},
                {disable: 0},
            ]
        });
        locations = await Locations.find({
            ...fillter,
            $or: [
                {disable: null},
                {disable: 0},
            ]
        }, fields).populate("czone").populate("driver").populate("depo").sort(order).limit(limit).skip(offset).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {locations, count});
    };

    getById = async (data) => {
        let _id = data.params.id;
        let location, message = "Success", status = 1;
        location = await Locations.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!location) {
            status = 0;
            message = "such Location doesn't exist!"
        }
        return this.getResponse(status, message, location);
    };

    async getOne(where) {
        let location, status = 1, message = "Success";
        location = await Locations.findOne({...where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!location) {
            message = "such Location doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, location);
    }

    async create(data) {
        let body = await LocationHelperClass.generateModel(data)
        const errors = await LocationErrorClass.createAndEditError({
            ...body,
            _id: 1
        });
        let location, message = "Location successfully created", status = 1;
        if (!errors.status) {
            message = errors.msg;
            status = 0;
        } else {
            let { points } = errors;
            location = await Locations.create({
                ...body,
                points
            }).catch(err => {
                if (err) {
                    message = err.message;
                    status = 0;
                }
            })
        }
        return this.getResponse(status, message, location);
    };

    createForUpload = async (data) => {
        let status = 1, message = "Succefully created!";
        let body = await LocationHelperClass.generateModel(data)
        const location = await Locations.create({
            ...body
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, location);
    };

    editForUpload = async (data) => {
        let { body } = data;
        let { _id } = body, status = 1, message = "Succefully uploaded!";
        const location = await Locations.findByIdAndUpdate(_id, {
            ...body,
        }, {new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, location);
    };

    async edit(data) {
        let { timezone } = data.headers; let { user } = data;
        let location, message = "Location successfully edited", status = 1;
        let body = await LocationHelperClass.generateModel(data.body, true);
        const id = data.body._id;
        const errors = await LocationErrorClass.createAndEditError({
            ...body,
            _id: id
        });
        if (!errors.status) {
            message = errors.msg;
            status = 0;
        } else {
            let updOrders, { points } = errors;
            const oldLoc = await Locations.findById(id);
            location = await Locations.findByIdAndUpdate(id, {
                ...body,
                points
            }, {new: true}).catch(err => {
                if (err) {
                    message = err.message;
                    status = 0;
                }
            })
            if (data.body.updateMustbefirst) {
                let orders;
                orders = await OrderSchema.find({
                    locations: id,
                    $and: [
                        {isPlanned: 0},
                        {isPlanned: null},
                    ]
                });
                if (orders && orders.length > 0) {
                    const updOrd = await OrderSchema.updateMany({
                        locations: id,
                        $and: [
                            {isPlanned: 0},
                            {isPlanned: null},
                        ]
                    }, {
                        mustbefirst: data.body.mustbefirst
                    });
                    console.log(updOrd);
                }
            }
            if (data.body.updateOrders) {
                updOrders = await OrderHelperClass.changeAddressByLocation({
                    oldLocation: oldLoc._doc,
                    points
                })
                data.orderIds = JSON.stringify(updOrders);
                status = 2;
            }
        }
        return this.getResponse(status, message, location);
    }

    delete = async (data) => {
        let { ids } = data.body, status = 1, message = "Location(s) successfully disabled";

        const locations = await Locations.updateMany({ _id: {$in: ids } }, {
            disable: 1
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.getResponse(status, message, locations);
    }
};

module.exports = locationService;