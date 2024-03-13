
const { body, validationResult } = require('express-validator');

module.exports = app => {
    
    const users = require("../controllers/users.controller");
    var router = require("express").Router();
    /*
    router.post("/subscribe", [
        body('fcmToken').isString().notEmpty().withMessage('Une erreur sur votre appareil est survenue'),
        body('firstname').isString().notEmpty().withMessage('votre prénom est obligatoire'),
        body('gender').isString().notEmpty().withMessage('votre sexe est obligatoire'),
        body('orientation').isString().notEmpty().withMessage('votre orientation est obligatoire'),
        body('birthday').isString().notEmpty().withMessage('votre date de naissance est obligatoire'),
        body('phone_number').isString().notEmpty().withMessage('votre numéro de mobile est obligatoire'),
        body('password').isString().notEmpty().withMessage('votre mot de passe est obligatoire'),
        body('condition')
        .custom(value => {
            // Assurez-vous que la valeur est un booléen et égale à true
            if (typeof value !== 'boolean' || value !== true) {
                throw new Error('Vous devez lire et accepter les conditions d\'utilisation');
            }
            return true; // La validation réussit si la condition est un booléen et égale à true
        })
    ],
        users.create);
*/
        
    router.post("/update", users.update);
    
    
    
    
    
    app.use('/users', router);
};