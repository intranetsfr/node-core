const db = require("../models");
const auth = require("../middleware/auth");

const moment = require("moment");
moment.locale("fr");
const Pages = db.pages;
const fs = require("fs");
const htmlparser2 = require("htmlparser2");
const { JSDOM } = require("jsdom");

const savedFolder = "./saved/";
const pagesFolder = `${savedFolder}pages/`;
const templatesFolder = `${savedFolder}templates/`;

function findElementById(element, targetId) {
  if (element.id == targetId) {
    return element;
  }
  
  // Parcours récursif des enfants
  for (let child of element.children) {
      const found = findElementById(child, targetId);
      if (found) {
          return found;
      }
  }
  
  // Retourne null si aucun élément avec cet ID n'a été trouvé
  return null;
}
function getDataAttributes(element) {
  const dataAttributes = {};

  // `element.dataset` contient tous les attributs data-* en tant que paires clé-valeur
  for (const key in element.dataset) {
      dataAttributes[key] = element.dataset[key];
  }

  return dataAttributes;
}
exports.create = (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Editor";
    let filename = req.body.pages__url;

    let timestampId = moment().unix();
    const content = `<div name="document" id="${timestampId}"></div>`;
    fs.writeFile(`${pagesFolder}/${filename}.html`, content, (err) => {
      if (err) {
        console.error(err);
        res.redirect(`/admin/?error=${err}`);
      } else {
        res.redirect(`/admin/pages/${filename}.html.edit`);
      }
    });

    /*
    const Page = {
      url: req.body.pages__url,
      function: req.body.pages__extension.replace(".", ""),
      extension: req.body.pages__extension,
      index: 0,
      parent: null,
      description: `Page ${req.body.pages__url} is create...`,
    };
    console.log(Page);
    Pages.create(Page).then((data) => {
      res.redirect("/admin");
    });*/
  });
};
exports.edit = (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Editor";
    let filename = req.params.filename;
    data.filename = `${filename}.html`;

    fs.readFile(
      `${pagesFolder}${data.filename}`,
      "utf8",
      (err, contentFile) => {
        if (err) {
          console.error(err);
          data.error = err;
          res.render("admin/pages/edit", data);
        }
        data.contentFile = contentFile;
        res.render("admin/pages/edit", data);
      }
    );
  });
};
exports.tree = async (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Editor";
    let filename = req.params.filename;
    data.filename = `${filename}.html`;
    const { id, action } = req.query; // Extraction des paramètres de requête
    const filePath = `${pagesFolder}${data.filename}`;

    fs.readFile(filePath, "utf8", (err, contentFile) => {
      if (err) {
        console.error(err);
        data.error = err;
        res.render("admin/pages/editor", data);
        return;
      }
      function parseNode(node) {
        if (node.type === "tag") {
          const parsedNode = {
            tag: node.name,
            id: node.attribs.id,
            name: node.attribs.name,
            class: node.attribs.class ? node.attribs.class.split(" ") : [],
            children: [],
            nodeRef: node, // Référence vers le nœud original pour les modifications
          };

          if (node.children) {
            parsedNode.children = node.children
              .map(parseNode)
              .filter((child) => child); // Exclure les éléments `null`
          }
          return parsedNode;
        }
        return null;
      }

      const dom = htmlparser2.parseDocument(contentFile).children;
      const tree = dom.map(parseNode).filter((node) => node);
      
      
      if (action === "add" && id !== undefined) {
        res.redirect(`/admin/pages/${data.filename}.tree`);
      } else if (action === "copy" && id !== undefined) {
        res.redirect(`/admin/pages/${data.filename}.tree`);
      } else {
        data.tree = tree;
        res.render("admin/pages/tree", data);
      }
    });
  });
};
exports.addComponentInPage = async (req, res) => {
  auth(req, res, () => {
    let body = req.body;
    console.log(body);
    let pages_parent = req.body.pages_parent;
    let element = req.body.element;

    Pages.count({ where: { parent: pages_parent } }).then((count) => {
      const newIndex = count + 1;

      Pages.findOne({ raw: true, where: { id: pages_parent } }).then((page) => {
        const Page = {
          url: page.url,
          parent: pages_parent,
          name: page.name,
          function: element,
          extension: page.extension,
          index: newIndex,
          description: `Element add ${element} in ${page.name}`,
        };

        Pages.create(Page).then((data) => {
          console.log(data);
          res.send({ result: true });
        });
      });
    });
  });
};
exports.deleteComponentInPage = (req, res) => {
  auth(req, res, () => {
    let body = req.body;
    let pages_id = body.pages_id;

    Pages.destroy({
      where: { id: pages_id },
      cascade: true, // Supprime également les enfants en cascade
      include: [{ model: Pages, as: "children" }], // Inclut les enfants dans la suppression en cascade
    })
      .then((result) => {
        console.log(result);
        res.send({ result: true });
      })
      .catch((err) => {
        console.error(err);
        res.send({ result: false, error: err.message });
      });
  });
};
exports.duplicateComponents = (req, res) => {
  auth(req, res, () => {
    let body = req.query;
    let parentId = body.id;
    console.log(parentId);
    if (duplicateChildren(parentId)) {
      res.send({ result: true });
    }
  });
};
const duplicateChildren = async (parentId) => {
  try {
    // Trouver la page parent spécifiée
    const parentPage = await db.pages.findOne({
      where: { id: parentId },
      include: "childPages",
    });

    if (!parentPage) {
      throw new Error("Page parent non trouvée.");
    }

    // Copier la page parent
    const duplicatedParent = await db.pages.create({
      ...parentPage.get({ plain: true }),
      id: null, // Réinitialiser l'ID pour une nouvelle insertion
    });

    // Copier les enfants de la page parent
    const childPages = parentPage.childPages.map((child) => ({
      ...child.get({ plain: true }),
      id: null, // Réinitialiser l'ID pour une nouvelle insertion
      parent: duplicatedParent.id, // Mettre à jour la référence parent
    }));

    // Créer les copies des enfants de la page parent
    const duplicatedChildPages = await db.pages.bulkCreate(childPages, {
      returning: true,
    });

    // Mettre à jour les références parent des enfants dupliqués
    for (const duplicatedChild of duplicatedChildPages) {
      await db.pages.update(
        { parentId: duplicatedParent.id },
        { where: { id: duplicatedChild.id } }
      );
    }

    console.log("Parent et enfants dupliqués avec succès.");
    return {
      duplicatedParent,
      duplicatedChildPages,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la duplication du parent et des enfants :",
      error
    );
    throw error;
  }
};
exports.propreties = (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Proprety";

    const filename = req.params.filename;
    data.elementId = parseInt(req.query.id, 10);
    const filepath = `${pagesFolder}/${filename}.html`;

    // Lecture du fichier HTML
    fs.readFile(filepath, "utf8", (err, html) => {
      if (err) {
        console.error(err);
        data.error = "Erreur lors de la lecture du fichier.";
        res.render("admin/pages/propreties", data);
        return;
      }

      // Manipuler le DOM du fichier HTML avec jsdom
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Démarrer la recherche à partir de `<body>`
      const element = findElementById(
        document,
        data.elementId
      );
      data.js = ["/javascripts/intranets.core.js"];
      data.update = req.query.update;
      if (element) {
        // Extraire les informations nécessaires
        console.log('')
        data.element = {};
        data.element.tagName = element.tagName.toLowerCase();
        data.element.name = element.name;
        data.element.id = element.id;
        data.element.data = getDataAttributes(element);
        data.element.classes = Array.from(element.classList);
        console.log(element.data);
      } else {
        data.error = "Élément non trouvé.";
      }
      res.render("admin/pages/propreties", data);
    });
    
  });
};
exports.savePropreties = async (req, res) => {
  try {
    const id = req.query.id;
    const element = await Pages.findOne({ where: { id: id } });

    if (!element) {
      console.log("Page not found");
      return res.redirect("/admin");
    }

    let { template_name, ...post } = req.body;
    const props = JSON.stringify(post);

    await Pages.update({ template_name, props }, { where: { id: id } });

    console.log(req.body);
    res.redirect(`/admin/pages/propreties?id=${id}`);
  } catch (error) {
    console.log("Error updating page properties:", error);
    res.redirect(`/admin/pages/propreties?id=${req.query.id}`);
  }
};
