const jwt = require("jsonwebtoken");

const config = process.env;
const verifyToken = (req, res, next) => {
    const authCookie = req.cookies.SESSIONID;
  
    if (!authCookie) {
      return res.redirect('/admin/auth');
    }
  
    try {
      const decoded = jwt.verify(authCookie, config.TOKEN_KEY);
      req.user = decoded;
      next();
    } catch (err) {
      return res.redirect('/admin/auth');
    }
  };
  
  module.exports = verifyToken;