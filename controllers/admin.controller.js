require("dotenv").config();

const fsPromises = require("fs").promises;

const path = require("path");
const auth = require("../middleware/auth");
const DataMiddleware = require("../middleware/datamiddleware");
const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const db = require("../models");
const Pages = db.pages;
const Users = db.users;

const default_css = [
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "/libs/material-design-lite/material.min.css",
  "/css/admin.css",
];
const default_js = [
  "/libs/material-design-lite/material.min.js",
  "/javascripts/intranets.core.js",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}${fileExtension}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage }).any();

async function removeData(id, tableName) {
  try {
    console.log(tableName);
    const Model = db.sequelize.models[tableName];
    if (!Model) {
      throw new Error("Model not found");
    }

    const deletedRows = await Model.destroy({ where: { id: id } });
    return deletedRows;
  } catch (error) {
    throw new Error(`Error removing data from table: ${error.message}`);
  }
}

exports.login = async (req, res) => {
  let data = {};
  data.title = "Admin";
  data.subtitle = "Home";
  data.css = default_css;
  data.js = default_js;
  DataMiddleware.getTables(
    (tables) => {
      data.tables = tables;
      res.render("users/login", data);
    },
    (error) => {
      console.log("showAllSchemas ERROR", error);
    }
  );
};
exports.auth = async (req, res) => {
  try {
    const { users_email, users_password } = req.body;

    if (!(users_email && users_password)) {
      const data = { error: "All input is required" };
      return res.render("users/login", data);
    }

    const user = await db.users.findOne({
      where: { email: users_email },
      raw: true,
    });
    console.log(user);
    if (user && bcrypt.compareSync(users_password, user.password)) {
      const token = jwt.sign(
        { user_id: user.id, users_email: users_email },
        process.env.TOKEN_KEY,
        { expiresIn: "3600h" }
      );

      user.token = token;
      user.password = null;
      res.cookie("SESSIONID", token, { httpOnly: true, secure: true });
      return res.redirect("/admin/");
    } else {
      const data = { error: "Aucun compte" };
      console.table(user);
      return res.redirect("/admin/auth?error=no_account");
    }
  } catch (err) {
    console.error(err);
    const data = { error: "Aucun compte..." };
    return res.render("users/login", data);
  }
};
exports.home = async (req, res) => {
  auth(req, res, () => {
    DataMiddleware.getTables((tables) => {
      let data = {};
      data.tables = tables;
      data.title = "Admin";
      data.subtitle = "Home";
      data.css = default_css;
      data.js = default_js;
      Pages.findAll().then(pages=>{
        data.pages = pages;
        res.render("admin/dashboard", data);
      })
    });
  });
};

exports.structure = async (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Admin";
    data.subtitle = req.params.table_name;
    data.css = default_css;
    data.js = default_js;
    DataMiddleware.getTables(
      (tables) => {
        data.tables = tables;
        DataMiddleware.getStructure(
          data.subtitle,
          (structure) => {
            data.structure = structure;
            res.render("collection/structure", data);
          },
          (error) => {
            console.error(
              "Erreur lors de l'obtention de la structure de la table :",
              error
            );
          }
        );
      },
      (error) => {
        res.send(error);
        console.log("showAllSchemas ERROR", error);
      }
    );
  });
};
exports.structure_delete = async (req, res) => {
  auth(req, res, () => {
    let table = req.params.table_name;

    const Model = db.sequelize.define(table, {});

    Model.drop().then((result) => {
      return res.redirect(`/admin/`);
    });
  });
};

exports.removeColumn = async (req, res) => {
  auth(req, res, async () => {
    try {
      const field_name = req.body.field_name;
      const table_name = req.params.table_name;
      // Vérifier si la table existe
      const existingTable = await db.sequelize
        .getQueryInterface()
        .showAllTables();
      if (!existingTable.includes(table_name)) {
        return res.status(500).json({ error: "Table does not exist" });
      }

      // Vérifier si la colonne existe dans la table
      const tableColumns = await db.sequelize
        .getQueryInterface()
        .describeTable(table_name);
      console.log(tableColumns);
      console.log(tableColumns[field_name]);
      if (!tableColumns[field_name]) {
        return res
          .status(500)
          .json({ error: "Column does not exist in the table" });
      }

      // Supprimer la colonne
      await db.sequelize
        .getQueryInterface()
        .removeColumn(table_name, field_name);

      return res.redirect(`/admin/${table_name}.structure`);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error removing column" });
    }
  });
};
exports.structure_edit = async (req, res) => {
  auth(req, res, async () => {
    try {
      const { table_name, structure_name, structure_type, structure_isnull } =
        req.body;

      let allowNull = true;
      if (typeof structure_isnull != "undefined" && structure_isnull == "on") {
        allowNull = false;
      }
      const existingTable = await db.sequelize
        .getQueryInterface()
        .showAllTables();
      if (!existingTable.includes(table_name)) {
        return res.status(500).json({ error: "Table does not exist" });
      }

      const tableColumns = await db.sequelize
        .getQueryInterface()
        .describeTable(table_name);
        console.table(tableColumns);
      if (tableColumns[table_name]) {
        return res
          .status(500)
          .json({ error: "Column already exists in the table" });
      }

      // Ajouter la colonne en fonction du type
      switch (structure_type) {
        case "number":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.INTEGER,
              allowNull: allowNull,
            });
          break;
        case "decimal":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.DOUBLE,
              allowNull: allowNull,
            });
          break;
        case "float":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.FLOAT,
              allowNull: allowNull,
            });
          break;
        case "string":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.STRING,
              allowNull: allowNull,
            });
          break;
        case "text":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.TEXT,
              allowNull: allowNull,
            });
          break;
        case "boolean":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.BOOLEAN,
              allowNull: allowNull,
            });
          break;
        case "date":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.DATE,
              allowNull: allowNull,
            });
          break;
        case "file":
          await db.sequelize
            .getQueryInterface()
            .addColumn(table_name, structure_name, {
              type: DataTypes.STRING,
              allowNull: allowNull,
              defaultValue: "file",
            });
          break;
        default:
          return res.status(500).json({ error: "Invalid column type" });
      }

      return res.redirect(`/admin/${table_name}.structure`);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error adding column" });
    }
  });
};

exports.data = async (req, res) => {
  auth(req, res, async () => {
    let data = {};
    data.title = "Admin";
    data.subtitle = req.params.table_name;
    data.css = default_css;
    data.js = default_js;

    let id = req.query.id;
    if (id) {
      try {
        await removeData(id, data.subtitle);
        // Entrée supprimée avec succès
        // Faire d'autres traitements ou rediriger l'utilisateur si nécessaire
      } catch (error) {
        console.error("Error removing data:", error);
        // Gérer l'erreur de suppression de données
      }
    }
    DataMiddleware.getTables(
      (tables) => {
        data.tables = tables;

        DataMiddleware.getStructure(
          data.subtitle,
          (structure) => {
            data.structure = structure;

            DataMiddleware.getData(
              data.subtitle,
              (tableData) => {
                data.tableData = tableData;

                res.render("collection/data", data);
              },
              (error) => {
                console.error("Error getting data from table:", error);
              }
            );
          },
          (error) => {
            console.error(
              "Erreur lors de l'obtention de la structure de la table :",
              error
            );
          }
        );
      },
      (error) => {
        console.log("showAllSchemas ERROR", error);
      }
    );
  });
};
exports.form = async (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Admin";
    data.subtitle = req.params.table_name;
    data.id = req.query.id;

    data.css = default_css;
    data.js = default_js;

    DataMiddleware.getTables(
      (tables) => {
        data.tables = tables;
        DataMiddleware.getStructure(
          data.subtitle,
          (structure) => {
            data.structure = structure;
            for (let s in data.structure) {
              data.structure[s].template = data.structure[s].type
                .toLowerCase()
                .replace(/\(.*\)/, "");
            }
            if (data.id) {
              DataMiddleware.getDataById(
                data.id,
                data.subtitle,
                (formData) => {
                  data.formData = formData;
                  res.render("collection/form", data);
                },
                (error) => {
                  console.error(
                    "Erreur lors de l'obtention de la structure de la table :",
                    error
                  );
                }
              );
            } else {
              res.render("collection/form", data);
            }
          },
          (error) => {
            console.error(
              "Erreur lors de l'obtention de la structure de la table :",
              error
            );
          }
        );
      },
      (error) => {
        res.send(error);
        console.log("showAllSchemas ERROR", error);
      }
    );
  });
};

exports.api = async (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Admin";
    data.subtitle = req.params.table_name;
    data.id = req.query.id;

    data.css = default_css;
    data.js = default_js;

    DataMiddleware.getTables(
      (tables) => {
        data.tables = tables;
        DataMiddleware.getStructure(
          data.subtitle,
          (structure) => {
            data.structure = structure;
            for (let s in data.structure) {
              data.structure[s].template = data.structure[s].type
                .toLowerCase()
                .replace(/\(.*\)/, "");
            }
            if (data.id) {
              DataMiddleware.getDataById(
                data.id,
                data.subtitle,
                (formData) => {
                  data.formData = formData;
                  res.render("collection/api", data);
                },
                (error) => {
                  console.error(
                    "Erreur lors de l'obtention de la structure de la table :",
                    error
                  );
                }
              );
            } else {
              res.render("collection/api", data);
            }
          },
          (error) => {
            console.error(
              "Erreur lors de l'obtention de la structure de la table :",
              error
            );
          }
        );
      },
      (error) => {
        res.send(error);
        console.log("showAllSchemas ERROR", error);
      }
    );
  });
};

exports.saveApi = async (req, res) => {};
exports.saveForm = async (req, res) => {
  auth(req, res, async () => {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).json({ error: "Error uploading file" });
      }

      try {
        let table_name = req.params.table_name;
        let insert_data = req.body;
        let id = req.query.id;

        const TableModel = db.sequelize.models[table_name];
        const attributes = await TableModel.describe();
        const fieldKeys = Object.keys(attributes);

        let i = 0;
        for (const key of fieldKeys) {
          if (attributes[key].defaultValue === "file") {
            if (req.files && req.files.length > 0) {
              const file = req.files[i];
              if (file && file.path) {
                i++;
                const tempFilePath = file.path;
                const newFilePath = `public/uploads/${file.filename}`;
                await fsPromises.rename(tempFilePath, newFilePath);
                insert_data[key] = newFilePath.replace("public/", "");
              }
            } else {
              insert_data[key] = req.body[key] || null;
            }
          }
        }
        const DynamicModel = db.sequelize.define(table_name, {
          ...insert_data,
        });
        await DynamicModel.sync();

        if (id) {
          await DynamicModel.findByPk(id).then(async (existingData) => {
            if (existingData) {
              await existingData.update(insert_data);
              return res.redirect(`/admin/${table_name}.data`);
            } else {
              throw new Error("Data not found");
            }
          });
        } else {
          await DynamicModel.create(insert_data).then(() => {
            return res.redirect(`/admin/${table_name}.data`);
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error inserting/updating data" });
      }
    });
  });
};
exports.create = async (req, res) => {
  auth(req, res, async () => {
    const intranets_collection__name = req.body.intranets_collection__name;

    try {
      const existingTable = await db.sequelize
        .getQueryInterface()
        .showAllTables();
      if (existingTable.includes(intranets_collection__name)) {
        return res.status(500).json({ error: "Table already exists" });
      }

      const columns = {
        description: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      };
      const newTable = db.sequelize.define(intranets_collection__name, columns);
      await newTable.sync({ alter: true });

      return res.redirect(`/admin/${intranets_collection__name}.data`);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error creating table" });
    }
  });
};
