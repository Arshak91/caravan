const GeneralHelper = require("../main_classes/general.service");
// Schema
const EquipmentsSchema = require("../newModels/equipmentModel");
class EquipmentHelper extends GeneralHelper {
    getEquipmentModel = async (data, edit) => {
        const lastID = await this.getLastID(EquipmentsSchema);
        let model = {
            type: data.type,
            trailerType: null,
            name: data.name,
            horsePower: null,
            value: data.value,
            valueUnit: data.valueUnit,
            externalLength: data.externalLength,
            externalWidth: data.externalWidth,
            externalHeight: data.externalHeight,
            internalLength: data.internalLength,
            internalWidth: data.internalWidth,
            internalHeight: data.internalHeight,
            maxweight: data.maxweight,
            maxVolume: data.maxVolume,
            eqType: data.eqType,
        };
        model = await this.trim(model, edit);
        !edit ? model["ID"] = lastID ? lastID+1 : 1000 : null;
        return model;
    }
}
module.exports = EquipmentHelper;