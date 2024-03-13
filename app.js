var createError = require('http-errors');
require("dotenv").config();
const express = require('express');
const cors = require("cors");

const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();


app.use(cors({origin: [process.env.URL]}));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();});
app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());

const db = require("./models");
db.sequelize.sync()
    .then(() => {
      console.log("Synced db.");
    })
    .catch((err) => {
      console.log("Failed to sync db: " + err.message);
    });


require("./routes/admin.routes")(app);
require("./routes/pages.routes")(app);
require("./routes/pictures.routes")(app);
require("./routes/users.routes")(app);

//twig
app.set('views', 'views');
app.set('view engine', 'twig');
app.set("twig options", {
    allow_async: true, // Allow asynchronous compiling
    strict_variables: false
});
app.use(express.static('public'));
app.use((req, res, next) => {
  
  let data = {};
  data.css = [
      '/css/default.css',
      'https://fonts.googleapis.com/icon?family=Material+Icons',
      '/css/material.orange-amber.min.css'
  ];
  data.js = [
      'https://code.getmdl.io/1.3.0/material.min.js',
  ];
  data.title = "NodeCore";
  res.render("pages/not_found", data);
  //next();
});
module.exports = app;
