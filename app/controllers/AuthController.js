/*
 *This file contains code relaed to :
 *layout rendering
 *directory lookup
 *get sessions
 */
var models = require("../models");
var UUID = require('uuid-js');
var moment = require("moment");
var mailer = require('./mailer');
var bcrypt = require("bcryptjs");
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var cryptoService = require("../services/crypto");
var STRING_CONSTANTS = require("../constants/stringConstants.js");
var AuthController = {
	authenticate: function (req, res, next) {
		console.log('-----------authenticate---------------',req.isAuthenticated());
		if (req.isAuthenticated()) {
			if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.AGENCY) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.SUPER_ADMIN) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.VERIFICATION) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.AUTHORIZATION) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else {
				output = {
					error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(401).json({ data: output });
			}

		} else {
			output = {
				error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED,
				message: req.flash('error'),
				successMsg: req.flash('success')
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(401).json({ data: output });
		}
	},
	index: function (req, res, next) {
		res.sendFile(path.join(__dirname + STRING_CONSTANTS.FILE_CONSTANTS.INDEX_FILE_PATH));
	},
	getAdminSession: function (req, res) {
		var output;
				console.log(req.user,'ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');

		if (req.isAuthenticated()) {
			if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.SUPER_ADMIN) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else {
				output = {
					error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(401).json({ data: output });
			}
		} else {
			output = {
				error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(401).json({ data: output });
		}
	},
	getAuthSession: function (req, res) {
		var output;
		if (req.isAuthenticated()) {
			if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.AUTHORIZATION) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else {
				output = {
					error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(401).json({ data: output });
			}
		} else {
			output = {
				error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(401).json({ data: output });
		}
	},
	getAgencySession: function (req, res) {
		var output;
		console.log(req.isAuthenticated(),'ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
		if (req.isAuthenticated()) {
			if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.AGENCY) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else {
				output = {
					error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(401).json({ data: output });
			}
		} else {
			output = {
				error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(401).json({ data: output });
		}
	},
	/*for verification screen*/
	getVerificationSession: function (req, res) {
		var output;
		if (req.isAuthenticated()) {
			if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.VERIFICATION) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			} else {
				output = {
					error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(401).json({ data: output });
			}
		} else {
			output = {
				error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(401).json({ data: output });
		}
	},
	/*end verification screen*/
	directories: function (req, res) {
		var outputJson;
		if (req.isAuthenticated()) {
			//console.log("******************\n\n",{user_id:req.user.typeId})
			models.directory.findAll({
				where: {
					user_id: req.user.typeId
				}
			}).then(function (dirData) {
				res.status(200).json(dirData);
			}).catch(function (error) {
				outputJson = {
					msg: error
				};
				res.status(400).json(outputJson);
			});
		} else {
			res.status(401).json({
				error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
			})
		}
	},

	resetPassword: function (req, res, next) {
		var outputJson = {};
		if (!req.body.email_id) return res.status(400).json({
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		});

		models.users.findOne({
			where: {
				email_id: { ilike: req.body.email_id },
				is_deleted: false
			}
		}).then(function (userObj) {
			if (!userObj) {
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.EMAIL_NOT_EXIST
				}
				res.status(400).json(outputJson);
			} else {
				if (req.body.email_id) {
					var data = {
						user_id: userObj.dataValues.id,
						token: UUID.create().toString(),
						expired_on: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
						status: true
					}
					var link = CONSTANT_OBJ.URLS.BASE_URL + STRING_CONSTANTS.ROUTES_CONSTANTS.RESET_PASSWORD + data.token;
					var html = "Hello, <br/><br/> This email was sent automatically by  " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " in response to your request to recover your password. <br/><br/>To reset your password and access your account, click on the following link :<br/><br/><a href='" + link + "'>" + link + "</a><br/><br/>If you did not forget your password, please ignore this email.<br/><br/>  Thank you,<br/> " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " Team";
					var subject = STRING_CONSTANTS.EMAIL_SUBJECT.FORGOT_PASSWORD;

					mailer.sendMail(req.body.email_id, html, subject, function (error) {
						if (error) {
							outputJson = {
								msg: CONSTANT_OBJ.MESSAGES.EMAIL_SENT_ERR,
								error: error
							}
							res.status(400).json(outputJson);
						} else {
							models.forgot_pswd_token.build(data)
								.save().then(function () {
									outputJson = {
										msg: CONSTANT_OBJ.MESSAGES.LINK_MSG
									};
									res.status(200).json(outputJson);
								}).catch(function (error) {
									outputJson = {
										msg: error
									}
									res.status(400).json(outputJson);
								});
						}
					});

				}

			}

		});
	},
	changePassword: function (req, res, next) {
		console.log('req', req.params)
		var outputJson = {};
		if (!req.params.tokenId) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.MISSING_INFO
			};
			res.status(400).json(outputJson);
		} else {
			models.forgot_pswd_token.findOne({
				where: {
					token: req.params.tokenId,
					status: true

				}
			}).then(function (result) {
				if (!result) {
					outputJson = {
						msg: CONSTANT_OBJ.MESSAGES.TOKEN_INVALID
					};
					res.status(400).json(outputJson);
				} else {
					var expired_on = moment(result.expired_on).format();
					var current_date = moment().format();
					if (expired_on < current_date || result.status == false) {
						outputJson = {
							msg: CONSTANT_OBJ.MESSAGES.TOKEN_EXPIRED
						};
						res.status(400).json(outputJson);
					} else {
						outputJson = {
							msg: CONSTANT_OBJ.MESSAGES.SUCCESS
						};
						res.status(200).json(outputJson);
					}
				}
			}).catch(function (error) {
				outputJson = {
					msg: error
				};
				res.status(400).json(outputJson);
			})
		}
	},

	resetpassword: function (req, res) {
		var outputJson = {};
		if (!req.body.password || !req.body.token || !req.body.confirmpassword) return res.status(400).json({
			msg: CONSTANT_OBJ.MESSAGES.MISSING_DATA_MSG
		});
		models.forgot_pswd_token.findOne({
			where: {
				token: req.body.token,
				status: true

			}
		}).then(function (tokenObj) {
			if (!tokenObj) {
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.TOKEN_INVALID
				}
				res.status(400).json(outputJson);
			} else {
				var expired_on = moment(tokenObj.expired_on).format();
				var current_date = moment().format();
				if (expired_on < current_date) {
					outputJson = {
						msg: CONSTANT_OBJ.MESSAGES.TOKEN_EXPIRED
					}
					return res.status(400).jsonp(outputJson);
				}
				if (tokenObj.status != false) {
					var salt = bcrypt.genSaltSync(tokenObj.dataValues.user_id % 10);
					var hash = bcrypt.hashSync(req.body.password, salt);
					var data = {
						user_id: tokenObj.dataValues.user_id,
						user_password: hash
					}
					var fields = {
						user_password: data.user_password
					};
					models.users_password.update(
						fields, {
							where: {
								user_id: data.user_id,
							}
						}
					).then(function () {
						models.forgot_pswd_token.update({
							status: false
						}, {
								where: {
									token: req.body.token,
									status: true

								}
							}).then(function () {
								outputJson = {
									msg: CONSTANT_OBJ.MESSAGES.PASSWD_CHANGE
								};

								res.status(200).jsonp(outputJson);
							}).catch(function (err) {
								outputJson = {
									msg: CONSTANT_OBJ.MESSAGES.TOKEN_UPDT_ERR
								}
								res.status(400).json(outputJson);
							})

					}).catch(function (error) {
						outputJson = {
							msg: error
						}
						res.status(400).json(outputJson);

					})
				} else {
					outputJson = {
						msg: CONSTANT_OBJ.MESSAGES.TOKEN_EXPIRED
					};
					res.status(400).json(outputJson);
				}
			}
		});
	},


	aideresetpassword: function (req, res) {
		var outputJson = {};
		if (!req.body.password || !req.body.token || !req.body.confirmpassword) return res.status(400).json({
			msg: CONSTANT_OBJ.MESSAGES.MISSING_DATA_MSG
		});
		models.forgot_pswd_token.findOne({
			where: {
				token: req.body.token,
				status: true

			}
		}).then(function (tokenObj) {
			if (!tokenObj) {
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.TOKEN_INVALID
				}
				res.status(400).json(outputJson);
			} else {
				var expired_on = moment(tokenObj.expired_on).format();
				var current_date = moment().format();
				if (expired_on < current_date) {
					outputJson = {
						msg: CONSTANT_OBJ.MESSAGES.TOKEN_EXPIRED
					}
					return res.status(400).jsonp(outputJson);
				}
				if (tokenObj.status != false) {
					var salt = bcrypt.genSaltSync(tokenObj.dataValues.user_id % 10);
					var hash = bcrypt.hashSync(req.body.password, salt);
					var data = {
						user_id: tokenObj.dataValues.user_id,
						user_password: hash
					}
					var fields = {
						user_password: data.user_password
					};
					models.users_password.update(
						fields, {
							where: {
								user_id: data.user_id,
							}
						}
					).then(function () {
						models.forgot_pswd_token.update({
							status: false
						}, {
								where: {
									token: req.body.token,
									status: true

								}
							}).then(function () {
								outputJson = {
									msg: CONSTANT_OBJ.MESSAGES.PASSWD_CHANGE
								};

								res.status(200).jsonp(outputJson);
							}).catch(function (err) {
								outputJson = {
									msg: CONSTANT_OBJ.MESSAGES.TOKEN_UPDT_ERR
								}
								res.status(400).json(outputJson);
							})

					}).catch(function (error) {
						outputJson = {
							msg: error
						}
						res.status(400).json(outputJson);

					})
				} else {
					outputJson = {
						msg: CONSTANT_OBJ.MESSAGES.TOKEN_EXPIRED
					};
					res.status(400).json(outputJson);
				}
			}
		});
	}
}
module.exports = AuthController;
