module.exports = function(app, express, passport) {
	var loneObj = require('./../app/controllers/lone.js');
	var router = express.Router();
    router.post('/registerLovedOnce',loneObj.registerLovedOnce);
	app.use('/lone', router);
};
