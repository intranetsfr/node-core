module.exports = (sequelize, Sequelize) => {
    const Page = sequelize.define("pages", {
        url: {
            type: Sequelize.STRING,
            allowNull: false
        },
        function: {
            type: Sequelize.STRING,
            allowNull: false
        },
        extension: {
            type: Sequelize.STRING,
            allowNull: false
        },
        index: {
            type: Sequelize.STRING,
            allowNull: false
        },
        parent: {
            type: Sequelize.STRING,
            allowNull: true
        },
        params: {
            type: Sequelize.TEXT,
            allowNull: true
        }
        
    });


    return Page;
};