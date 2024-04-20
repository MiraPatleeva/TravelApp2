var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
 res.redirect("/travel/login");
});

module.exports = router;
