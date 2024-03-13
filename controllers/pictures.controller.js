const db = require("../models");
const Pictures = db.pictures;
const Op = db.Sequelize.Op;
const auth = require('../middleware/auth');
const fs = require("fs");
const sharp = require('sharp');
// Retrieve all Users from the database.
exports.findAll = (req, res) => {
    const email = req.query.email;
    var condition = email ? { email: { [Op.like]: `%${email}%` } } : null;

    Users.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Users."
            });
        });
};

// Find a single User with an id
exports.delete = (req, res) => {

    auth(req, res, () => {
        let id = req.body.id;
        let user_id = req.user.user_id;
        Pictures.destroy({
            where: { id: id, userId: user_id }
        })
            .then(num => {
                if (num == 1) {
                    res.send({
                        result: true,
                        message: "L'image a été supprimé !"
                    });
                } else {
                    res.send({
                        message: `Cannot delete picture with id=${id}. Maybe picture was not found!`
                    });
                }
            })
            .catch(err => {
                console.log(err)
                res.status(500).send({
                    message: "Could not delete picture with id=" + id
                });
            });
    });
}
exports.findOne = (req, res) => {
    //auth(req, res, () => {
    const id = req.params.id;

    Pictures.findByPk(id)
        .then(data => {
            if (data) {
                //res.send({picture: data.image});
                //res.file(data.image);
                //let image = data.image.replace('data:image/jpeg;base64,', '');
                let image = data.image.replace('data:image/jpeg;base64,', '');

                var img = Buffer.from(image, 'base64');

                res.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': img.length
                });
                res.end(img);

            } else {
                res.status(404).send({
                    message: `Cannot find Users with id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error retrieving Users with id=" + id
            });
        });
    //})
};

exports.create = async (req, res) => {
    auth(req, res, () => {
        let user = req.user;

        const folderPath = `./public/pictures/${user.user_id}/`;
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

        Pictures.count({ where: { userId: user.user_id } })
            .then(totalCount => {
                const Picture = {
                    userId: user.user_id,
                    deviceId: "phone",
                    index: totalCount,
                    online: true
                };
                Pictures.create(Picture)
                    .then(data => {

                        let base64 = req.body.picture;
                        const buffer = Buffer.from(base64, "base64");

                        // Using Sharp for image processing
                        sharp(buffer)
                            .jpeg({ quality: 100 })
                            .toFile(`${folderPath}${data.id}.jpeg`)
                            .then(() => {
                                res.send({ result: true, id: data.id });
                            })
                            .catch(err => {
                                throw new Error(err);
                            });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).send({
                            message: "oups"
                        });
                    });
            })
            .catch(err => {
                console.log(err);
                res.status(500).send({
                    message: "oups"
                });
            });
    });
}

exports.rotate = async (req, res) => {
    auth(req, res, () => {
        let user = req.user;
        let { id, direction } = req.body;
        const imagePath = `./public/pictures/${user.user_id}/${id}.jpeg`;

        if (fs.existsSync(imagePath)) {
            Pictures.findOne({ where: { userId: user.user_id, id: id } })
                .then(user_image_data => {
                    if (user_image_data) {
                        const angle = direction === 'left' ? 90 : -90;
                        const tempPath = imagePath + ".tmp";
                        sharp(imagePath)
                            .rotate(angle)
                            .jpeg({ quality: 100 })
                            .toFile(tempPath)
                            .then(data => {
                                fs.rename(tempPath, imagePath, (err) => { // Remplacer l'original par le temporaire
                                    if (err) {
                                        console.log(err);
                                        res.status(400).send({ errors: [{ 'msg': "Error replacing the original image." }] });
                                    } else {
                                        res.status(200).send({ result: true });
                                    }
                                });
                            })
                            .catch(err => {
                                console.log(err)
                                res.status(400).send({ errors: [{ 'msg': "Unknown error with image processing." }] });
                            });
                    } else {
                        res.status(400).send({ errors: [{ 'msg': `Error processing image` }] });
                    }
                })
                .catch(error => {
                    res.status(400).send({ errors: [{ 'msg': `It's not your image ${error}` }] });
                });
        } else {
            res.status(400).send({ errors: [{ 'msg': `Image not found` }] });
        }
    });
};


exports.setIndex = async (req, res) => {
    auth(req, res, async () => {
        try {
            const { photoId, newIndex } = req.body;
            const picture = await Pictures.findByPk(photoId);
            if (picture) {
                const oldIndex = picture.index;
                picture.index = newIndex;
                await picture.save();

                // Update other images with higher index
                await Pictures.update(
                    { index: db.Sequelize.literal('`index` - 1') },
                    {
                        where: {
                            userId: picture.userId,
                            online: true,
                            index: {
                                [db.Sequelize.Op.gte]: oldIndex
                            }
                        }
                    }
                );

                res.status(200).send({ result: true });
            } else {
                res.status(404).send({ message: 'Image not found' });
            }
        } catch (error) {
            console.error('Error setting picture index:', error);
            res.status(500).send({ message: 'Internal server error' });
        }
    });
}
exports.updatePictureIndexByRange = async (req, res) => {
    auth(req, res, async () => {
        try {
            const { photoId, oldIndex, newIndex } = req.body;

            const picture = await Pictures.findByPk(photoId);
            if (!picture) {
                return res.status(404).send({ message: 'Image not found' });
            }

            const userId = picture.userId;
            const onlinePictures = await Pictures.findAll({
                where: {
                    userId,
                    online: true
                },
                order: [['index', 'ASC']]
            });

            const updatedPictures = onlinePictures.map((p) => {
                if (p.id === picture.id) {
                    p.index = newIndex;
                } else if (oldIndex < newIndex && p.index > oldIndex && p.index <= newIndex) {
                    p.index -= 1;
                } else if (oldIndex > newIndex && p.index < oldIndex && p.index >= newIndex) {
                    p.index += 1;
                }
                return p;
            });

            // Update pictures with adjusted indexes
            for (const p of updatedPictures) {
                await p.save();
            }

            res.status(200).send({ result: true });
        } catch (error) {
            console.error('Error updating picture index by range:', error);
            res.status(500).send({ message: 'Internal server error' });
        }
    });
};