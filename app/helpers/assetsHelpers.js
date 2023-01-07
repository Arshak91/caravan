const GeneralHelper = require("../main_classes/general.service");
// Schema
const AssetSchema = require("../newModels/assetsModel");
class AssetstHelper extends GeneralHelper {
    getAssetsModel = async (data, edit) => {
        const lastID = await this.getLastID(AssetSchema);
        let model = {
            name: data.name,
            companyType: data.companyType,
            equipment: data.equipment,
            platNumber: data.platNumber,
            attachment: data.attachment,
            licenses: data.licenses,
            VIN: data.VIN,
            brand: data.brand,
            cabinType: data.cabinType,
            inspaction: data.inspaction,
            yom: data.yom,
            model: data.model,
            exploitation: data.exploitation,
            info: data.info,
            depo: data.depo,
        };
        model = await this.trim(model, edit);
        !edit ? model["ID"] = lastID ? lastID+1 : 1000 : null;
        return model;
    }
}
module.exports = AssetstHelper;