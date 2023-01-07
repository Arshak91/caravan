const fs = require("fs");
const mime = require("mime");
const Helpers = require("../FTLClasses/helpersFTL");
const HandlingUnitClass = require("../FTLClasses/handlingUnit");
const PieceTypeClass = require("../FTLClasses/pieceType");
const ImageClass = require("../FTLClasses/image");
const pieceType = require("../newModels/pieceTypeModel");
// const HandlingUnit = db.handlingUnit;
// const Images = db.image;
const allowedExtensions = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/x-icon",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/svg+xml",
    "image/webp"
];

module.exports = class Uploader {


    constructor(params) {
        if (params) {
            this.units = params.units;
            this.orderId = params.orderId;
            this.req = params.req;
        }
    }

    async saveHandlingUnits(){
        const handlingUnit = [];
        const Images = [];
        if (!this.units.length) return 0;
        for (const unit of this.units) {
            const unitSaved = await this.saveHandlingUnit(unit, this.orderId);
            handlingUnit.push(unitSaved);
            let saveImages;
            if (unit.images && unit.images.length) {
                saveImages = await this.saveHandlingUnitsImages(unit.images, unitSaved.id, this.req);
                Images.push(saveImages);
            }
            if (unit.id) {
                if (unit.removedImages && unit.removedImages.length) {
                    await this.removeHandlingUnitImages(unit.removedImages, unit.id);
                }
            }
        }
        return {
            "handlingUnit": handlingUnit,
            Images
        };
    }

    async saveHandlingUnit(data, orderId){
        let handling, volume, piece, where;
        if (data.volume) {
            volume = data.volume;
        } else {
            let piecetypeCl;
            if (!data.sku) {
                if (data.piecetype_id || (data.piecetype_id && data.freightclasses_id)) {
                    if (data.freightclasses_id) {
                        where = {
                            _id: data.piecetype_id,
                            freightclasses_id: data.freightclasses_id
                        };
                    } else {
                        where = {
                            _id: data.piecetype_id,
                        };
                    }
                    piecetypeCl = new PieceTypeClass({where: where})
                    piece = await piecetypeCl.getOne()
                    volume = piece.status ? data.Weight/piece.data.density : null;
                } else if (data.Length && data.Width && data.Height) {
                    volume = data.Length * data.Width * data.Height;
                } else {
                    volume = null;
                }
            } else {
                if (data.piecetype_id) {
                    where = {
                        _id: data.piecetype_id,
                    };
                    piecetypeCl = new PieceTypeClass({where: where})
                    piece = await piecetypeCl.getOne()
                    volume = piece.status ? data.Weight/piece.data.density : null;
                } else {
                    volume = null;
                }
            }
        }
        let body = {
            HandlingType: data.HandlingType_id,
            Quantity: data.Quantity ? data.Quantity : 1,
            piecetype_id: data.piecetype_id ? data.piecetype_id : null,
            sku: data.sku ? data.sku : 0,
            brand: data.brand ? data.brand : 0,
            specialneeds: data.specialneeds ? data.specialneeds : 0,
            productdescription: data.productdescription,
            freightclasses_id: data.freightclasses_id ? data.freightclasses_id : null, // ?
            nmfcnumber: data.nmfcnumber, // ?
            nmfcsubcode: data.nmfcsubcode, // ?
            Weight: data.Weight ? data.Weight : 0,
            Length: data.Length ? data.Length : 0,
            Width: data.Width ? data.Width : 0,
            Height: data.Height ? data.Height : 0,
            mintemperature: data.mintemperature ? data.mintemperature : 0,
            maxtemperature: data.maxtemperature ? data.maxtemperature : 0,
            stackable: data.stackable,
            turnable: data.turnable,
            density: piece ? piece.density : null,
            volume: volume,
            order: orderId
        };
        let handlingUnitCl = new HandlingUnitClass({
            data: body,
            where: {
                id: data.id ? data.id : 0
            }
        });
        if (data.id) {
            handling = await handlingUnitCl.update();
        } else {
            handling = await handlingUnitCl.create();
        }
        return handling;
    }

    async saveHandlingUnitsImages(images, unitId, req){
        let error, msg;
        for (const [i, image] of images.entries()) {
            let matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
            response = {};

            if (matches.length !== 3) {
                return await Helpers.getResponse(0, "file is invalid");
            }
            response.type = matches[1];
            response.data = Buffer.from(matches[2], "base64");
            let decodedImg = response;
            let imageBuffer = decodedImg.data;
            let type = decodedImg.type;
            let extension = mime.getExtension(type);
            let fileName = `image${i}_${Date.now()}.` + extension;
            let path = "./resources/0/images/";
            if (!fs.existsSync(path)){
                fs.mkdirSync(path, { recursive: true });
            }
            if (allowedExtensions.includes(type)) {
                try {
                    console.log(`Action: Save Image -> File Path: ${path}${fileName} , File Name: ${fileName}`);
                    let getInfo = await Helpers.getRemoteInfoForKey(req);
                    let { urls } = await Helpers.getOrderImagePath("images", fileName, getInfo.host);
                    console.log(urls.Path);
                    fs.writeFileSync(`${path}${fileName}`, imageBuffer, "utf8");
                    const imgBody = {
                        image_url: urls.Path,
                        HandlingUnits_id: unitId,
                        filename: fileName
                    };
                    const imageCl = new ImageClass({
                        data: imgBody
                    });
                    await imageCl.create();
                    error = false;
                    msg = "image uploaded";
                } catch (e) {
                    error = true;
                    msg = e;
                }
            } else {
                error = true;
                msg = "image mimeType is invalid";
            }
        }
        if (!error) {
            return await Helpers.getResponse(1, msg);
        } else {
            return await Helpers.getResponse(0, msg);
        }
    }

    async removeHandlingUnitImages(imageIds, unitId) {
        const imageCl = new ImageClass({ where: {
            HandlingUnit: unitId
        }});
        const images = await imageCl.getAllWitoutPagination();
        if (images.status) {
            for (const image of images.data) {
                if (imageIds.includes(image._id)) {
                    let filePath = `./resources/0/images/${image.filename}`;
                    const imageCl = new ImageClass({ where: {
                        _id: image._id
                    }});
                    await imageCl.delete();
                    console.log(`Action: Remove ->  Image Path: ${filePath}`);
                    fs.unlinkSync(filePath);
                }
            }
            return await Helpers.getResponse(1, "Image successfully deleted");
        } else {
            return await Helpers.getResponse(0, "such images doesn't exist");
        }
    }
};
