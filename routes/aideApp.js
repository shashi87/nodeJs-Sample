module.exports = function (app, express, passport,io) {
    var middleware = require("./../app/policies/auth");
    var aideApiObj = require('./../app/controllers/aideApiController.js');
	var verificationObj = require('./../app/controllers/verificationController.js');
    var cryptoService = require("./../app/services/crypto");
    var router = express.Router();
	var fileMiddleware = require("./../app/policies/multer");
    var jwt = require('../app/services/jwt');

    router.post('/aide/login', [cryptoService.decryptMobileData()/*, middleware.isAgency()*/], aideApiObj.login);
    router.get('/aide/details', [jwt.verifyToken(),middleware.checkAideApi()], aideApiObj.getDetails);
    router.get('/patients', [jwt.verifyToken(),middleware.checkAideApi()], aideApiObj.getPatients);
    router.get('/getAllactivities', [jwt.verifyToken(),middleware.checkAideApi()], aideApiObj.getAllactivities);
    router.get('/resetPass/:tokenId', aideApiObj.resetPasswordPage);
    router.get('/aideresetpassword/:tokenId',   aideApiObj.aideChangePasswordTokenVerify );
    router.post('/aide/schedule', [jwt.verifyToken(),middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.getSchedule);
    router.post('/resetPass', [cryptoService.decryptMobileData()], aideApiObj.resetPassword);
    router.post('/changepassword', /*[cryptoService.decryptMobileData()],*/ aideApiObj.changepassword);
    router.post('/getOverAllPerformance', [jwt.verifyToken(),middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.getOverAllPerformance);
    router.post('/aide/updateTask', [jwt.verifyToken(),fileMiddleware.cpUpload_video,middleware.checkAideApi(), cryptoService.decryptMobileData()], function(req, res) {
		verificationObj.saveVerificationData(req, res, io);  });
    router.post('/getLastSchedule', [jwt.verifyToken(),middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.getLastSchedule);
    router.get('/logout', [jwt.verifyToken(),middleware.checkAideApi()], aideApiObj.logout);

    router.post('/aide/getScreenshotNot', [jwt.verifyToken(),middleware.checkAideApi(), cryptoService.decryptMobileData()], function(req, res) {
        verificationObj.getScreenshotNot(req, res, io);
    });


    router.post('/sendMail', [jwt.verifyToken(),fileMiddleware.cpUpload, middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.sendMail);
    //Dummy api fro react 
    router.post('/sendMailWithFile', [jwt.verifyToken(),fileMiddleware.cpUpload, middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.sendMailWithFile);
    router.post('/privacyTerm', [jwt.verifyToken(), middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.privacyTerm);
    router.post('/getAideDetails', [cryptoService.decryptMobileData()], aideApiObj.getAideDetails);
    //Setting > change password
    router.post('/aideChangePassword', [jwt.verifyToken(), middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.aideChangePassword);
    router.post('/aide/getUpdatedSchedule', [jwt.verifyToken(), middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.getUpdatedSchedule);
    // get patient detail
    router.post('/patientDetail', [jwt.verifyToken(), middleware.checkAideApi(), cryptoService.decryptMobileData()], aideApiObj.getPatientDetail);
    router.get('/cryptoService', aideApiObj.cryptoEncyptionTesting);
    app.use('/api', router);
};
