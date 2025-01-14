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
  //router.get('/pages/:filename(*):extension(.html|.pdf).render', pages.render);
  router.get('/pages/:filename(*):extension(.html|.pdf).edit', pages.edit);
  router.get('/pages/:filename(*):extension(.html|.pdf).tree', pages.tree);
  router.get('/pages/:filename(*):extension(.html|.pdf).propreties', pages.propreties);
  router.post('/pages/components', pages.addComponentInPage);
  router.delete('/pages/components', pages.deleteComponentInPage);
  router.get('/pages/components', pages.duplicateComponents);
  const fs = require('fs');
  function parseFile(filePath, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur de lecture du fichier:", err);
            return;
        }

        // Expression régulière pour capturer le nom de la fonction, les paramètres, et le type de retour
        const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^ {]+)?/g;
        let match;

        const functionsInfo = [];

        while ((match = functionRegex.exec(data)) !== null) {
            const functionName = match[1];
            const paramsString = match[2];
            const returnType = match[3] || "void";

            // Nouvelle logique de découpage des paramètres pour éviter les coupures dans les objets ou tableaux
            const paramsList = [];
            let currentParam = '';
            let depth = 0; // Pour suivre la profondeur dans les objets ou tableaux

            for (let char of paramsString) {
                if (char === ',' && depth === 0) {
                    paramsList.push(currentParam.trim());
                    currentParam = '';
                } else {
                    currentParam += char;
                    if (char === '{' || char === '[') depth++;
                    else if (char === '}' || char === ']') depth--;
                }
            }
            if (currentParam) paramsList.push(currentParam.trim());

            // Traitement de chaque paramètre
            const parsedParams = paramsList.map(param => {
                const [nameAndType, defaultValue] = param.split('=').map(part => part.trim());
                const [name, type] = nameAndType.split(':').map(part => part.trim());

                let parsedDefaultValue = null;
                if (defaultValue) {
                    // Essayer de parser les valeurs JSON pour les objets ou tableaux
                    try {
                        parsedDefaultValue = JSON.parse(defaultValue.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?/g, '"$2"'));
                    } catch (e) {
                        parsedDefaultValue = defaultValue;
                    }
                }

                return { name, type: type || "any", defaultValue: parsedDefaultValue };
            });

            functionsInfo.push({ name: functionName, params: parsedParams, returnType });
        }
        callback(functionsInfo);
    });
}
  router.get('/test', (req, res)=>{
    parseFile('./components/documents/html.ts', (result)=>{

      res.send(result);
    }); // Remplacez par le nom de votre fichier
  })

  function parseTwigFile(filePath, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur de lecture du fichier:", err);
            return;
        }

        // Expression régulière pour capturer les macros dans le fichier Twig
        const macroRegex = /{% macro\s+(\w+)\s*\(([^)]*)\)\s*%}([\s\S]*?){%\s*endmacro\s*%}/g;
        let match;

        const macrosInfo = [];

        while ((match = macroRegex.exec(data)) !== null) {
            const macroName = match[1]; // Nom de la macro
            const paramsString = match[2]; // Paramètres de la macro
            const macroBody = match[3]; // Corps de la macro (non utilisé ici, mais il pourrait être extrait si nécessaire)

            // Expression régulière pour extraire les paramètres et leurs valeurs par défaut
            const paramRegex = /(\w+)\s*=\s*([^,]+)/g; // Capture les paramètres avec une valeur par défaut
            const paramsList = [];
            let paramMatch;

            while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
                const name = paramMatch[1].trim();
                const defaultValue = paramMatch[2].trim();

                // Essayer de parser les valeurs par défaut complexes (tableaux ou objets)
                let parsedDefaultValue = null;
                try {
                    // Tentative de parsing JSON pour les tableaux ou objets
                    parsedDefaultValue = JSON.parse(defaultValue.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?/g, '"$2"'));
                } catch (e) {
                    parsedDefaultValue = defaultValue;
                }

                paramsList.push({ name, defaultValue: parsedDefaultValue });
            }

            macrosInfo.push({ name: macroName, params: paramsList, body: macroBody });
        }
        callback(macrosInfo);
    });
}

// Route Express pour tester la fonction
router.get('/parse-twig', (req, res) => {
    parseTwigFile('./components/documents/html.twig', (result) => {
        res.json(result); // Retourne les macros extraites
    });
});
  /*
  router.get('/pages/propreties', pages.propreties);
  router.post('/pages/propreties', pages.savePropreties);
  */
  

  app.use('/admin', router);
};