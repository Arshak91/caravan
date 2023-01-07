const LocationSchema = require("../newModels/locationModel");
const EquipmentSchema = require("../newModels/equipmentModel");
const AssetsSchema = require("../newModels/assetsModel");
const DepotsSchema = require("../newModels/depoModel");
const BaseService = require("../main_classes/base.service");

class ScriptService extends BaseService {
    constructor() {
        super();
    }

    update = async () => {
        const [depots, locations, equipments, assets] = await Promise.all([
            DepotsSchema.find({}, null, {sort: {'_id': 1}}),
            LocationSchema.find({}, null, {sort: {'_id': 1}}),
            EquipmentSchema.find({}, null, {sort: {'_id': 1}}),
            AssetsSchema.find({}, null, {sort: {'_id': 1}}),
        ]);
        let count = depots.length;
        count < locations.length ? count = locations.length : null;
        count < equipments.length ? count = equipments.length : null;
        count < assets.length ? count = assets.length : null;
        let ID = 1000;
        for (let i = 0; i < count; i++) {
            depots[i] ? await DepotsSchema.findByIdAndUpdate(depots[i]._id, {
                ID: ID
            }) : null;
            locations[i] ? await LocationSchema.findByIdAndUpdate(locations[i]._id, {
                ID: ID
            }) : null;
            equipments[i] ? await EquipmentSchema.findByIdAndUpdate(equipments[i]._id, {
                ID: ID
            }) : null;
            assets[i] ? await AssetsSchema.findByIdAndUpdate(assets[i]._id, {
                ID: ID
            }) : null;
            console.log(ID)
            ID += 1;
        }
        return this.getResponse(1, ID)
    }
};

module.exports = ScriptService;