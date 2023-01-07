const BaseService = require("../main_classes/base.service");
const Assets = require("../newModels/assetsModel");
const AssetsHelper = require("../helpers/assetsHelpers");
const AssetsHelperClass = new AssetsHelper();


class AssetService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.body);
        let fillter = await this.fillters.assetFilter(body.body);
        let assets, message = "asset list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await Assets.countDocuments({...fillter});
        assets = await Assets.find({...fillter}).populate("depo").sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {assets, count});
    };

    getOne = async (where) => {
        let asset, message = "Success", status = 1;
        asset = await Assets.findOne({...where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, asset);
    };

    getById = async (req) => {
        let _id = req.params.id;
        let asset, message = "Success", status = 1;
        asset = await Assets.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, asset);
    };

    create = async (data) => {
        let status = 1, message = "Asset successfully created!";
        const assetModel = await AssetsHelperClass.getAssetsModel(data)
        const asset = await Assets.create(assetModel).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.getResponse(status, message, asset);
    };

    edit = async (data) => {
        let status = 1, message = "Asset successfully updated";
        const eqId = data._id;
        const assetModel = await AssetsHelperClass.getAssetsModel(data, true)
        const asset = await Assets.findOneAndUpdate({ _id: eqId }, assetModel, { new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.getResponse(status, message, asset);
    }

    delete = async (data) => {
        let status = 1, message = "Asset successfully deleted";
        const assetIds = data.ids;
        const asset = await Assets.deleteMany({
            _id: {
                $in: assetIds
            }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.getResponse(status, message, asset);
    }
};

module.exports = AssetService;