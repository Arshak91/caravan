const fs = require("fs");
const mime = require("mime");
const path = require("path");
const PiecetypeService = require("./pieceType.service");
const HandlingUnitService = require("./handlingUnit.service");
const HandlingUnitServiceClass = new HandlingUnitService()
const BaseService = require("../main_classes/base.service");
const GeneralHelper = require("../main_classes/general.service");
const GeneralHelperClass = new GeneralHelper()
const OrderHelper = require("../helpers/orderHelpers");
const OrderHelperClass = new OrderHelper();
const ImageService = require("./image.service");
const ImageServiceClass = new ImageService();


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

class UploaderService extends BaseService {


    constructor(params) {
        super();
        if (params) {
            this.units = params.units;
            this.orderId = params.orderId;
            this.req = params.req;
        }
    }

    async saveHandlingUnits(data){
        let { req, units, orderId } = data;
        const handlingUnit = [];
        let Images = [];
        if (!units.length) return 0;
        for (const unit of units) {
            let saveImages, removedImages;
            if (unit.images && unit.images.length) {
                saveImages = await this.saveHandlingUnitsImages(unit.images, req);
                Images = saveImages.data.createImg;
            }
            if (unit._id) {
                if (unit.removedImages && unit.removedImages.length) {
                    const removedImg = await this.removeHandlingUnitImages(unit.removedImages, unit.id);
                    removedImages = removedImg.data
                }
            }
            const unitSaved = await this.saveHandlingUnit(unit, orderId, {Images, removedImg: removedImages});
            handlingUnit.push(unitSaved);
        }
        return {
            "handlingUnit": handlingUnit,
            Images
        };
    }

    async saveHandlingUnit(data, orderId, ImageData){
        let handling, volume, piece, where;
        let {Images, removedImg} = ImageData;
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
                    piece = await PiecetypeService.getOne({where})
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
                    piece = await PiecetypeService.getOne({where})
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
            specialneeds: data.specialneeds ? data.specialneeds : null,
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
            hazmat: data.hazmat,
            density: piece ? piece.density : null,
            volume: volume,
            order: orderId
        };
        if(Images && Images.length) {
            if(data._id) {
                body["$push"] = {
                    images: {
                        $each: Images
                    }
                }
            } else {
                body["images"] = Images
            }
        }
        if (data._id) {
            if(removedImg && removedImg.length) {
                body["$pullAll"] = {
                    images: removedImg
                }
            }
            handling = await HandlingUnitServiceClass.update({
                where: {
                    _id: data._id
                },
                data: body
            });
        } else {
            handling = await HandlingUnitServiceClass.create({
                data: body
            });
        }
        return handling;
    }

    async saveHandlingUnitsImages(images, req){
        let error, msg, createImg = [], failImg = [];
        for (const [i, image] of images.entries()) {
            let matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
            response = {};

            if (matches.length !== 3) {
                return this.getResponse(0, "file is invalid");
            }
            response.type = matches[1];
            response.data = Buffer.from(matches[2], "base64");
            let imageBuffer = response.data, { type } = response;
            const extension = mime.getExtension(type);
            let fileName = `image${i}_${Date.now()}.` + extension, photo;
            console.log(__dirname)
            let joinPath = path.join(__dirname, "../../resources/0/images/");
            console.log(fs.existsSync(joinPath))
            if (!fs.existsSync(joinPath)){
                fs.mkdirSync(joinPath, { recursive: true });
            }
            if (allowedExtensions.includes(type)) {
                console.log(`Action: Save Image -> File Path: ${joinPath}${fileName} , File Name: ${fileName}`);
                let getInfo = await GeneralHelperClass.getRemoteInfoForKey(req);
                let { urls } = await OrderHelperClass.getOrderImagePath("images", fileName, getInfo.host, __dirname);
                console.log(urls.Path);
                fs.writeFileSync(`${joinPath}${fileName}`, imageBuffer, "utf8");
                const imgBody = {
                    image_url: urls.Path,
                    filename: fileName
                };
                photo = await ImageServiceClass.create({
                    ...imgBody
                });
                createImg.push(photo.data._id)
            } else {
                failImg.push({
                    status: 0,
                    msg: "image mimeType is invalid"
                })
            }
        }
        return this.getResponse(1, "OK", { createImg, failImg });
    }

    async removeHandlingUnitImages(imageIds, unitId) {
        const images = await ImageServiceClass.getAllWitoutPagination({
            _id: { $in: imageIds }
        });
        let removedImg = []
        if (images.status) {
            for (const image of images.data) {
                if (imageIds.includes(image._id.toString())) {
                    let filePath = path.join(__dirname, `../../resources/0/images/${image.filename}`)
                    await ImageServiceClass.delete({
                        _id: image._id
                    });
                    console.log(`Action: Remove ->  Image Path: ${filePath}`);
                    !fs.existsSync(filePath) ? null : fs.unlinkSync(filePath);
                    removedImg.push(image._id.toString())
                }
            }
            return await this.getResponse(1, "Image successfully deleted", removedImg);
        } else {
            return await this.getResponse(0, "such images doesn't exist", removedImg);
        }
    }
};

module.exports = UploaderService;
