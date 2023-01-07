const Uploads = require("../newModels/uploadsModel");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class Upload {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }

    async create(){
        let status = 1, message = "Upload created", theUpload;
        theUpload = await Uploads.create({
            status: status,
            UUID: this.data.UUID ? this.data.UUID : null,
            FileName: this.data.FileName ? this.data.FileName : null,
            failed: this.data.failed ? this.data.failed : null,
            user: this.data.userId ? this.data.userId : null,
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
        return await Helpers.getResponse(status, message, theUpload);

    }

    async edit() {
        let updateUpload, message = "Upload updated";
        let status = this.data.status;
        if (this.data.failed && this.data.failed.length > 0) {
            status = 0;
        }
        delete this.data.id;
        updateUpload = await Uploads.findOneAndUpdate({
            UUID: this.data.UUID
        }, {
            status: status,
            failed: this.data.failed ? this.data.failed : null,
            FileName: this.data.FileName ? this.data.FileName : null,
            user: this.data.userId ? this.data.userId : null,
            orderCount: this.data.orderCount ? this.data.orderCount : 0
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
        return await Helpers.getResponse(status, message, updateUpload);
    }

    async getAll() {
        let uploads, { sortAndPagination, where } = this.data, count;
        count = await Uploads.countDocuments({...this.where});
        uploads = await Uploads.find({...this.where}).sort(order).limit(limit).skip(offset);
        return await Helpers.getResponse(1, "Order List", {uploads, count});
    }
    async getOne() {
        let upload, message = "Success", status = 1;
        upload = await Uploads.findOne({...this.where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        if (!upload) {
            message = "Such Upload doesn't exist";
            status = 0;
        }
        return await Helpers.getResponse(status, message, upload);
    }
    // async delete() {
    //     let upload, { ids } = this.data;
    //     upload = await Uploads.destroy({
    //         where: {
    //             id: {
    //                 [Op.in]: ids
    //             }
    //         }
    //     });
    //     if (upload) {
    //         return {
    //             status: 1,
    //             msg: 'uploads deleted',
    //             data: {
    //                 ...upload,
    //             }
    //         };
    //     } else {
    //         return {
    //             status: 1,
    //             msg: 'upload doesn\'t exist',
    //             data: {}
    //         };
    //     }
    // }
};
