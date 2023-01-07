const LocationType = require("../newModels/locationTypeModel");
const BaseService = require("../main_classes/base.service");

class LocationTypeService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async getAll(data) {
        let locationTypes, count, message = "locationTypes list", status = 1;

        let pagination = await this.pagination.sortAndPagination(data.query)
        let fillter = await this.fillters.locationTypeFilter(data.query)

        let { limit, offset, order } = pagination;
        count = await LocationType.countDocuments(fillter);
        locationTypes = await LocationType.find(fillter).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {locationTypes, count});
    }
    async getOne(where) {
        let locationType, status = 1, message = "Success";
        locationType = await LocationType.findOne({...where}).catch(async err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!locationType) {
            message = "such Location doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, locationType);
    }

    async create(body) {
        let locationType, message = "Location successfully created", status = 1;
        locationType = await LocationType.create({
            ...body
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!locationType) {
            message = "locationType doesn't created";
            status = 0;
        }
        return this.getResponse(status, message, locationType);
    }
};

module.exports = LocationTypeService;