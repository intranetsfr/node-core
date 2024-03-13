const bcrypt = require("bcrypt");
const Pictures = require("./pictures.model");
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "users",
    {
      firstname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM("male", "female"),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      instanceMethods: {
        toJSON: function () {
          var values = Object.assign({}, this.get());

          delete values.password;
          return values;
        },
      },
    }
  );


  // Synchroniser le modèle avec la base de données et insérer l'utilisateur "demo"
  bcrypt.hash("demodemo", 10).then(function (hash) {
    User.sync().then(async () => {
      try {
        const [user, created] = await User.findOrCreate({
          where: { email: "demo@intranets.fr" },
          defaults: {
            firstname: "John",
            lastname: "Doe",
            gender: "male",
            email: "demo@intranets.fr",
            password: hash,
          },
        });
        let debug = false;
        if (debug) {
          if (created) {
            console.log(
              'Utilisateur "demo" inséré avec succès:',
              user.toJSON()
            );
          } else {
            console.table(user);
            console.log('Utilisateur "demo" déjà existant:', user.toJSON());
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de l'insertion de l'utilisateur \"demo\":",
          error
        );
      }
    });
  });

  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };
  return User;
};
