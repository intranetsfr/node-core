module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define('report', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        user_from_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        user_to_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    Report.associate = (models) => {
        Report.belongsTo(models.User, {
            foreignKey: 'user_from_id',
            as: 'userFrom'
        });
        Report.belongsTo(models.User, {
            foreignKey: 'user_to_id',
            as: 'userTo'
        });
    };

    return Report;
};