module.exports = function(app, express, passport) {
	var middleware = require("./../app/policies/auth");
	var agencyObj = require('./../app/controllers/agencyController.js');
	var authObj = require('./../app/controllers/AuthController.js');
	var cryptoService = require("./../app/services/crypto");

	var router = express.Router();
	router.post('/add',	[ cryptoService.decrypt(),middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  agencyObj.addInvite);
	router.post('/getAll',[cryptoService.decrypt()],	agencyObj.getAllInvites);
	router.get('/:inviteId',	agencyObj.inviteProcess );
	router.post('/registration', [middleware.setPassport(passport)] ,agencyObj.registration);
	router.post('/aide/registration', [middleware.setPassport(passport)] ,agencyObj.aideRegistration);
    router.get('/resetpassword/:tokenId',	authObj.changePassword );
	router.get('/aide/:inviteId',	agencyObj.registerAide);
    router.post('/deleteAgencyInvite',[ middleware.isApiLoggedIn(), middleware.isAdmin(),cryptoService.decrypt() ] ,agencyObj.deleteAgencyInvite);
    router.post('/addVP',	[ cryptoService.decrypt(),middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  agencyObj.addVPInvite);
    router.post('/getAllVpInvites',[cryptoService.decrypt()],	agencyObj.getAllVpInvites);
    router.post('/registrationVp', [middleware.setPassport(passport)] ,agencyObj.registrationVp);
    router.post('/deleteVPInvite',[ middleware.isApiLoggedIn(), middleware.isAdmin(),cryptoService.decrypt() ] ,agencyObj.deleteVPInvite);
    router.get('/vp/:inviteId',	agencyObj.inviteVp );
	router.post('/getAgencySession',[cryptoService.decrypt(),middleware.isApiLoggedIn(), middleware.isAdmin()],agencyObj.getAgencySession);
	
	/* Mobile app api */
	router.post('/aide/registration_app', [middleware.setPassport(passport),cryptoService.decryptMobileData()] ,agencyObj.aideAppRegistration);
	router.post('/emergency/registration', [middleware.setPassport(passport),cryptoService.decryptMobileData()] ,agencyObj.emergencyRegistration);
	app.use('/invite', router);
};
