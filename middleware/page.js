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

module.exports = PageMiddleware;