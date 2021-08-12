module.exports = function (app, express, passport) {
    var middleware = require("./../app/policies/auth");
    var familyApiObj = require('./../app/controllers/familyApiController.js');
    var cryptoService = require("./../app/services/crypto");
    var router = express.Router();
    var jwt = require('../app/services/jwt');
    router.post('/login', [cryptoService.decryptMobileData(), /*middleware.isAgency()*/], familyApiObj.login);
    //router.post('/login',  familyApiObj.login);
    router.post('/resetEcPass', [cryptoService.decryptMobileData()], familyApiObj.resetEcPassword);
    //router.post('/resetEcPass',  familyApiObj.resetEcPassword);
    router.get('/resetEcPassword/:tokenId', familyApiObj.resetTokenVerify);
    router.post('/changepasswordEc', /*[cryptoService.decrypt()],*/ familyApiObj.changepasswordEc);
    router.post('/patient/schedule', [jwt.verifyToken(),middleware.checkECApi(),cryptoService.decryptMobileData()], familyApiObj.getFamilySchedule);
    router.post('/getLastSchedule', [jwt.verifyToken(),middleware.checkECApi(),cryptoService.decryptMobileData()], familyApiObj.getLastSchedule);
    router.get('/getAide', [jwt.verifyToken(),middleware.checkECApi()], familyApiObj.getAide);
    router.get('/getPatient', [jwt.verifyToken(),middleware.checkECApi()], familyApiObj.getPatient);
    router.post('/getActivityHistory', [jwt.verifyToken(),middleware.checkECApi(),cryptoService.decryptMobileData()], familyApiObj.getActivityHistory);
    router.post('/getOverAllPerformance', [jwt.verifyToken(), middleware.checkECApi(), cryptoService.decryptMobileData()], familyApiObj.getOverAllPerformance);
    router.post('/getEcDetails', [cryptoService.decryptMobileData()], familyApiObj.getEcDetails);
    router.get('/getAllactivities', [jwt.verifyToken(),middleware.checkECApi()], familyApiObj.getAllactivities);
    router.post('/settings', [jwt.verifyToken(),middleware.checkECApi(),cryptoService.decryptMobileData()], familyApiObj.settings);
    router.get('/logout', [jwt.verifyToken(),middleware.checkECApi()], familyApiObj.logout);
    router.post('/privacyTerm', [jwt.verifyToken(),cryptoService.decryptMobileData(),middleware.checkECApi()], familyApiObj.privacyTerm);
    //Setting > change password
    router.post('/familyChangePassword', [jwt.verifyToken(), middleware.checkECApi(), cryptoService.decryptMobileData()], familyApiObj.familyChangePassword);
    app.use('/familyApp', router);
};
