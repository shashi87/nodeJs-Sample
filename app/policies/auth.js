
var models = require("../models");
var path = require("path");
var root = process.cwd();
	var cryptoService = require("../../app/services/crypto");

var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
/*
 *This file contains all the express middlewares defined for access control.
*/

exports.isLoggedIn = function () {
	return function (req, res, next) {
		console.log('hhheeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
		if (req.isAuthenticated()) return next();
		req.flash('message', 'session expired! Please logged in again');
		res.redirect("/index")
	}
}

exports.isApiLoggedIn = function () {
	return function (req, res, next) {
			console.log("isApiLoggedIn )))))))))))))))))))))))))))))))))))))))))))))))))",req.isAuthenticated());

		if (req.isAuthenticated()) return next();
		return res.status(401).json({
			error: "Not Authenticated "
		})
	}
}

exports.isAdmin = function () {

	return function (req, res, next) {
				console.log("isAdmin )))))))))))))))))))))))))))))))))))))))))))))))))",req.isAuthenticated());

		if (req.user && req.user.typeId == 1) return next();
		return res.status(401).json({
			error: "Not Authenticated "
		})
	}
}

exports.setPassport = function (passport) {
	return function (req, res, next) {
		////console.log("passport ->>  " , req.passport)
		req.passport = passport;
		return next();
	}
}

exports.isAgency = function () {
	console.log('uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu');
	return function (req, res, next) {
		if (req.user && req.user.typeId == 3) return next();
		return res.status(401).json({
			error: "Not Authenticated "
		})
	}
}

/*for verification screen*/
exports.isVerification = function () {
	//console.log("is verification 1");
	return function (req, res, next) {
		//console.log("req.user",req.user);
		if (req.user && req.user.typeId == 4) return next();
		return res.status(401).json({
			error: "Not Authenticated "
		})
	}
}

/*for verification screen*/
exports.checkAideApi = function () {
	return function (req, res, next) {
		console.log(req,'******************checkaideapi**************************************');
		if (!req.headers.decoded.token || !req.headers.decoded.email) {
			return res.status(401).json({
				error: "Invalid token."
			})
		}
		let query;
		if (req.headers['access-key'] && req.headers['access-key'] !== '') {
			query = { email: { ilike: req.headers.decoded.email }, aide_key: req.headers['access-key'] }
		} else {
			query = { email: { ilike: req.headers.decoded.email } }
		}
		console.log(req,'******************checkaideapi22222222**************************************');

		models.aide.findOne({
			where: query,
			include: [{
				model: models.aide_tokens,
				where: { token: req.headers.decoded.token },
				required: true
			}]
		}, { raw: true })
			.then(function (aide) {
				if (aide) {
					req.headers.aide_id = aide.id;
					req.headers.agency_id = aide.user_id;
					return next();
				} else {
					return res.status(401).json({
						error: "Invalid token."
					})
				}
			})
			.catch(function (error) {
				//console.log('\n\n\n\n\n ',error)
				return res.status(400).json({
					msg: 'Invalid token.',
					err: error
				});
			});
	}
}
exports.checkBlockedIP = function () {
	return function (req, res, next) {
		var ip = req.ip;
		var login_type;
		if (req.body.type == 1) {
			login_type = 'admin'
		} else if (req.body.type == 2) {
			login_type = 'authorization'
		} else if (req.body.type == 3) {
			login_type = 'agency'
		} else if (req.body.type == 4) {
			login_type = 'verification'
		}
		if (ip) {
			models.blocked_ip.findOne({
				where: { ip: ip }
			}).then(function (result) {
				if (result) {
					return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:CONSTANT_OBJ.MESSAGES.BLOCKED_IP})) })
				} else {
					models.users.findOne({
						where: {
							email_id: { ilike: req.body.username },
							type_id: req.body.type,
							is_deleted: false
						},
					})
						.then(function (user) {
							if (!user) {
								models.false_attempts.findOne({
									where: { ip: ip }
								}).then(function (data) {
									if (data) {
										models.false_attempts.update({ count: data.count + 1 }, {
											where: {
												ip: ip
											}
										}).then(function () {
											if (data.count > 4) {
												console.log('hererreree count > 4')
												//enter in blocked ips
												models.blocked_ip.findOne({
													where: { ip: ip }
												}).then(function (finalresult) {
													if (finalresult) {
														req.flash('error', 'Admin has blocked your account. Contact admin to unblock your account.');
													return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"Admin has blocked your account. Contact admin to unblock your account."})) })

													} else {
														models.blocked_ip.build({ ip: ip }).save()
															.then(function () {
													return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"You have reached the limit of your attempts. Your IP is blocked. Please contact admin to unblock your IP."})) })
															})
													}
												})
											} else {
											return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"Invalid credentials."})) })
											}
										})
									} else {
										models.false_attempts.build({ ip: ip, count: 1 }).save()
											.then(function () {
												return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"Invalid credentials."})) })

											})
									}
								})
									.catch(function (error) {
										return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"Invalid access."})) })

									});
								// return next();
							} else {
								return next();
							}
						})
						.catch(function (error) {
							return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"Invalid access."})) })

						});
				}
			})
				.catch(function (error) {
				return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"Invalid access."})) })

				});

		} else {
		return res.status(401).json({ data:  cryptoService.encrypt(JSON.stringify({message:"Invalid ip address."})) })

		}

	}
}



//middle ware for family app
exports.checkECApi = function () {
	return function (req, res, next) {
		if (!req.headers.decoded.token || !req.headers.decoded.email) {
			return res.status(401).json({
				error: "Invalid token."
			})
		}
		let query;
		if (req.headers['access-key'] && req.headers['access-key'] !== '') {
			query = {
				email: { ilike: req.headers.decoded.email },
				token: req.headers.decoded.token,
				family_key: req.headers['access-key']
			};
		} else {
			query = {
				email: { ilike: req.headers.decoded.email },
				token: req.headers.decoded.token
			}
		}

		models.ec_tokens.findOne({
			where: query
		}, { raw: true })
			.then(function (ec) {
				if (ec) {
					req.headers.ec_email = ec.email;
					return next();
				} else {
					return res.status(401).json({
						error: "Invalid token."
					})
				}
			})
			.catch(function (error) {
				//console.log('\n\n\n\n\n ',error)
				return res.status(400).json({
					msg: 'Invalid token.',
					err: error
				});
			});
	}
}
