const Image = require("../newModels/imageModel");
const BaseService = require("../main_classes/base.service");

class ImageService extends BaseService {
    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }
    getAll = async (body) => {
        let images, status = 1, message = "Images List", count;
        let pagination = await this.pagination.sortAndPagination(body.query)
        let fillter = await this.fillters.imageFilter(body.query)

        let { limit, offset, order } = pagination;
        count = await Image.countDocuments({...fillter});
        images = await Image.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                status = 0;
                message = err.message;
            }
        });
        return this.getResponse(status, message, {images, count});
    }
    getAllWitoutPagination = async (where) => {
        let images;
        images = await Image.find({...where});
        return this.getResponse(1, "ok", images);
    }

    create = async (body) => {
        let image, status = 1, message = "Successfully created";
        image = await Image.create({
            ...body
        }).catch(err => {
            if (err) {
                status = 0;
                message = err.message;
            }
        });
        return this.getResponse(status, message, image);
    }
    update = async () => {
        let image, status = 1, message = "Successfully updated";
        image = await Image.findOneAndUpdate({...this.where}, {
            ...this.data
        }, {new: true}).catch(err => {
            if (err) {
                status = 0;
                message = err.message;
            }
        });
        return this.getResponse(status, message, image);
    }
    delete = async (where) => {
        let image;
        image = await Image.deleteMany({...where});
        return this.getResponse(1, "Successfully deleted", image);
    }
};

module.exports = ImageService;
