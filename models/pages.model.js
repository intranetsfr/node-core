module.exports = (sequelize, Sequelize) => {
    const Contact = sequelize.define("contact", {
        firstname: {
            type: Sequelize.STRING,
            allowNull: false
        },
        lastname: {
            type: Sequelize.STRING,
            allowNull: false
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        
    });


    return Contact;
};