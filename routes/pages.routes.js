const db = require("../models/index");
const pm = require("../middleware/page");
const Twig = require('twig');
const Pages = db.pages;
const fs = require("fs");
module.exports = app => {
  const router = require("express").Router();


  router.get("/:url(*):extension(.html|.pdf)", async (req, res) => {
    try {
      const { url, extension } = req.params;
      const elements = await Pages.findAll({
        raw: true, where: { url: req.params.url, extension: req.params.extension },
        order: [['index', 'ASC']]
      });



      // Construire la structure récursive des éléments avec les enfants
      const rootElements = buildElementTree(elements);

      // Récupérer les templates et leurs macros depuis le dossier
      const templates = await pm.components('views/templates/', false);
      // Générer le contenu de la page en rendant les macros des éléments
      const renderedContent = renderPageContent(rootElements, templates);

      // Rendre le template de la page avec le contenu généré
      res.render('pages/page', { title: "Page", content: renderedContent });
    } catch (error) {
      console.log('Error retrieving and rendering page:', error);
      res.redirect('/error'); // Rediriger vers une page d'erreur appropriée
    }
  });

  // Fonction pour construire la structure récursive des éléments avec les enfants
  function buildElementTree(elements) {
    const elementMap = {};
    const rootElements = [];

    for (const element of elements) {
      element.children = [];
      elementMap[element.id] = element;

      if (!element.parent) {
        rootElements.push(element);
      } else {
        const parent = elementMap[element.parent];
        if (parent) {
          parent.children.push(element);
        }
      }
    }

    return rootElements;
  }
  function renderPageContent(elements, templates) {
    let renderedContent = '';

    for (const element of elements) {
      const template = templates.find((c) => c.name === element.function);
      if (template && template.type) {
        const props = element.props ? JSON.parse(element.props) : {};



        const macroContent = template.content;
        console.log(macroContent.renderAsync);
        if (macroContent && macroContent.renderAsync) {
          console.log(macroContent);
          macroContent.renderAsync(props).then((renderedMacro) => {
            renderedContent += renderedMacro;
          }).catch((error) => {
            console.log('Error rendering macro:', error);
          });
        }

        renderedContent += renderPageContent(element.children, templates);

      }
    }
  }

  router.get('', (req, res) => {
    res.redirect('/index.html');
  })

  app.use('/', router);
};