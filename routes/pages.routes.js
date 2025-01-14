const db = require("../models/index");
const pm = require("../middleware/page");
const Pages = db.pages;
const fs = require("fs");
module.exports = app => {
  const router = require("express").Router();


  router.get("/:url(*):extension(.html|.pdf)", async (req, res) => {
    res.send('ok');
  });

  
  router.get('', (req, res) => {
    res.redirect('/index.html');
  })

  app.use('/', router);
};