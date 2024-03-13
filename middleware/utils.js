const utils = {};

const config = process.env;

utils.getURL = ()=>{
    return process.env.URL;
}
module.exports = utils;