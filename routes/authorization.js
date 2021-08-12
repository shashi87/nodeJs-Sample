module.exports = function(app, express, passport) {
	var cryptoService = require("./../app/services/crypto");
	var authScheObj = require('./../app/controllers/authorizationController.js');
	var router = express.Router();
	router.post('/getAllAuthAgencies',  [cryptoService.decrypt(),], authScheObj.getAllAuthAgencies);
	router.post('/agencyActivationStatus',  [cryptoService.decrypt(),], authScheObj.agencyActivationStatus);
	app.use('/authorization', router);
};
