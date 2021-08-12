module.exports = function(app, express, passport) {
	var middleware = require("./../app/policies/auth");
	var loginDetailsObj = require('./../app/controllers/loginDetailsController.js');
	var cryptoService = require("./../app/services/crypto");
	var logObj = require('./../app/controllers/loggingController.js');
	var router = express.Router();
	router.post('/getAllLoginDetails',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getAllLoginDetails);
	router.post('/updateUserStatus',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin()] ,  loginDetailsObj.updateUserStatus);
	router.post('/getAllLoginHistory',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getAllLoginHistory);
	router.post('/blockIP',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.blockIP);
	router.post('/getAllBlocked',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getAllBlocked);
	router.post('/getAllAidesDetails',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getAllAidesDetails);
	router.post('/UnblockUser',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.UnblockUser);
	// logging routes
	router.post('/getLogDetails',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  logObj.getLogDetails);
	router.post('/fetchAllAgencies',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  logObj.fetchAllAgencies);
	router.post('/fetchAgencyPatients',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  logObj.fetchAgencyPatients);
	router.post('/fetchPatientLogs',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  logObj.fetchPatientLogs);
	//BlockedAideLogin
	router.post('/getAllAgencyList',[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getAllAgencyList);

	router.post('/deleteAgency',[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.deleteAgency);

	router.post('/getBlockedAideLogin',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getBlockedAideLogin);

	router.post('/getAllAPPVersions',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getAllAPPVersions);
	router.post('/setAllAPPVersions',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.setAllAPPVersions);

	// update patient time zone - Note : remove once timezone is updated
	router.get('/updatePatientTimeZone', loginDetailsObj.updatePatientTimeZone);

	// update patient time zone - Note : remove once timezone is updated
	router.get('/adminActivities', loginDetailsObj.adminActivities);
	//fetch agency aide
	router.post('/fetchAgencyAides',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  logObj.fetchAgencyAides);
	//fetch aide logs
	router.post('/fetchAideLogs',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  logObj.fetchAideLogs);
	router.post('/getAllPatientList',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getAllPatientList);

	router.post('/getPatientData',	[cryptoService.decrypt(), middleware.isApiLoggedIn(), middleware.isAdmin() ] ,  loginDetailsObj.getPatientData);
	//fetch agency aide
	app.use('/login_details', router);
};
