
const config = process.env;
//config.HOST
const SQLite = require("sqlite3");
module.exports = {
    HOST: config.DB_HOST,
    USER: config.DB_USER,
    PASSWORD: config.DB_PASSWORD,
    DB: config.DB_DATABASE,
    dialect: "mysql",
    //storage: config.DB_PATH,
    dialectOptions: {
        // Your sqlite3 options here
        // for instance, this is how you can configure the database opening mode:
        mode: SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE | SQLite.OPEN_FULLMUTEX,
      },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};