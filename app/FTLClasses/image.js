const Image = require("../newModels/imageModel");
const Helpers = require("../FTLClasses/helpersFTL");

module.exports = class ImageClass {
    constructor(params) {
        this.data = params.data;
        this.where = params.where;
    }
    async getAll() {
        let images;
        let { limit, offset, order } = this.data;
        images = await Image.find({...this.where}).sort(order).limit(limit).skip(offset);
        return await Helpers.getResponse(1, "ok", images);
    }
    async getAllWitoutPagination() {
        let images;
        images = await Image.find({...this.where});
        return await Helpers.getResponse(1, "ok", images);
    }

    async create() {
        let image;
        image = await Image.create({
            ...this.data
        });
        return await Helpers.getResponse(1, "Successfully created", image);
    }
    async update() {
        let image;
        image = await Image.findOneAndUpdate({...this.where}, {
            ...this.data
        }, {new: true});
        return await Helpers.getResponse(1, "Successfully updated", image);
    }
    async delete() {
        let image;
        image = await Image.deleteMany({...this.where});
        return await Helpers.getResponse(1, "Successfully deleted", image);
    }
};
