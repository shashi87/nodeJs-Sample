/*
 *This file contains code related to :
 *agency registeration
 *Invitation Process
 */

var models = require("../models");
var UUID = require('uuid-js');
var moment = require("moment");
var mailer = require('./mailer')
var bcrypt = require('bcryptjs');
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var cryptoService = require("../services/crypto");
var Recaptcha = require('recaptcha-verify');
var recaptcha = new Recaptcha({
	secret: CONSTANT_OBJ.CAPTCHA_SECRET_KEY,
	verbose: true
});
var commonFunction = require('./commonFunction.js')
var isValidPassword = function (userPassword, password) {
	return bcrypt.compareSync(password, userPassword);
}
var STRING_CONSTANTS = require("../constants/stringConstants.js");
var DB_CONSTANTS = require("../constants/dbConstants.js");
var passwordFormat = (password) => {
	var result = [];
	result["status"] = false;
	if (!password) {
		result["status"] = false;
		result["message"] = CONSTANT_OBJ.MESSAGES.PASSWORD_REQUIRED;
	} else if (password.length < 8) {
		result["status"] = false;
		result["message"] = CONSTANT_OBJ.MESSAGES.PASSWORD_CHARACTER_REQUIRED;
	} else if ((/[A-Z]/.test(password)) == false) {
		result["status"] = false;
		result["message"] = CONSTANT_OBJ.MESSAGES.PASSWORD_UPPER_CASE_REQUIRED;
	} else if (!(/[0-9]/.test(password))) {
		result["status"] = false;
		result["message"] = CONSTANT_OBJ.MESSAGES.PASSWORD_NUMBER_REQUIRED;
	} else {
		result["status"] = true;
		result["message"] = CONSTANT_OBJ.MESSAGES.SUCCESS_PASSWORD;
	}
	return result;
}

/*_______________________________________________________________________
* @Date:            21 july 2016
* @Method :         addInvite
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         To add a new Agency.
_________________________________________________________________________
*/
var addInvite = (req, res) => {
	var outputJson;
	if (req.body.email_id && req.body.first_name) {
		let data = {
			email: req.body.email_id.toLowerCase(),
			name: req.body.first_name,
			token: UUID.create().toString(),
			expired_on: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
			status: true,
			type: 1
		}
		let link = CONSTANT_OBJ.URLS.BASE_URL + STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_INVITE + data.token;
		let html = "Hello " + data.name + ", <br/><br/> This is an informatory mail. " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " admin has invited you to join " + CONSTANT_OBJ.SITE_SETTING.SITE_URL + " as an agency. Please visit the following link to register with us :<br/><br/><a href='" + link + "'>" + link + "</a><br/><br/><small>*Please note that the link will expire in 24 hours.</small><br/><br/>  Thank you,<br/>"
			+ CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " Team";
		var subject = "Invitation to register as agency at " + CONSTANT_OBJ.SITE_SETTING.SITE_URL;
		mailer.sendMail(req.body.email_id, html, subject, function (error) {
			if (error) {
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.EMAIL_SENT_ERR,
					error: error
				}
				outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
				return res.status(400).json({
					data: outputJson
				});
			} else {
				models.invite.build(data)
					.save().then(function () {
						getAllInvites(req, res);
					}).catch(function (error) {
						outputJson = {
							msg: error
						}
						outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
						res.status(400).json({
							data: outputJson
						});
					});
			}
		});

	} else {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		}
		outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
		res.status(400).json({
			data: outputJson
		});
	}
};
exports.addInvite = addInvite;

/*________________________________________________________________________
* @Date:            21 july 2016
* @Method :         getAllInvites
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all invitations sent.
_________________________________________________________________________
*/
var getAllInvites = (req, res) => {
	let colName = 'name';
	let order = STRING_CONSTANTS.SORT_ORDER.ASC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};

	if (req.body.showExpired == true) {
		query = {
			order: colName + ' ' + order,
			where: {
				type: 1,
				status: false
			}
		}
	} else {
		query = {
			order: colName + ' ' + order,
			where: {
				type: 1,
				status: true
			}
		}
	}
	models.invite
		.findAndCountAll(query)
		.then(function (result) {
			var outputJson = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(200).json({
				data: outputJson
			})
		});
}
exports.getAllInvites = getAllInvites;

/*________________________________________________________________________
* @Date:            21 july 2016
* @Method :         inviteProcess
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Invitation process.
_________________________________________________________________________
*/
var inviteProcess = (req, res, next) => {
	var inviteId = req.params.inviteId;
	var outputJson = {};
	if (!inviteId) {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.LOGIN_TOKEN_EXPIRED
		}
		res.status(400).json(outputJson);
		return false;
	}
	models.invite.findOne({
		where: {
			token: inviteId,
			status: true,
			type: 1
		}
	}).then(function (data) {
		if (!data) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.LOGIN_TOKEN_EXPIRED
			}
			res.status(400).json(outputJson);
			return false;
		}
		let now = new moment();
		let tokenDate = moment(data.dataValues.expired_on);
		if (tokenDate.diff(now) < 0) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.INVITATION_EXPIRED
			}
			res.status(400).json(outputJson);
			return false;
		}
		data.dataValues.inviteId = inviteId;

		outputJson = {
			status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
			messageId: 200,
			data: data
		}
		outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
		res.status(200).json({
			data: outputJson
		});
	}).catch(function (error) {
		outputJson = {
			msg: STRING_CONSTANTS.STATUS_CONSTANT.ERROR
		}
		res.status(400).json(outputJson);
	});
}
exports.inviteProcess = inviteProcess;

var registerAide = (req, res) => {
	var agent_value = req.headers['user-agent']
	var inviteId = req.params.inviteId;
	if (!inviteId) res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);

	models.aide.findOne({
		where: {
			token: inviteId,
			is_active: true
		}
	}).then(function (data) {
		if (!data) {
			// TODO - SEND FLASH MESSAGE FROM HERE
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_TOKEN);
			return res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}
		models.aide_passwords.findOne({
			where: {
				aide_id: data.dataValues.id
			}
		}).then(function (pass) {
			if (pass) {
				// TODO - SEND FLASH MESSAGE FROM HERE
				req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, 'This token has already been used');
				return res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
			}
			let now = new moment();
			let tokenDate = moment(data.dataValues.createdAt).add('days', 1);
			if (tokenDate.diff(now) < 0) {
				req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVITATION_EXPIRED);
				res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
			}
			data.dataValues.inviteId = inviteId;
			if (agent_value.indexOf(STRING_CONSTANTS.DEVICE_TYPE.IPHONE) > -1 || agent_value.indexOf(STRING_CONSTANTS.DEVICE_TYPE.ANDROID) > -1 || agent_value.indexOf(STRING_CONSTANTS.DEVICE_TYPE.IPAD) > -1) {
				res.render("aideRegistrationApp.ejs", {
					"data": data.dataValues,
					"agent_value": agent_value,
					message: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR),
					siteName: CONSTANT_OBJ.SITE_SETTING.SITE_NAME
				});
			} else {
				res.render("aideRegistration.ejs", {
					"data": data.dataValues,
					message: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR),
					siteName: CONSTANT_OBJ.SITE_SETTING.SITE_NAME

				});
			}

		})
		// TODO - Check expiration data from here .

	}).catch(function (error) {
		// :: TODO - Send flash message from here
		req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, error);
		res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
	});

}
exports.registerAide = registerAide;

var aideRegistration = (req, res) => {
	let userResponse = req.body['g-recaptcha-response'];
	recaptcha.checkResponse(userResponse, function (error, response) {
		if (error) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_CAPTCHA)
			req.params.inviteId = req.body.inviteId;
			registerAide(req, res);
		}
		if (response.success) {
			// save session.. create user.. save form data.. render page, return json.. etc.
		} else {
			// show warning, render page, return a json, etc.
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_CAPTCHA)
			req.params.inviteId = req.body.inviteId;
			registerAide(req, res);
		}
		if (!req.body.email || !req.body.inviteId || (req.body.password != req.body.confirmpassword)) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.MISSING_INFO);
			res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}
		models.aide.findOne({
			where: {
				token: req.body.inviteId,
				is_active: true,
				email: {
					ilike: req.body.email
				}
			}
		}).then(function (data) {
			if (!data) {
				// TODO - SEND FLASH MESSAGE FROM HERE
				req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVITED_EMAIL_MISMATCH);
				req.params.inviteId = req.body.inviteId;
				registerAide(req, res);
			} else {
				let salt = bcrypt.genSaltSync(data.dataValues.id % 10);
				let hash = bcrypt.hashSync(req.body.password, salt);
				let userPass = {
					aide_id: data.dataValues.id,
					password: hash
				}
				models.aide_passwords.build(userPass)
					.save().then(function () {
						req.flash(STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS, CONSTANT_OBJ.MESSAGES.AIDE_ADD_SUCCESS);
						return res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
					})
			}
		}).catch(function (error) {
			// :: TODO - Send flash message from here
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, error);
			req.params.inviteId = req.body.inviteId;
			registerAide(req, res);
		});
	})
}
exports.aideRegistration = aideRegistration;


var aideAppRegistration = (req, res) => {
	var outputJson = {}
	var passwordFormatCheck = passwordFormat(req.body.password);
	if (passwordFormatCheck.status != true) {
		outputJson = {
			msg: passwordFormatCheck.message
		}
		return res.status(400).json(outputJson);
	}
	var userResponse = req.body['g-recaptcha-response'];
	recaptcha.checkResponse(userResponse, function (error, response) {
		if (error) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_CAPTCHA)
			req.params.inviteId = req.body.inviteId;
		}
		if (!response.success) {
			// show warning, render page, return a json, etc.
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_CAPTCHA)
			req.params.inviteId = req.body.inviteId;
		}
		if (!req.body.email || !req.body.inviteId || (req.body.password != req.body.confirmpassword)) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.MISSING_INFO);
			res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}
		models.aide.findOne({
			where: {
				token: req.body.inviteId,
				is_active: true,
				email: {
					ilike: req.body.email
				}
			}
		}).then(function (data) {
			if (!data) {
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.INVITED_EMAIL_MISMATCH
				}
				res.status(400).json(outputJson);
			} else {
				var salt = bcrypt.genSaltSync(data.dataValues.id % 10);
				var hash = bcrypt.hashSync(req.body.password, salt);
				var userPass = {
					aide_id: data.dataValues.id,
					password: hash
				}
				models.aide_passwords.build(userPass)
					.save().then(function () {
						outputJson.msg = CONSTANT_OBJ.MESSAGES.EMERGENCY_SIGNUP_SUCCESS;
						outputJson.data = {};
						outputJson = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson));
						res.status(200).json({
							data: outputJson
						})
					}).catch(function (err) {
						//console.log('\n\n\n', err);

					});
			}
		}).catch(function (error) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.CONTACT_ALREADY_REGISTERED
			}
			res.status(400).json(outputJson);
		});
	})
}
exports.aideAppRegistration = aideAppRegistration;


var captchaErrCase = (req, res) => {
	var inviteId = req.body.inviteId;
	if (!inviteId) {
		res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN)
	}
	models.invite.findOne({
		where: {
			token: inviteId,
			status: true,
			type: 1
		}
	}).then(function (data) {
		if (!data) {
			// TODO - SEND FLASH MESSAGE FROM HERE
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_TOKEN);
			return res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}
		// TODO - Check expiration data from here .
		let now = new moment();
		let tokenDate = moment(data.dataValues.expired_on);
		if (tokenDate.diff(now) < 0) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVITATION_EXPIRED);
			res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}
		data.dataValues.inviteId = inviteId;
		let redirectTo = CONSTANT_OBJ.URLS.BASE_URL + STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_INVITE + req.body.inviteId;
		req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_CAPTCHA)
		res.redirect(redirectTo);
	}).catch(function (error) {
		// :: TODO - Send flash message from here
		req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, error);
		res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
	});
}
exports.captchaErrCase = captchaErrCase;

/*________________________________________________________________________
* @Date:            21 july 2016
* @Method :         registration
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Agency Invitation process.
_________________________________________________________________________
*/
var registration = (req, res, next) => {
	var outputJson;
	var userResponse = req.body['g-recaptcha-response'];

	//Captcha has been  removed from agency registration
	/*recaptcha.checkResponse(userResponse, function (error, response) {
		if (error) {
			//console.log('error');
			return captchaErrCase(req, res);
		}
		if (response.success) {
			// save session.. create user.. save form data.. render page, return json.. etc.
			//console.log('sucess');
		} else {
			// show warning, render page, return a json, etc.
			// console.log('not maching');
			return captchaErrCase(req, res);
		}*/
		//return;
		var inviteId = req.body.inviteId;
		if (!inviteId || !req.body.password || !req.body.first_name || !req.body.email) return res.status(400).json({
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		});
		req.body.phno = req.body.phno.replace(/\D/g, '');
		req.body.emgphno = req.body.emgphno.replace(/\D/g, '');

		models.invite.findOne({
			where: {
				token: inviteId
			}
		}).then(function (invitationObj) {
			if (!invitationObj) {
				res.status(400).json({
					msg: CONSTANT_OBJ.MESSAGES.INVALID_TOKEN
				});
			}

			var now = new moment();
			var tokenDate = moment(invitationObj.dataValues.expired_on);
			if (tokenDate.diff(now) < 0) {
				res.status(400).json({
					msg: CONSTANT_OBJ.MESSAGES.INVITATION_EXPIRED
				});
			}

			//check here if user is already registered
			models.users.findOne({
				where: {
					email_id: {
						ilike: req.body.email.toLowerCase(),
					},
					is_deleted: false
				}
			}).then(function (data) {
				if (data) {
					res.status(400).json({
						msg: CONSTANT_OBJ.MESSAGES.ALREADY_REGISTER
					});
				} else {
					models.users.findOne({
						where: {
							//user_name: req.body.username     commented by raman
							email_id: req.body.email,
							is_deleted: false
						}
					}).then(function (data) {
						if (data) return res.status(400).json({
							msg: CONSTANT_OBJ.MESSAGES.USERNAME_EXIST
						});

						// SaveInfo
						var agencyObj = {
							typeId: 3,
							email_id: req.body.email.toLowerCase(),
							first_name: req.body.first_name,
							// user_name: req.body.username,   commented by raman
							phone_number: req.body.phno,
							is_deleted: false
						}

						models.users_password.build({
							"user_password": req.body.password
						}).save()
							.then(function (passwordObj) {
								agencyObj.pswdId = passwordObj.dataValues.id;
								// SaveInfo to Profile table
								let profileObj = {
									mainphone: req.body.phno,
									emergencyphone: req.body.emgphno,
									address: req.body.headqradd,
									city: req.body.city,
									state: req.body.state,
									zipcode: req.body.pincode,
									unit: req.body.unit
								}
								models.user_profiles.build(profileObj).save()
									.then(function (profileData) {
										agencyObj.profileId = profileData.dataValues.id;
										agencyObj.is_deleted = false;
										delete agencyObj.id;
										//Saving data to users table
										models.users.build(agencyObj)
											.save().then(function (data) {
												//Updating data to password table
												let salt = bcrypt.genSaltSync(data.dataValues.id % 10);
												let hash = bcrypt.hashSync(req.body.password, salt);
												passwordObj.user_password = hash;
												passwordObj.user_id = data.dataValues.id;
												passwordObj.save().then(function () {
													"passwordObj Updated"
												});
												//Updating data to invitation table
												invitationObj.status = false;
												invitationObj.save();
												//Updating data to profile table
												profileData.user_id = data.dataValues.id;
												profileData.save().then(function () {
													req.body.username = req.body.email;
													req.login(data.dataValues, function (err) {
														if (err) return next(err);
														let outputJson = {
															msg: CONSTANT_OBJ.MESSAGES.AGENCY_CREATED_SUCCESSFULLY
														};
														outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
														res.status(200).jsonp({
															data: outputJson
														});
													});
												}).catch(function (err) {

												});
											}).catch(function (error) {
												outputJson = {
													msg: error
												}
												res.status(400).json(outputJson);
											});
									}).catch(function (error) {
										outputJson = {
											msg: error
										}
										res.status(400).json(outputJson);
									});
							})
							.catch(function (error) {
								outputJson = {
									msg: error
								}
								res.status(400).json(outputJson);
							})
					}).catch(function (error1) {
						outputJson = {
							msg: error1
						}
						res.status(400).json(outputJson);
					});
				}
			});

		}).catch(function (error) {
			outputJson = {
				msg: error
			}
			res.status(400).json(outputJson);
		});

	/*});*/

}
exports.registration = registration;

exports.deleteAgencyInvite = (req, res) => {
	var outputJson = {};
	models.invite.destroy({
		where: {
			id: req.body.id,
		}
	}).then(function () {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.SUCCESS_DELETE_MSG
		};
		outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
		res.status(200).jsonp({
			data: outputJson
		});

	}).catch(function (error) {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.AGENCY_DEL_ERR
		}
		outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
		res.status(400).jsonp({
			data: outputJson
		});
	})

}

/*________________________________________________________________________
* @Date:            21 july 2016
* @Method :         registration
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Get agency Data.
_________________________________________________________________________
*/
var getSessionData = (req, res) => {
	var b = 1;
	outer();
	console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeee', b)
	models.users.findOne({
		where: {
			id: req.user.id
		}
	})
		.then(function (result) {
			let outputJson = {
				data: result
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(200).jsonp({
				data: outputJson
			});
		})
		.catch(function (err) {
			//console.log('\n\n\n', err)
			let outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(400).jsonp({
				data: outputJson
			});
		})

}
exports.getSessionData = getSessionData;

function outer() {
	var b = 2;
	function inner() { b++; var b = 3; console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',b) }
	inner();
}

var emergencyRegistration = (req, res) => {
	var outputJson = {}

	var passwordFormatCheck = passwordFormat(req.body.password);
	if (passwordFormatCheck.status != true) {
		outputJson = {
			msg: passwordFormatCheck.message
		}
		return res.status(400).json(outputJson);
	}

	var userResponse = req.body['g-recaptcha-response'];
	if (!req.body.inviteId) {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.CHECK_AND_TRY_AGAIN
		}
		return res.status(400).json(outputJson);
	}
	recaptcha.checkResponse(userResponse, function (error, response) {
		if (error) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_CAPTCHA)
			req.params.inviteId = req.body.inviteId;
		}

		if (!response.success) {
			// show warning, render page, return a json, etc.
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_CAPTCHA)
			req.params.inviteId = req.body.inviteId;
		}
		if (!req.body.email || !req.body.inviteId || (req.body.password != req.body.confirmpassword)) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.MISSING_INFO);
			res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}

		models.emergency_contacts.findOne({
			where: {
				token: req.body.inviteId,
				email: req.body.email,
			}
		}).then(function (data) {
			if (!data) {
				// TODO - SEND FLASH MESSAGE FROM HERE
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.INVITED_EMAIL_MISMATCH
				}
				res.status(400).json(outputJson);
			} else if (data.is_verified == true) {
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.CONTACT_ALREADY_REGISTERED
				}
				res.status(400).json(outputJson);
			} else {
				let salt = bcrypt.genSaltSync(data.dataValues.id % 10);
				let hash = bcrypt.hashSync(req.body.password, salt);
				let userPass = {
					password: hash,
					is_verified: true
				}
				models.emergency_contacts.update(userPass, {
					where: {
						email: req.body.email.toLowerCase(),
						is_active: true

					}
				}).then(function () {
					outputJson.msg = CONSTANT_OBJ.MESSAGES.EMERGENCY_SIGNUP_SUCCESS;
					outputJson.data = {};
					outputJson = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson));
					res.status(200).json({
						data: outputJson
					})
				})
					.catch(function (err) {
						//console.log('\n\n\n', err);

					});
			}
		}).catch(function (error) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.CONTACT_ALREADY_REGISTERED
			}
			res.status(400).json(outputJson);
		});
	})
}
exports.emergencyRegistration = emergencyRegistration;


/*________________________________________________________________________
* @Date:            12 June 2017
* @Method :         get notification
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Get notification.
_________________________________________________________________________
*/
var getNotCount = (req, res) => {
	models.notification.findAndCountAll({
		where: {
			is_deleted: false,
			agency_id: req.user.id,
			is_read: false
		},
		include: [{
			model: models.aide,
			attributes: [DB_CONSTANTS.AIDE.ID, DB_CONSTANTS.AIDE.FIRST_NAME, DB_CONSTANTS.AIDE.LAST_NAME],
			include: [{
				attributes: [DB_CONSTANTS.AIDE_DETAILS.PIC],
				model: models.aide_details,
				required: false
			}]
		}],
		order: [
			[DB_CONSTANTS.NOTIFICATIONS.ID, STRING_CONSTANTS.SORT_ORDER.DESC]
		],
		offset: JSON.parse(req.body).offset,
		
		limit: 5
	})
		.then(function (result) {
			var outputJson = {
				data: result.rows,
				totalRecords: result.count
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(200).jsonp({
				data: outputJson
			});
		})
		.catch(function (err) {
			var outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(400).jsonp({
				data: outputJson
			});
		})

}
exports.getNotCount = getNotCount;

/*________________________________________________________________________
* @Date:            12 June 2017
* @Method :         get notification
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         delete notifications
_________________________________________________________________________
*/
var deleteNotCount = (req, res) => {
	let inputData = req.body;
	let data = {
		is_deleted: inputData.is_deleted
	}
	models.notification.update(data, {
		where: {
			id: inputData.id
		}
	}).then(function () {
		let output = {
			msg: CONSTANT_OBJ.MESSAGES.SUCCESS_DELETE_MSG
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(200).json({
			data: output
		});
	})
		.catch(function (err) {
			//console.log('\n\n\n', err)
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});


}
exports.deleteNotCount = deleteNotCount;



/*________________________________________________________________________
* @Date:            12 June 2017
* @Method :         get notification
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         get data to show in notification popup
_________________________________________________________________________
*/
var getNotData = (req, res) => {
	console.log('------------------req.body---------------**************************************************', req.body.aide_activities);
	models.aide_activities.findAll({
		where: {
			id: req.body.aide_activities
		},
		include: [{
			model: models.schedule_activities,
			include: [{
				// attributes: ['parent_node_id'],
				model: models.admin_activities,
			}
			],
			required: true,
			where: {
				id: req.body.scheduled_activity_id
			}
		}, {
			model: models.aide,
			required: true,
			where: {
				id: req.body.aide_id
			},
			include: [{
				model: models.aide_details,
				required: false
			}]
		}, {
			model: models.schedule,
			required: true,
			where: {
				id: req.body.scheduled_id
			}
		}, {
			model: models.patients,
			required: false,
			where: {
				id: req.body.patient_id
			},
			include: [{
				model: models.patient_details,
				required: false
			}, {
				model: models.emergency_contacts,
				required: true
			}]
		}, {
			model: models.verification_requests,
			required: false
		}]
	})
		.then(function (data) {
			console.log('data-------------------------------------------', data)
			for (let i = 0; i <= data.length; i++) {
				if (data[i]) {
					data[i].patient.first_name = cryptoService.decryptString(data[i].patient.first_name);
					data[i].patient.last_name = cryptoService.decryptString(data[i].patient.last_name);
					data[i].patient.patient_detail.address = cryptoService.decryptString(data[i].patient.patient_detail.address);
					data[i].patient.patient_detail.dob = cryptoService.decryptString(data[i].patient.patient_detail.dob);
					if (data[i].patient.patient_detail.ssn != null) {
						data[i].patient.patient_detail.ssn = cryptoService.decryptString(data[i].patient.patient_detail.ssn);
					}
					if (data[i].patient.patient_detail.phone != null) {
						data[i].patient.patient_detail.phone = cryptoService.decryptString(data[i].patient.patient_detail.phone);
					}
					if (data[i].patient.patient_detail.email != null) {
						data[i].patient.patient_detail.email = cryptoService.decryptString(data[i].patient.patient_detail.email);
					}
				}
			}
			let output = {
				data: {
					rows: data,
					count: data.length
				}
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			res.status(200).json({
				data: output
			})
		})
}
exports.getNotData = getNotData;


/*________________________________________________________________________
* @Date:            12 June 2017
* @Method :         get notification
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         change status after clicking on notification.
_________________________________________________________________________
*/
var changeStatus = (req, res) => {
	let data = {
		is_read: true
	}
	models.notification.update(data, {
		where: {
			id: req.body.id
		}
	}).then(function () {
		let output = {
			msg: CONSTANT_OBJ.MESSAGES.STATUS_UPDATED
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(200).json({
			data: output
		});
	})
		.catch(function (err) {
			//console.log('\n\n\n', err)
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});


}
exports.changeStatus = changeStatus;

/*________________________________________________________________________
* @Date:            8 August 2017
* @Method :         addVPInvite
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         To add a new verification person.
_________________________________________________________________________
*/
var addVPInvite = (req, res) => {
	var outputJson = {};
	var outputJson1;
	if (req.body.email_id && req.body.first_name) {
		var data = {
			email: req.body.email_id.toLowerCase(),
			name: req.body.first_name,
			token: UUID.create().toString(),
			expired_on: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
			status: true,
			type: 4
		}
		models.invite.find({
			where: {
				status: true,
				email: {
					ilike: data.email.toLowerCase()
				}
			}
		}).then(function (invitedata) {
			if (invitedata) {
				outputJson.msg = CONSTANT_OBJ.MESSAGES.AGENCY_ALREADY_EXIST
				outputJson1 = cryptoService.encrypt(JSON.stringify(outputJson));
				res.status(400).json({
					data: outputJson1
				});
			} else {
				let link = CONSTANT_OBJ.URLS.BASE_URL + 'invite/vp/' + data.token;
				let html = "Hello " + data.name + ", <br/><br/> This is an informatory mail. " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " admin has invited you to join " + CONSTANT_OBJ.SITE_SETTING.SITE_URL + " as a verification person. Please visit the following link to register with us :<br/><br/><a href='" + link + "'>" + link + "</a><br/><br/><small>*Please note that the link will expire in 24 hours.</small><br/><br/>  Thank you,<br/> " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + "Team";
				let subject = "Invitation to register as verification person at " + CONSTANT_OBJ.SITE_SETTING.SITE_URL;
				mailer.sendMail(req.body.email_id, html, subject, function (error) {
					if (error) {
						outputJson = {
							msg: CONSTANT_OBJ.MESSAGES.EMAIL_SENT_ERR,
							error: error
						}
						outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
						return res.status(400).json({
							data: outputJson
						});
					} else {
						models.invite.build(data)
							.save().then(function () {
								getAllInvites(req, res);
							}).catch(function (error) {
								outputJson = {
									msg: error
								}
								outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
								res.status(400).json({
									data: outputJson
								});
							});
					}
				});
			}
		}).catch(function (error) {
			outputJson = {
				msg: error
			}
			res.status(400).json(outputJson);
		});

	} else {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		}
		outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
		res.status(400).json({
			data: outputJson
		});
	}
};
exports.addVPInvite = addVPInvite;


/*________________________________________________________________________
* @Date:            10 August 2017
* @Method :         getAllVpInvites
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all invitations sent to verification person.
_________________________________________________________________________
*/
var getAllVpInvites = (req, res) => {
	//console.log("req.body", req.body);
	let pageSize = req.body.limit || 10;
	let page = req.body.page || 1;
	let offset = (page - 1) * pageSize;
	let colName = 'name';
	let order = STRING_CONSTANTS.SORT_ORDER.ASC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};
	if (req.body.showExpired == true) {
		query = {
			order: colName + ' ' + order,
			where: {
				type: 4,
				status: false
			},
			/*order: [
                [Sequelize.fn(Sequelize.col(colName)), order]
            ],*/
			offset: offset,
			limit: pageSize,
		}
	} else {
		query = {
			order: colName + ' ' + order,
			where: {
				type: 4,
				status: true
			},
			// order: [
			//     [Sequelize.fn(Sequelize.col(colName)), order]
			// ],
			offset: offset,
			limit: pageSize
		}
	}
	models.invite
		.findAndCountAll(query)
		.then(function (result) {
			var outputJson = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(200).json({
				data: outputJson
			})
		});
}
exports.getAllVpInvites = getAllVpInvites;

/*________________________________________________________________________
* @Date:            10 August 2017
* @Method :         inviteVp
* Created By:       smartData Enterprises Ltd
* Modified On:      14 April 2021
* @Purpose:         Invitation process of verification process.
_________________________________________________________________________
*/
var inviteVp = (req, res, next) => {
	var inviteId = req.params.inviteId;
	if (!inviteId) res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);

	models.invite.findOne({
		where: {
			token: inviteId,
			status: true,
			type: 4
		}
	}).then(function (data) {
		if (!data) {
			return res.status(400).json({
				data: data,
				msg: CONSTANT_OBJ.MESSAGES.INVALID_TOKEN,
				siteName: CONSTANT_OBJ.SITE_SETTING.SITE_NAME
			});
			// This was old code used with angularJS
			// TODO - SEND FLASH MESSAGE FROM HERE
			// req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVALID_TOKEN);
			// return res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}
		// TODO - Check expiration data from here .
		let now = new moment();
		let tokenDate = moment(data.dataValues.expired_on);
		if (tokenDate.diff(now) < 0) {
			return res.status(400).json({
				data: data.dataValues,
				msg: CONSTANT_OBJ.MESSAGES.INVITATION_EXPIRED,
				siteName: CONSTANT_OBJ.SITE_SETTING.SITE_NAME
			});
			// req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.INVITATION_EXPIRED);
			// res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		}
		data.dataValues.inviteId = inviteId;
		let outputJson = cryptoService.encrypt(JSON.stringify(data.dataValues));
		return res.status(200).jsonp({
			data: outputJson
		});

		// This was old code used with angularJS
		// res.render("vpRegistration.ejs", {
		// 	"data": data.dataValues,
		// 	message: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR),
		// 	siteName: CONSTANT_OBJ.SITE_SETTING.SITE_NAME
		// });
	}).catch(function (error) {
		// :: TODO - Send flash message from here
		// req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, error);
		// res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
		return res.status(400).json({
			msg: CONSTANT_OBJ.MESSAGES.INVALID_TOKEN,
			siteName: CONSTANT_OBJ.SITE_SETTING.SITE_NAME
		});
	});
}
exports.inviteVp = inviteVp;



/*________________________________________________________________________
* @Date:            10 August 2017
* @Method :         registrationVp
* Created By:       smartData Enterprises Ltd
* Modified On:      15 April 2021
* @Purpose:         Vp Invitation process.
_________________________________________________________________________
*/
var registrationVp = (req, res, next) => {
	var outputJson;
	// Commented recaptcha as discussed with client.
	// var userResponse = req.body['g-recaptcha-response'];
	// recaptcha.checkResponse(userResponse, function (error, response) {
		// if (error) {
			// return captchaErrCase(req, res);
		// }
		// if (!response.success) {
			// show warning, render page, return a json, etc.
			// return captchaErrCase(req, res);
		// }
		//return;
		var inviteId = req.body.inviteId;
		// || !req.body.username
		if (!inviteId || !req.body.password || !req.body.first_name || !req.body.email) return res.status(400).json({
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		});
		req.body.phno = req.body.phno.replace(/\D/g, '');
		req.body.emgphno = req.body.emgphno.replace(/\D/g, '');

		models.invite.findOne({
			where: {
				token: inviteId
			}
		}).then(function (invitationObj) {
			if (!invitationObj) {
				res.status(400).json({
					msg: CONSTANT_OBJ.MESSAGES.INVALID_TOKEN
				});
			}

			let now = new moment();
			let tokenDate = moment(invitationObj.dataValues.expired_on);
			if (tokenDate.diff(now) < 0) {
				res.status(400).json({
					msg: CONSTANT_OBJ.MESSAGES.INVITATION_EXPIRED
				});
			}
			//check here if user is already registered
			if (req.body.email) {
				req.body.email = req.body.email.toLowerCase();
			}
			models.users.findOne({
				where: {
					email_id: {
						ilike: req.body.email
					},
					is_deleted: false
				}
			}).then(function (data) {
				if (data) {
					return res.status(400).json({
						msg: CONSTANT_OBJ.MESSAGES.ALREADY_REGISTER
					});
					// req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.ALREADY_REGISTER);
					// res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.AGENCY_LOGIN);
				} else {
					models.users.findOne({
						where: {
							email_id: req.body.email,
							is_deleted: false
						}
					}).then(function (data) {
						if (data) return res.status(400).json({
							msg: CONSTANT_OBJ.MESSAGES.USERNAME_EXIST
						});

						// SaveInfo
						var agencyObj = {
							typeId: 4,
							email_id: req.body.email.toLowerCase(),
							first_name: req.body.first_name,
							phone_number: req.body.phno
						}

						models.users_password.build({
							"user_password": req.body.password
						}).save()
							.then(function (passwordObj) {
								agencyObj.pswdId = passwordObj.dataValues.id;
								// SaveInfo to Profile table
								var profileObj = {
									mainphone: req.body.phno,
									emergencyphone: req.body.emgphno,
									address: req.body.headqradd,
									city: req.body.city,
									state: req.body.state,
									zipcode: req.body.pincode
								}
								models.user_profiles.build(profileObj).save()
									.then(function (profileData) {
										agencyObj.profileId = profileData.dataValues.id;
										agencyObj.is_deleted = false;
										//Saving data to users table
										models.users.build(agencyObj)
											.save().then(function (data) {
												//Updating data to password table
												var salt = bcrypt.genSaltSync(data.dataValues.id % 10);
												var hash = bcrypt.hashSync(req.body.password, salt);
												passwordObj.user_password = hash;
												passwordObj.user_id = data.dataValues.id;
												passwordObj.save().then(function () {
													"passwordObj Updated"
												});
												//Updating data to invitation table
												invitationObj.status = false;
												invitationObj.save();
												//Updating data to profile table
												profileData.user_id = data.dataValues.id;
												profileData.save().then(function () {
													req.body.username = req.body.email;
													req.login(data.dataValues, function (err) {
														if (err) return next(err);
														// res.redirect(STRING_CONSTANTS.ROUTES_CONSTANTS.BASE_URL);
														outputJson = cryptoService.encrypt(JSON.stringify(data.dataValues));
														return res.status(200).jsonp({
															data: outputJson
														});
													});


												}).catch(function (err) {

												});
											}).catch(function (error) {
												outputJson = {
													msg: error
												}
												res.status(400).json(outputJson);
											});
									}).catch(function (error) {
										outputJson = {
											msg: error
										}
										res.status(400).json(outputJson);
									});
							})
							.catch(function (error) {
								outputJson = {
									msg: error
								}
								res.status(400).json(outputJson);
							})
					}).catch(function (error1) {
						outputJson = {
							msg: error1
						}
						res.status(400).json(outputJson);
					});
				}
			});

		}).catch(function (error) {
			outputJson = {
				msg: error
			}
			res.status(400).json(outputJson);
		});

	// });

}
exports.registrationVp = registrationVp;


/*________________________________________________________________________
* @Date:            10 August 2017
* @Method :         deleteVPInvite
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Delete verification person.
_________________________________________________________________________
*/
exports.deleteVPInvite = (req, res) => {
	var outputJson = {};
	models.invite.destroy({
		where: {
			id: req.body.id,
		}
	}).then(function () {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.SUCCESS_DELETE_MSG
		};
		outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
		res.status(200).jsonp({
			data: outputJson
		});

	}).catch(function (error) {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.AGENCY_DEL_ERR
		}
		outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
		res.status(400).jsonp({
			data: outputJson
		});
	})

}


var getAgencySession = (req, res) => {
	models.users.findOne({
		where: {
			id: req.user.id
		}
	})
		.then(function (result) {
			let outputJson = {
				data: result
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(200).jsonp({
				data: outputJson
			});
		})
		.catch(function (err) {
			//console.log('\n\n\n', err)
			let outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(400).jsonp({
				data: outputJson
			});
		})

}
exports.getAgencySession = getAgencySession;



var changePassword = (req, res) => {
	var outputJson = {};
	var output;
	var passwordFormatCheck;
	if (!req.body.oldPassword || !req.body.password) {
		outputJson = {
			msg: CONSTANT_OBJ.MESSAGES.MISSING_INFO
		}

		output = cryptoService.encrypt(JSON.stringify(outputJson));
		return res.status(400).json({
			data: output
		});
	}
	passwordFormatCheck = commonFunction.passwordFormat(req.body.oldPassword);
	if (passwordFormatCheck.status != true) {
		outputJson = {
			msg: "Old " + passwordFormatCheck.message
		}
		output = cryptoService.encrypt(JSON.stringify(outputJson));
		return res.status(400).json({
			data: output
		});
	}
	passwordFormatCheck = commonFunction.passwordFormat(req.body.password);
	if (passwordFormatCheck.status != true) {
		outputJson = {
			msg: "New " + passwordFormatCheck.message
		}
		output = cryptoService.encrypt(JSON.stringify(outputJson));
		return res.status(400).json({
			data: output
		});
	}
	models.users.findOne({
		where: {
			id: req.user.id
		}
	})
		.then(function (result) {
			models.users_password.findOne({
				where: {
					user_id: req.user.id
				}
			})
				.then(function (resultdata) {
					if (!isValidPassword(resultdata['user_password'], req.body.oldPassword)) {
						outputJson = {
							msg: CONSTANT_OBJ.MESSAGES.CHECK_EXISTING_PASSWORD
						}
						output = cryptoService.encrypt(JSON.stringify(outputJson));
						return res.status(400).json({
							data: output
						});
					}
					// Old password and new password cannot be same
					else if (isValidPassword(resultdata['user_password'], req.body.password)) {
						outputJson = {
							msg: CONSTANT_OBJ.MESSAGES.TRY_DIFFERENT_PASSWORD
						}
						output = cryptoService.encrypt(JSON.stringify(outputJson));
						return res.status(400).json({
							data: output
						});
					} else if (!isValidPassword(resultdata['user_password'], req.body.password)) {
						let salt = bcrypt.genSaltSync(req.user.id % 10);
						let hash = bcrypt.hashSync(req.body.password, salt);
						let data = {
							user_password: hash
						}
						let fields = {
							user_password: data.user_password
						};

						models.users_password.update(
							fields, {
							where: {
								user_id: req.user.id
							}
						}
						).then(function () {
							outputJson.data = {};
							outputJson.data.msg = CONSTANT_OBJ.MESSAGES.PASSWD_CHANGE;
							outputJson.data = cryptoService.encrypt(JSON.stringify(outputJson.data));
							res.status(200).jsonp(outputJson);
						}).catch(function (error) {
							outputJson = {
								msg: error
							}
							res.status(400).json(outputJson);
						})
					}
				})
				.catch(function (err) {
					//console.log('\n\n\n', err)
					let outputJson = {
						msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
					}
					outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
					res.status(400).jsonp({
						data: outputJson
					});
				})
		})
		.catch(function (err) {
			//console.log('\n\n\n', err)
			let outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			outputJson = cryptoService.encrypt(JSON.stringify(outputJson));
			res.status(400).jsonp({
				data: outputJson
			});
		})

}
exports.changePassword = changePassword;
