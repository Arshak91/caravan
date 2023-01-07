const SettingsClass = require("../FTLClasses/settings")
const PermisionClass = require("../FTLClasses/permisions")
const Helpers = require("../FTLClasses/helpersFTL");

exports.checkPermisions = async (req, res, next) => {
    let userId = req.user._id, settings, permision;
    const settingsCl = new SettingsClass({where: {user: userId}});
    settings = await settingsCl.getOne();
    const permisionCl = new PermisionClass({where: {"url": req.headers.url}})
    permision = await permisionCl.getOne()
    let userPermisions = settings.data.get("permisions"),
    usedPermision = permision.data.get("number"),
    userPermisionConfig = settings.data.get("permisionConfig");
    if (req.user.role.name == "ADMIN") {
        next()
    } else if (userPermisionConfig || userPermisions.includes(usedPermision)) {
        next()
    }else {
        res.json(await Helpers.getResponse(0, "permision danied"));
    }
}