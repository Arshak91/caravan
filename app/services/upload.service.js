const Uploads = require("../newModels/uploadsModel");
const BaseService = require("../main_classes/base.service");

class Upload extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.data = params.data;
            this.where = params.where;
        }
    }

    async create(data){
        let { UUID, FileName, failed, userId } = data;
        let status = 1, message = "Upload created", theUpload;
        theUpload = await Uploads.create({
            status: status,
            UUID: UUID ? UUID : null,
            FileName: FileName ? FileName : null,
            failed: failed ? failed : null,
            user: userId ? userId : null,
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        if (!theUpload) {
            message = "Upload not created";
            status = 0;
        }
        return this.getResponse(status, message, theUpload);

    }

    async edit(data) {
        let { UUID, FileName, failed, userId, orderCount, status } = data;

        let updateUpload, message = "Upload updated";
        if (failed && failed.length > 0) {
            status = 0;
        }
        updateUpload = await Uploads.findOneAndUpdate({
            UUID: UUID
        }, {
            status: status,
            failed: failed ? failed : null,
            FileName: FileName ? FileName : null,
            user: userId ? userId : null,
            orderCount: orderCount ? orderCount : 0
        }, { new : true }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!updateUpload) {
            message = "Upload not updated!";
            status = 0;
        }
        return this.getResponse(status, message, updateUpload);
    }

    getAll = async (data) => {
        let uploads, count;
        let pagination = await this.pagination.sortAndPagination(data.query);
        let fillter = await this.fillters.uploadFilter(data.query);
        let { limit, offset, order } = pagination;
        count = await Uploads.countDocuments({...fillter});
        uploads = await Uploads.find({...fillter}).sort(order).limit(limit).skip(offset);
        return this.getResponse(1, "Upload List", {uploads, count});
    }
    getOne = async (where) => {
        let upload, message = "Success", status = 1;
        upload = await Uploads.findOne({...where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!upload) {
            message = "Such Upload doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, upload);
    }
    getByUUID = async (req) => {
        let uuid = req.params.uuid;
        let upload, message = "Success", status = 1;
        upload = await Uploads.findOne({UUID: uuid}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!upload) {
            message = "Such Upload doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, upload);
    };

    delete = async (data) => {
        let upload, message = "Upload(s) successfully deleted", status = 1, { ids } = data.body;
        upload = await Uploads.deleteMany({
            _id: {
                $in: ids
            }
        });
        if (!upload) {
            message = "Such Upload doesn't exist";
            status = 0;
        }
        return this.getResponse(status, message, upload);
    }
};

module.exports = Upload;
