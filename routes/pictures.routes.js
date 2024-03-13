const pictures = require("../controllers/pictures.controller");
module.exports = app => {
    const pictures = require("../controllers/pictures.controller");

    var router = require("express").Router();


    router.get('/(:id).jpeg', pictures.findOne);
    router.delete('/', pictures.delete);
    router.post("/savePicture", pictures.create);
    router.post('/setIndex', pictures.setIndex);
    router.post('/rotate', pictures.rotate);
    router.post('/updatePictureIndexByRange', pictures.updatePictureIndexByRange);
    
    app.use('/pictures', router);
};