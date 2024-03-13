let DataMiddleware = {};
const db = require("../models");

DataMiddleware.getTables = async (callback, error, usePagesUsers = false) => {
  db.sequelize.getQueryInterface().showAllSchemas().then((tables) => {
    //usePagesUsers == true ? callback(tables) : callback(tables.filter(element => element.name != "pages" && element.name != "users"))
    usePagesUsers == true ? callback(tables) : callback(tables.filter(element => element.name != "pages"))
  }).catch((err) => {
    
    console.log('showAllSchemas ERROR', err);
  })
}
DataMiddleware.getTablesFields = async (callback, error) => {
  try {
    const tables = await DataMiddleware.getTables();
    const tablesFields = await Promise.all(tables.map(table => DataMiddleware.getStructure(table.name)));
    callback(tablesFields);
  } catch (err) {
    error(err);
    console.error('Erreur lors de l\'obtention des tables et de leurs champs :', error);
  }
}
DataMiddleware.getStructure = async (name, callback, error) => {
  const Model = db.sequelize.define(name);
  Model.describe().then((tableStructure) => {
    callback(tableStructure);
  }).catch((err) => {
    error(err);
    console.error('Erreur lors de l\'obtention de la structure de la table :', error);
  });
}

DataMiddleware.getData = async (tableName, callback, error) => {
  // Retrieve the model corresponding to the tableName
  const Model = db.sequelize.models[tableName];
  if (!Model) {
    error('Model not found');
    return;
  }

  const attributes = await Model.describe();
  const contributesKeys = Object.keys(attributes);

  // Fetch all the data from the table
  Model.findAll({ raw: true, attributes: contributesKeys })
    .then(data => {
      callback(data);
    })
    .catch(err => {
      error(err);
    });
}
DataMiddleware.getDataById = async (id, tableName, callback, error) => {
  try {
    const Model = db.sequelize.models[tableName];
    if (!Model) {
      throw new Error('Model not found');
    }

    const attributes = await Model.describe();
    const contributesKeys = Object.keys(attributes);
    console.log(contributesKeys);

    const data = await Model.findOne({ raw: true, attributes: contributesKeys, where: { id: id } });
    callback(data);
  } catch (err) {
    error(err);
  }
}

module.exports = DataMiddleware;