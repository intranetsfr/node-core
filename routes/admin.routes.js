module.exports = app => {
  const admin = require("../controllers/admin.controller");
  const pages = require("../controllers/pages.controller");
  const router = require("express").Router();

  router.get("/auth", admin.login);
  router.post("/auth", admin.auth);
  router.get("/", admin.home);

  /* Structure*/
  router.post('/create', admin.create);
  router.get("/:table_name(*).structure", admin.structure);
  router.post("/:table_name(*).structure", admin.structure_edit);
  router.post("/:table_name(*).structure.delete", admin.removeColumn);
  router.get("/:table_name(*).structure.delete", admin.structure_delete);

  /*DATA*/
  router.get("/:table_name(*).data", admin.data);

  /*Form */
  router.get("/:table_name(*).form", admin.form);
  router.post("/:table_name(*).form", admin.saveForm);
  /*Form */
  router.get("/:table_name(*).api", admin.api);
  router.post("/:table_name(*).api", admin.saveApi);
  

  router.post('/pages/create', pages.create);
  router.get('/pages/:url(*):extension(.html|.pdf).edit', pages.edit);
  router.get('/pages/:url(*):extension(.html|.pdf).tree', pages.tree);
  router.post('/pages/components', pages.addComponentInPage);
  router.delete('/pages/components', pages.deleteComponentInPage);
  router.get('/pages/components', pages.duplicateComponents)
  router.get('/pages/propreties', pages.propreties);
  router.post('/pages/propreties', pages.savePropreties);
  
  

  app.use('/admin', router);
};