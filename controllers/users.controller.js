const db = require("../models");

const config = process.env;
const Users = db.users;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const utils = require("../middleware/utils");



exports.login = async (req, res) => {
    try {
        // Get user input
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ errors: [{ msg: 'Tous les champs sont obligatoires' }] });
        }
        const user = await Users.findOne({ where: { email: req.body.email } });
        if (user == null || !(await bcrypt.compare(password, user.password))) {
            return res.status(500).send({ errors: [{ msg: 'Aucun compte' }] });
        }

        // Create token
        const token = jwt.sign(
            { user_id: user.id },
            process.env.TOKEN_KEY,
            { expiresIn: expiresIn }
        );
        
        user.token = token;
        user.password = null;
        return res.status(200).json({ user, token });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ errors: [{ msg: 'Erreur serveur' }] });
    }
};

exports.update = async (req, res) => {

    let { UUID, firstname, birthday, gender } = req.body;
    if (UUID) {
        let User = {
            firstname: firstname,
            birthday: birthday,
            gender: gender
        }
        Users.update(User, {
            where: { UUID: UUID }
        })
            .then(update_user => {
                res.send({ result: true });
            }).catch(error => {
                res.send({ result: false, "message": "Une erreur de mise à jour est survenue" });
            })
    } else {
        res.send({ result: false, "message": "Une erreur est survenue" });
    }
}