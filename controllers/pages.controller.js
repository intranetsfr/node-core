const db = require("../models");
const auth = require("../middleware/auth");
const pm = require("../middleware/page");
const moment = require('moment');
moment.locale('fr');
const Pages = db.pages;
exports.contact = (req, res) => {

  auth(req, res, () => {

    const Message = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      message: req.body.message,
    };
    // Save Users in the database
    Pages.create(Message)
      .then(data => {
        res.send({ result: true, message: "Votre message a bien été envoyé" })
      });
  });
};
exports.create = (req, res) => {

  auth(req, res, () => {
    const Page = {
      url: req.body.pages__url,
      function: req.body.pages__extension.replace('.', ''),
      extension: req.body.pages__extension,
      index: 0,
      parent: null,
      description: `Page ${req.body.pages__url} is create...`

    };
    console.log(Page);
    Pages.create(Page)
      .then(data => {
        res.redirect('/admin')
      });
  });
};
exports.edit = (req, res) => {

  auth(req, res, () => {
    let data = {};
    data.title = "Pages";
    data.subtitle = "Home";
    data.debug = req.params.extension;
    data.js = [
      '/javascripts/intranets.core.js'
    ]
    Pages.findOne({ raw: true, where: { url: req.params.url, extension: req.params.extension } }).then(page => {
      data.page = page;

      res.render('admin/pages/edit', data);
    })
  });
}
exports.tree = async (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Pages";
    data.subtitle = "Home";
    data.debug = req.params.extension;
    data.css = [
      '/stylesheets/tree.css'
    ];
    data.js = [
      '/javascripts/intranets.core.js'
    ]
    Pages.findAll({ raw: true, where: { url: req.params.url, extension: req.params.extension } }).then(elements => {
      // Racine de l'arborescence (éléments sans parent)
      const rootElements = elements.filter((element) => !element.parent);
      // Construction de la structure récursive en ajoutant les enfants à chaque élément
      rootElements.forEach((rootElement) => {
        rootElement.children = pm.getChildren(elements, rootElement.id);
      });
      pm.components().then(components => {
        data.components = components;
        data.elements = rootElements;
        res.render('admin/pages/tree', data);
      })
    })
  });
}
exports.addComponentInPage = async (req, res) => {
  auth(req, res, () => {
    let body = req.body;
    console.log(body);
    let pages_parent = req.body.pages_parent;
    let element = req.body.element;

    Pages.count({ where: { parent: pages_parent } }).then(count => {
      const newIndex = count + 1;

      Pages.findOne({ raw: true, where: { id: pages_parent } }).then(page => {
        const Page = {
          url: page.url,
          parent: pages_parent,
          name: page.name,
          function: element,
          extension: page.extension,
          index: newIndex,
          description: `Element add ${element} in ${page.name}`
        };

        Pages.create(Page)
          .then(data => {
            console.log(data);
            res.send({ result: true });
          });
      });
    });
  });
}
exports.deleteComponentInPage = (req, res) => {
  auth(req, res, () => {
    let body = req.body;
    let pages_id = body.pages_id;

    Pages.destroy({
      where: { id: pages_id },
      cascade: true, // Supprime également les enfants en cascade
      include: [{ model: Pages, as: 'children' }] // Inclut les enfants dans la suppression en cascade
    })
      .then(result => {
        console.log(result);
        res.send({ result: true });
      })
      .catch(err => {
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
    const parentPage = await db.pages.findOne({ where: { id: parentId }, include: 'childPages' });

    if (!parentPage) {
      throw new Error('Page parent non trouvée.');
    }

    // Copier la page parent
    const duplicatedParent = await db.pages.create({
      ...parentPage.get({ plain: true }),
      id: null, // Réinitialiser l'ID pour une nouvelle insertion
    });

    // Copier les enfants de la page parent
    const childPages = parentPage.childPages.map(child => ({
      ...child.get({ plain: true }),
      id: null, // Réinitialiser l'ID pour une nouvelle insertion
      parent: duplicatedParent.id, // Mettre à jour la référence parent
    }));

    // Créer les copies des enfants de la page parent
    const duplicatedChildPages = await db.pages.bulkCreate(childPages, { returning: true });

    // Mettre à jour les références parent des enfants dupliqués
    for (const duplicatedChild of duplicatedChildPages) {
      await db.pages.update({ parentId: duplicatedParent.id }, { where: { id: duplicatedChild.id } });
    }

    console.log('Parent et enfants dupliqués avec succès.');
    return {
      duplicatedParent,
      duplicatedChildPages,
    };
  } catch (error) {
    console.error('Erreur lors de la duplication du parent et des enfants :', error);
    throw error;
  }
};
exports.propreties = (req, res) => {
  auth(req, res, () => {
    let data = {};
    data.title = "Propreties";
    data.subtitle = "Propreties";
    data.js = [
      '/javascripts/intranets.core.js'
    ]
    Pages.findOne({ raw: true, where: { id: req.query.id } }).then(element => {
      pm.components('views/templates/', false).then(components => {
        data.components = [];
        data.propreties = [];
        data.values = JSON.parse(element.props);
        data.template_name = element.template_name;
        for (let component of components) {
          let c = component.content.tokens.filter(token => token.type === 'logic');
          for (let nested of c) {
            if (nested.token.macroName == element.function) {
              data.element = element;
              console.log(nested.token.defaults);
              if(data.values){
                for(let v in data.values){
                  if(nested.token.defaults[v]){
                    nested.token.defaults[v][0].value = data.values[v];
                  }
                }
              }
              data.propreties.push(nested.token.defaults);
            }
          }
        }
        res.render('admin/pages/propreties', data);

      })
    })
  });
}
exports.savePropreties = async (req, res) => {
  try {
    const id = req.query.id;
    const element = await Pages.findOne({ where: { id: id } });

    if (!element) {
      console.log('Page not found');
      return res.redirect('/admin');
    }

    let { template_name, ...post } = req.body;
    const props = JSON.stringify(post);

    await Pages.update({ template_name, props }, { where: { id: id } });

    console.log(req.body);
    res.redirect(`/admin/pages/propreties?id=${id}`);
  } catch (error) {
    console.log('Error updating page properties:', error);
    res.redirect(`/admin/pages/propreties?id=${req.query.id}`);
  }
}