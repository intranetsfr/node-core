const { resolve, basename } = require('path');
const twig = require('twig');
const fs = require('fs')
const { readdir } = require('fs').promises;
const PageMiddleware = {};
PageMiddleware.getChildren = (elements, parentId) => {
    const children = elements.filter((element) => element.parent === parentId);
    children.forEach((child) => {
        child.children = PageMiddleware.getChildren(elements, child.id);
    });
    return children;
};
PageMiddleware.components = async (dir = 'views/templates/', useRecusivity = true) => {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        dirents.map(async (dirent) => {
            const res = resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                if (useRecusivity) {
                    const folderInfo = {
                        name: dirent.name,
                        type: 'folder',
                        children: await PageMiddleware.components(res),
                    };
                    return folderInfo;
                } else {
                    return await PageMiddleware.components(res, useRecusivity);
                }
            } else {
                const fileInfo = {
                    path: res, // Chemin absolu du fichier
                    name: dirent.name.replace('.twig', ''),
                    type: 'file',
                    pathWithView: res.replace(process.cwd() + '/views/', ''), // Chemin relatif du fichier
                    relativePath: res.replace(process.cwd() + '/', ''), // Chemin relatif du fichier
                    fileName: dirent.name, // Nom du fichier
                    extension: dirent.name.split('.').pop(), // Extension du fichier
                    content: null, // Contenu du fichier Twig (initialisé à null)
                    params: null, // Paramètres du fichier Twig (initialisé à null)
                };

                // Analyser le fichier Twig uniquement s'il a une extension .twig
                if (fileInfo.extension === 'twig') {
                    fileInfo.content = PageMiddleware.parseTwigTemplate(res); // Analyse du fichier Twig
                    fileInfo.params = PageMiddleware.getParams(res); // Obtention des paramètres du fichier Twig
                }

                return fileInfo;
            }
        })
    );
    return Array.prototype.concat(...files);
};
PageMiddleware.getParams = async (templatePath) => {
    const twigContent = await PageMiddleware.readTwigTemplate(templatePath);

    const paramPattern = /{%\s*macro\s+(\w+)\s*\(\s*(.*?)\s*\)/sg;
    const params = {};
    let match;

    while ((match = paramPattern.exec(twigContent)) !== null) {
        const macroName = match[1];
        const macroParams = match[2].split(',').map(param => param.trim());

        params[macroName] = macroParams;
    }

    return params;
};
PageMiddleware.parseTwigTemplate = (templatePath) => {
    const content = PageMiddleware.readTwigTemplate(templatePath);
    const renderedTemplate = twig.twig({ data: content });
    return renderedTemplate;
};
PageMiddleware.readTwigTemplate = (templatePath) => {
    const content = fs.readFileSync(templatePath, 'utf8');
    return content;

};
PageMiddleware.parseTwigToken = (token) => {
    if (token && token.defaults) {

        const result = {
            name: token.macroName,
            properties: {},
        };
        console.log(token.defaults);

        // Parcourir les propriétés du token
        for (const key in token.defaults) {
            if (token.defaults.hasOwnProperty(key)) {
                const defaultValue = token.defaults[key];
                if (defaultValue.type === 'Twig.expression.type.array.start') {
                    // Récursion pour les tableaux imbriqués
                    const nestedResult = defaultValue.value.map(parseTwigToken);
                    result.properties[key] = nestedResult;
                } else {
                    // Propriété simple
                    result.properties[key] = defaultValue.value;
                }
            }
        }
        return result;
    }
};

module.exports = PageMiddleware;