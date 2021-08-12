module.exports = function (app, express, passport) {
	var middleware = require("./../app/policies/auth");
	var loginObj = require('./../app/controllers/AuthController.js');
	var path = require("path");
	var root = process.cwd();
	var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
	var router = express.Router();
	var cryptoService = require("./../app/services/crypto");
	// custom Code
	router.post('/login/admin', [passport.authenticate('local-login', { failureRedirect: CONSTANT_OBJ.URLS.API_URL + 'failureRedirectCheck'  , failureFlash: true })], loginObj.authenticate);

	router.post('/login/authorization', [passport.authenticate('local-login', { failureRedirect:  CONSTANT_OBJ.URLS.API_URL + 'failureRedirectCheck' , failureFlash: true })], loginObj.authenticate);

	router.post('/login/agency', [middleware.checkBlockedIP(),
	function(req, res, next) {
    passport.authenticate('local-login',
    function(err, user, info) {
		
        if (!user) {
           return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify(info)) })
        } 
        else{req.logIn(user, function(err) {
        if (err) {
        
        response.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"login failed"})) });
            return;
        }

        next();
        });
    }
            
    })(req, res, next);
    }], loginObj.authenticate);

	router.post('/login/verification', [middleware.checkBlockedIP(), passport.authenticate('local-login', { failureRedirect: CONSTANT_OBJ.URLS.API_URL + 'failureRedirectCheck' , failureFlash: true })], loginObj.authenticate);

	router.get('/getAdminSession', loginObj.getAdminSession);
	router.get('/getAgencySession', loginObj.getAgencySession);
	router.get('/getVerificationSession', loginObj.getVerificationSession);
	router.get('/getAuthSession', loginObj.getAuthSession);
	router.get('/directories', loginObj.directories);
	router.post('/changepassword', loginObj.resetpassword);
	// router.post('/checkToken',loginObj.checkToken);

	app.use('/auth', router);
};
