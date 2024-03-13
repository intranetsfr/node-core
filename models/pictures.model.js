module.exports = (sequelize, Sequelize) => {
    const Pictures = sequelize.define("pictures", {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        index: {
            type:Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        deviceId: {
            type: Sequelize.STRING,
            allowNull: false
        },
        online: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        }

    });

    return Pictures;
};