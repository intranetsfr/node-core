const { resolve, basename } = require("path");
const fs = require("fs").promises;

const { readdir } = require("fs").promises;


const PageMiddleware = {};
PageMiddleware.getChildren = (elements, parentId) => {
  const children = elements.filter((element) => element.parent === parentId);
  children.forEach((child) => {
    child.children = PageMiddleware.getChildren(elements, child.id);
  });
  return children;
};
function analyzeFile(filePath) {
    
}

PageMiddleware.components = async (
  dir = "components/",
  useRecusivity = true
) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        if (useRecusivity) {
          const folderInfo = {
            name: dirent.name,
            type: "folder",
            children: await PageMiddleware.components(res),
          };
          return folderInfo;
        } else {
          return await PageMiddleware.components(res, useRecusivity);
        }
      } else {
        const componentInfo = await analyzeFile(res);
        const fileInfo = {
          path: res, // Chemin absolu du fichier
          name: dirent.name.replace(".ts", ""),
          type: "file",
          pathWithView: res.replace(process.cwd() + "/components/", ""), // Chemin relatif du fichier
          relativePath: res.replace(process.cwd() + "/", ""), // Chemin relatif du fichier
          fileName: dirent.name, // Nom du fichier
          extension: dirent.name.split(".").pop(), // Extension du fichier
          components: componentInfo,
        };

        return fileInfo;
      }
    })
  );
  return Array.prototype.concat(...files);
};
module.exports = PageMiddleware;
