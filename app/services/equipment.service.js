const BaseService = require("../main_classes/base.service");
const Equipment = require("../newModels/equipmentModel");
const AssetsSchema = require("../newModels/assetsModel");
const EquipmentHelper = require("../helpers/equipmentHelpers");
const EquipmentHelperClass = new EquipmentHelper();


class EquipmentService extends BaseService {
    constructor() {
        super();
    }

    getAll = async (body) => {
        let pagination = await this.pagination.sortAndPagination(body.body);
        let fillter = await this.fillters.equipmentFilter(body.body);
        let equipments, message = "Equipment list", status = 1, count;
        let { limit, offset, order } = pagination;
        count = await Equipment.countDocuments({...fillter});
        equipments = await Equipment.find({...fillter}).sort(order).limit(limit).skip(offset).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, {equipments, count});
    };

    getOne = async (where) => {
        let equipment, message = "Success", status = 1;
        equipment = await Equipment.findOne({...where}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, equipment);
    };

    getById = async (req) => {
        let _id = req.params.id;
        let equipment, message = "Success", status = 1;
        equipment = await Equipment.findById(_id).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        });
        return this.getResponse(status, message, equipment);
    };

    create = async (data) => {
        let status = 1, message = "Equipment successfully created!";
        const eequipmentModel = await EquipmentHelperClass.getEquipmentModel(data)
        const equipment = await Equipment.create(eequipmentModel).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.getResponse(status, message, equipment);
    };

    edit = async (data) => {
        let status = 1, message = "Equipment successfully updated";
        const eqId = data._id;
        const equipmentModel = await EquipmentHelperClass.getEquipmentModel(data, true)
        const equipment = await Equipment.findOneAndUpdate({ _id: eqId }, equipmentModel, { new: true}).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.getResponse(status, message, equipment);
    }

    delete = async (data) => {
        let status = 1, message = "Equipment(s) successfully deleted";
        let { ids } = data, deletedIds = [], notDeletedIds = [];
        for (const id of ids) {
            let assets = await AssetsSchema.findOne({
                equipment: id
            })
            if (!assets) {
                deletedIds.push(id)
            } else {
                notDeletedIds.push(id)
            }
        }
        const notDeletedEquipmentsIDS = notDeletedIds.length ? await Equipment.find({
            _id: { $in: notDeletedIds}
        }).distinct("ID") : [];
        await Equipment.deleteMany({
            _id: {
                $in: deletedIds
            }
        }).catch(err => {
            if (err) {
                message = err.message;
                status = 0;
            }
        })
        return this.getResponse(status, message, {notDeletedEquipmentsIDS, notDeletedIds});
    };

    updateTest = async (data) => {
        let { ids } = data.body;
        for (const [i, id] of ids.entries()) {
            await Equipment.findByIdAndUpdate(id, {ID: i+1}, { new: true});
        }
        return this.getResponse(1, "Ok");
    }
};

module.exports = EquipmentService;