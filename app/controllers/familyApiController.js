var models = require("../models");
var path = require("path");
var moment = require("moment");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var bcrypt = require('bcryptjs');
var jwt = require('../services/jwt');
var mailer = require('./mailer');
var UUID = require('uuid-js');
var cryptoService = require("../services/crypto");
var Sequelize = require('sequelize');
var arraySort = require('array-sort');
var _ = require('lodash');
var isValidPassword = function (userPassword, password) {
	return bcrypt.compareSync(password, userPassword);
}
var async = require('async');
var DB_CONSTANTS = require("../constants/dbConstants.js");
var commonFunction = require('./commonFunction.js');

var DEEP_LINK_CONSTANT = CONSTANT_OBJ.DEEP_LINK_CONSTANT;
var STRING_CONSTANTS = require("../constants/stringConstants.js");
var login = (req, res) => {
	var outputJson = {};
	//var logData;
	if (!req.body.email) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	if (!req.body.password) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_PASS;
		return res.status(400).json(outputJson);
	}
	console.log('88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888');
	models.emergency_contacts.findOne({
		where: {
			is_active: true,
			email: {
				ilike: req.body.email
			},
			password: {
				ne: null
			}
		}
	}, {
			raw: true
		}).then(function (ec) {
			if (!ec) {
				outputJson.msg = CONSTANT_OBJ.MESSAGES.API_INVALID_CREDENTIALS;
				return res.status(203).json(outputJson);
			}
			if (!isValidPassword(ec.password, req.body.password)) {
				outputJson.msg = CONSTANT_OBJ.MESSAGES.API_INVALID_CREDENTIALS;
				return res.status(203).json(outputJson);
			} else {

				console.log(req.body ,ec.android_min_version,STRING_CONSTANTS.DEVICE_TYPE.ANDROID,req.body.app_version < ec.android_min_version,req.body.app_version < ec['android_min_version'],'ANDDDDDD','$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
				if (req.body.device_type == STRING_CONSTANTS.DEVICE_TYPE.IOS && ec.ios_min_version != '' && req.body.app_version < ec.ios_min_version) {
					outputJson.msg = CONSTANT_OBJ.MESSAGES.IOS_APP_UPDATE_ALERT;
					//logData.log_msg = outputJson.msg;
					//logData.error_code = 333;
					console.log(outputJson,'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII');

					return res.status(333).json(outputJson);
				}
				if (req.body.device_type == STRING_CONSTANTS.DEVICE_TYPE.ANDROID && ec['android_min_version'] != '' && req.body.app_version < ec['android_min_version']) {
				    console.log(outputJson,'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

					outputJson.msg = CONSTANT_OBJ.MESSAGES.ANDROID_APP_UPDATE_ALERT;
					//logData.log_msg = outputJson.msg;
					//logData.error_code = 333;
					console.log(outputJson,'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
					return res.status(333).json(outputJson);
				}
				var uuidToken = UUID.create().toString()
				var token = jwt.createToken(ec.email, uuidToken);
				var data = {};
				data.email = ec.email;
				if (req.headers['access-key'] && req.headers['access-key'] !== '') {
					data.family_key = req.headers['access-key'];
				}
				data.token = uuidToken;
				models.ec_tokens.destroy({
					where: {
						email: ec.email
					}
				})
					.then(function () {
						models.ec_tokens.build(data)
							.save().then(function () {
								var device = {}
								if (!req.body.device_token) {
									outputJson.msg = CONSTANT_OBJ.MESSAGES.DEVICE_TOKEN_NOT_FOUND;
									return res.status(400).json(outputJson);
								}
								if (!req.body.device_type) {
									outputJson.msg = CONSTANT_OBJ.MESSAGES.DEVICE_TYPE_NOT_FOUND;
									return res.status(400).json(outputJson);
								}
								if (!req.body.device_id) {
									outputJson.msg = CONSTANT_OBJ.MESSAGES.DEVICE_ID_NOT_FOUND;
									return res.status(400).json(outputJson);
								}
								device.device_token = req.body.device_token;
								device.device_type = req.body.device_type;
								device.device_id = req.body.device_id;
								device.app_version = req.body.app_version;
								console.log(device,'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy');
								models.emergency_contacts.update({
									device_id: null,
									device_type: null,
									device_token: null
								}, {
										where: {
											device_token: device.device_token
										}
									})
									.then(function () {
										models.emergency_contacts.update(device, {
											where: {
												email: ec.email,
												password: {
													ne: null
												},
												is_verified: true
											}
										}).then(function () {
											outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/' + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
											outputJson.msg = CONSTANT_OBJ.MESSAGES.API_LOGIN_SUCCESS;
											outputJson.data = {};
											outputJson.data.token = token;
											outputJson.data.ecDetails = ec;
											console.log(outputJson.data,'$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
											outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson.data));
											res.status(200).jsonp(outputJson)
										}).catch(function (error) {
											outputJson = {
												msg: error
											}
											console.log(error,'&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
											res.status(400).json(outputJson);
										});

									}).catch(function (error) {
										outputJson = {
											msg: error
										}
										console.log('}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}');
										res.status(400).json(outputJson);
									});
							}).catch(function (error) {
								outputJson = {
									msg: error
								}
								console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
								res.status(400).json(outputJson);
							});
					}).catch(function (error) {
						outputJson = {
							msg: error
						}
						console.log('____________________________________----------------------------------------------------------------------------------------------------');
						res.status(400).json(outputJson);
					});
			}
		}).catch(function (error) {
			outputJson = {
				msg: error
			}
			console.log('((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((');
			res.status(400).json(outputJson);
		});
}
exports.login = login;

/*________________________________________________________________________
 * @Date:      		6 June 2017
 * @Method :   		getFamilySchedule
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		get the schedule of aide for a day for family member.
 _________________________________________________________________________
 */
var getFamilySchedule = (req, res) => {
	var outputJson = {};
	var patient_array = [];
	var ec_array = [];
	if (!req.headers.ec_email || !req.body.date) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	var endDate = moment(req.body.date).add(1, 'days');
	var startDate = moment(req.body.date).subtract(1, 'days');
	startDate.set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	});
	endDate.set({
		hour: 23,
		minute: 59,
		second: 59,
		millisecond: 999
	});
	models.emergency_contacts.findAll({
		where: {
			email: req.headers.ec_email,
			is_active: true,
		}
	})
		.then(function (data) {
			data.forEach(function (value) {
				patient_array.push(value.patient_id);
				ec_array.push({
					patient_id: value.patient_id,
					photo_access: value.photo_access
				})

			});
			if (patient_array.length >= 0) {
				var queryArr = [];
				if (req.body.patient_id >= 0 && req.body.patient_id) {
					queryArr.push(parseInt(req.body.patient_id))
				} else {
					queryArr = patient_array;
				}
				models.schedule.findAll({
					where: {
						datetime_clock_in: {
							gte: startDate.toDate(),
							lte: endDate.toDate()
						},
						patient_id: {
							in: queryArr
						},
						is_active: true
					},
					include: [{
						model: models.aide_activities,
						where: {
							is_active: true
						},
						include: [{
							model: models.schedule_activities,
							where: {
								is_active: true
							},
							required: true,
							include: [{
								model: models.admin_activities,
								required: false
							}]
						},
						{
							model: models.verification_requests,

						}],
						required: false
					}, {
						model: models.patients,
						where: {
							is_active: true
						},
						include: [{
							model: models.patient_details
						}]
					}, {
						model: models.aide,
						where: {
							is_active: true
						},
						include: [{
							model: models.aide_details
						}]
					}, {
						model: models.main_schedule,
						where: {
							is_active: true
						}
					}],
					order: [
						[DB_CONSTANTS.SCHEDULES.DATETIME_CLOCK_IN, STRING_CONSTANTS.SORT_ORDER.ASC]
					]
				})
					.then(function (data) {
						outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
						if (!data.length) {
							outputJson.msg = CONSTANT_OBJ.MESSAGES.SCHEDULE_NOT_FOUND;
						}
						data = _.clone(data);
						data = _.orderBy(data, [DB_CONSTANTS.SCHEDULES.SCHEDULED_CLOCK_IN_HOUR, DB_CONSTANTS.SCHEDULES.SCHEDULED_CLOCK_IN_MIN], STRING_CONSTANTS.SORT_ORDER.ASC)
						outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/' + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
						try {
							data = data.map(function (obj) {
								obj = JSON.parse(JSON.stringify(obj))
								obj.aide_activities = arraySort(obj.aide_activities, ['schedule_activity.time_start_hour', 'schedule_activity.time_start_min']);
								return obj;
							})
						} catch (e) {
						}

						var list = data;
						for (var i = 0; i <= list.length; i++) {
							if (list[i]) {
								list[i].patient.first_name = cryptoService.decryptString(list[i].patient.first_name);
								list[i].patient.last_name = cryptoService.decryptString(list[i].patient.last_name);
								list[i].patient.patient_detail.address = cryptoService.decryptString(list[i].patient.patient_detail.address);


								list[i].patient.patient_detail.dob = new Date(cryptoService.decryptString(list[i].patient.patient_detail.dob));

								if (list[i].patient.patient_detail.phone == null) {
									list[i].patient.patient_detail.phone = [];
								} else {
									let phoneDecrypt = cryptoService.decryptString(list[i].patient.patient_detail.phone);
									list[i].patient.patient_detail.phone = JSON.parse(phoneDecrypt);
								}
								if (list[i].patient.patient_detail.ssn != null) {
									list[i].patient.patient_detail.ssn = cryptoService.decryptString(list[i].patient.patient_detail.ssn);
								}
								if (list[i].patient.patient_detail.email != null) {
									list[i].patient.patient_detail.email = cryptoService.decryptString(list[i].patient.patient_detail.email);
								}
								var aideAct = list[i].aide_activities;
								for (var j = 0; j < aideAct.length; j++) {
									for (var p = 0; p < ec_array.length; p++) {
										if (typeof (list[i].aide_activities[j]) != undefined && ec_array[p].patient_id == list[i].aide_activities[j].patient_id){
										list[i].aide_activities[j].photo_access = ec_array[p].photo_access;
									}
										if (typeof (list[i].aide_activities[j]) != undefined && ec_array[p].patient_id == list[i].aide_activities[j].patient_id && ec_array[p].photo_access == false) {
											list[i].aide_activities[j].verification = null;
										}
									}
								}
								var new_phone = JSON.parse(list[i].aide.aide_detail.phNo);
								var aide_phone = [];
								var aide_info = {}
								new_phone.forEach(function (value) {
									aide_info.phoneType = value.name ? value.name : value.type;
								    aide_info.phNo = value.no ? value.no : value.number;
									aide_phone.push(aide_info);
								})
								var new_var = JSON.parse(JSON.stringify(list[i]));
								new_var.aide.aide_detail.new_phno = aide_phone;
								list[i] = new_var;

								for (var j = 0; j <= list[i].aide_activities.length; j++) {
									if (list[i].aide_activities[j] && list[i].aide_activities[j].date) {
										list[i].aide_activities[j].schedule_activity.scheduled_time_start_date = moment(list[i].aide_activities[j].datetime_start).isValid() ? moment(list[i].aide_activities[j].datetime_start).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT) : null
										list[i].aide_activities[j].schedule_activity.scheduled_time_end_date = moment(list[i].aide_activities[j].datetime_end).isValid() ? moment(list[i].aide_activities[j].datetime_end).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT) : null
									}
									if (list[i].aide_activities[j] && list[i].aide_activities[j].verification && list[i].aide_activities[j].verification == 'no_media.png') {
										list[i].aide_activities[j].verification = null;
									}
								}
							}
						}
						models.admin_activities.findAll({
							where: {
								root_node: false
							}
						})
							.then(function (activities) {
								outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
								outputJson.activities = activities;
								outputJson.data = list;
								outputJson.activities = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson.activities));
								outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson.data));
								return res.status(200).jsonp(outputJson)
							})
							.catch(function (error) {
								return res.status(400).json({
									msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
									err: error
								});
							})

					}).catch(function (error) {
						return res.status(400).json({
							msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
							err: error
						});
					})

			} else {
				return res.status(400).json({
					msg: CONSTANT_OBJ.MESSAGES.INVALID_TOKEN
				});
			}
		})
		.catch(function (error) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR,
				err: error
			}
			output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});
}
exports.getFamilySchedule = getFamilySchedule;

/*________________________________________________________________________
 * @Date:      		9 June 2017
 * @Method :   		getAllactivitiesSchedule
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		get the schedule of aide for a day in case of family app.
 _________________________________________________________________________
 */
var getLastSchedule = (req, res) => {
	var outputJson = {};
	var patient_array = [];
	var ec_array = [];

	if (!req.headers.ec_email) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	var endDate = moment(req.body.end_date).add(1, 'days');
	var startDate = moment(req.body.start_date).subtract(1, 'days');
	startDate.set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	});
	endDate.set({
		hour: 23,
		minute: 59,
		second: 59,
		millisecond: 999
	});
	models.emergency_contacts.findAll({
		where: {
			email: req.headers.ec_email,
			is_active: true,
		}
	})
		.then(function (data) {
			data.forEach(function (value) {
				patient_array.push(value.patient_id);
				console.log(value,'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
				ec_array.push({
					patient_id: value.patient_id,
					photo_access: value.photo_access
				});
			});
			models.schedule.findAll({
				where: {
					datetime_clock_in: {
						gte: startDate.toDate(),
						lte: endDate.toDate()
					},
					patient_id: {
						in: patient_array
					},
					is_active: true
				},
				include: [{
					model: models.aide_activities,
					where: {
						is_active: true
					},
					include: [{
						model: models.schedule_activities,
						required: false,
						where: {
							is_active: true
						},
						include: [{
							model: models.admin_activities,
							required: false
						}]
					}, {
						model: models.verification_requests,
					}
					],
					required: false
				}, {
					model: models.patients,
					where: {
						is_active: true
					},
					include: [{
						model: models.patient_details
					}]
				}, {
					model: models.aide,
					where: {
						is_active: true
					},
					include: [{
						model: models.aide_details
					}]
				}, {
					model: models.main_schedule,
					where: {
						is_active: true
					}
				}],
				order: [
					[DB_CONSTANTS.SCHEDULES.SCHEDULED_CLOCK_IN_HOUR, STRING_CONSTANTS.SORT_ORDER.ASC]
				]
			})
				.then(function (data) {
					outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
					if (!data.length) {
						outputJson.msg = CONSTANT_OBJ.MESSAGES.SCHEDULE_NOT_FOUND;
					}
					data = _.clone(data);
					data = _.orderBy(data, [DB_CONSTANTS.SCHEDULES.SCHEDULED_CLOCK_IN_HOUR, DB_CONSTANTS.SCHEDULES.SCHEDULED_CLOCK_IN_MIN], STRING_CONSTANTS.SORT_ORDER.ASC)
					outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/'  + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
					try {
						data = data.map(function (obj) {
							obj = JSON.parse(JSON.stringify(obj))
							obj.aide_activities = arraySort(obj.aide_activities, ['schedule_activity.time_start_hour', 'schedule_activity.time_start_min']);
							return obj;
						})
					} catch (e) {
						//console.log(e)
					}
					var list = data;
					for (var i = 0; i <= list.length; i++) {
						if (list[i]) {
							list[i].patient.first_name = cryptoService.decryptString(list[i].patient.first_name);
							list[i].patient.last_name = cryptoService.decryptString(list[i].patient.last_name);
							list[i].patient.patient_detail.address = cryptoService.decryptString(list[i].patient.patient_detail.address);
							list[i].patient.patient_detail.dob = new Date(cryptoService.decryptString(list[i].patient.patient_detail.dob));

							if (list[i].patient.patient_detail.phone == null) {
								list[i].patient.patient_detail.phone = [];
							} else {
								let phoneDecrypt = cryptoService.decryptString(list[i].patient.patient_detail.phone);
								list[i].patient.patient_detail.phone = JSON.parse(phoneDecrypt);
							}
							if (list[i].patient.patient_detail.ssn != null) {
								list[i].patient.patient_detail.ssn = cryptoService.decryptString(list[i].patient.patient_detail.ssn);
							}
							if (list[i].patient.patient_detail.email != null) {
								list[i].patient.patient_detail.email = cryptoService.decryptString(list[i].patient.patient_detail.email);
							}

                            var aideAct = list[i].aide_activities;
								for (var j = 0; j < aideAct.length; j++) {
									for (var p = 0; p < ec_array.length; p++) {
										if (typeof (list[i].aide_activities[j]) != undefined && ec_array[p].patient_id == list[i].aide_activities[j].patient_id){
										list[i].aide_activities[j].photo_access = ec_array[p].photo_access;
									}
										if (typeof (list[i].aide_activities[j]) != undefined && ec_array[p].patient_id == list[i].aide_activities[j].patient_id && ec_array[p].photo_access == false) {
											list[i].aide_activities[j].verification = null;
										}
									}
								}

							var new_phone = JSON.parse(list[i].aide.aide_detail.phNo);
							var aide_phone = [];
							var aide_info = {}
							new_phone.forEach(function (value) {
								aide_info.phoneType = value.name ? value.name : value.type;
								aide_info.phNo = value.no ? value.no : value.number;
								aide_phone.push(aide_info);
							})
							var new_var = JSON.parse(JSON.stringify(list[i]));
							new_var.aide.aide_detail.new_phno = aide_phone;
							
							list[i] = new_var;
							for (var j = 0; j <= list[i].aide_activities.length; j++) {
								
								if (list[i].aide_activities[j] && list[i].aide_activities[j].date) {
									if (list[i].aide_activities[j] && list[i].aide_activities[j].schedule_activity) {
										list[i].aide_activities[j].schedule_activity.scheduled_time_start_date = moment(list[i].aide_activities[j].datetime_start).isValid() ? moment(list[i].aide_activities[j].datetime_start).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT) : null
										list[i].aide_activities[j].schedule_activity.scheduled_time_end_date = moment(list[i].aide_activities[j].datetime_end).isValid() ? moment(list[i].aide_activities[j].datetime_end).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT) : null
									}
								}
							}

						}
					}
					var lastData = {};
					console.log(list,'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy');
					var i = 0;
					for (i = 0; i < list.length; i++) {
						var date = list[i].date.split('T')[0];
						lastData[date] = lastData[date] ? lastData[date] : [];
						lastData[date].push(list[i]);
					}
					outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(lastData));
					return res.status(200).jsonp(outputJson)
				})
				.catch(function (error) {
					//console.log(error)
					return res.status(400).json({
						msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
						err: error
					});
				})
		})
		.catch(function (error) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR,
				err: error
			}
			output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});
}
exports.getLastSchedule = getLastSchedule;

/*________________________________________________________________________
 * @Date:      		12 June 2017
 * @Method :   		getAide
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		give details of the Aide's associated with agency.
 _________________________________________________________________________
 */
var getAide = (req, res) => {
	var outputJson = {};
	var patient_array = [];
	if (!req.headers.ec_email) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	models.emergency_contacts.findAll({
		where: {
			email: req.headers.ec_email,
			is_active: true,
		}
	})
		.then(function (data) {
			data.forEach(function (value) {
				patient_array.push(value.patient_id);
			});
			if (patient_array.length >= 0) {
				async.waterfall([
					function (callback) {
						models.main_schedule.findAll({
							where: {
								patient_id: {
									in: patient_array
								},
								is_active: true
							},
							attributes: ["aide_id"]
						}, {
								raw: true
							})
							.then(function (data) {
								data = data.map(function (obj) {
									return obj.aide_id;
								})

								data = _.uniq(data);
								models.aide.findAll({
									where: {
										id: {
											in: data
										},
										is_active: true
									},
									include: [{
										model: models.aide_details,
										required: false
									}]
								})
									.then(function (aides) {
										var result = {
											aides: JSON.parse(JSON.stringify(aides))
										}
										var aideIDs = [];
										aides.map(function (obj) {
											aideIDs.push(obj.id);
										})
										result.aideIds = aideIDs;
										callback(null, result);
									}).catch(function (err) {
										return res.status(400).json({
											msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
											err: err
										});
									})
							})
							.catch(function (err) {
								return res.status(400).json({
									msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
									err: err
								});
							})
					},
					function (result, callback) {
						var endDate = moment().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT);
						models.aide_activities.findAll({
							attributes: [
								[Sequelize.fn('COUNT', Sequelize.col(DB_CONSTANTS.AIDE_ACTIVITIES.ID)), 'count'],
								DB_CONSTANTS.AIDE_ACTIVITIES.STATUS, DB_CONSTANTS.AIDE_ACTIVITIES.AIDE_ID
							],
							where: {
								date: {
									lt: endDate + " 23:59:59"
								},
								task_performed: true,
								aide_id: {
									in: result.aideIds
								}
							},
							group: [DB_CONSTANTS.AIDE_ACTIVITIES.STATUS, DB_CONSTANTS.AIDE_ACTIVITIES.AIDE_ID],
						})
							.then(function (resultPC) {
								var i = 0;
								var j = 0;
								resultPC = JSON.parse(JSON.stringify(resultPC));
								result = JSON.parse(JSON.stringify(result));
								for (i = 0; i < result.aides.length; i++) {
									result.aides[i].peformance = [];
									for (j = 0; j < resultPC.length; j++) {
										if (resultPC[j].aide_id == result.aides[i].id) {
											result.aides[i].peformance.push(resultPC[j]);
										}
									}
								}
								callback(null, result.aides);
							})
							.catch(function (err) {
								return res.status(400).json({
									msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
									err: err
								});
							})
					}
				],
					function (err, result) {
						var outputJson = {};
						outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
						outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/'  + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
						outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(result));
						res.status(200).jsonp(outputJson)
					}
				)
			} else {
				return res.status(400).json({
					msg: CONSTANT_OBJ.MESSAGES.INVALID_TOKEN
				});
			}
		})
		.catch(function (error) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR,
				err: error
			}
			output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});
}
exports.getAide = getAide;
/*________________________________________________________________________
 * @Date:      		12 June 2017
 * @Method :   		getActivityHistory
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		provide history of the activity of a schedule.
 _________________________________________________________________________
 */
var getActivityHistory = (req, res) => {
	var outputJson = {};
	if (!req.headers.ec_email || !req.body.date) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	//var startDate = moment(req.body.date).subtract(1, 'days');
	var startDate = moment(req.body.date);
	//date filter with date range

	var endDate = req.body.end_date ? moment(req.body.end_date) : moment();
	// Album function in family app is supposed to show all photos STARTING from the date you select
	//var endDate = moment();
	startDate.set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	});
	endDate.set({
		hour: 23,
		minute: 59,
		second: 59,
		millisecond: 999
	});
	models.aide_activities.findAll({
		where: {
			datetime_start: {
				gte: startDate.toDate(),
				lte: endDate.toDate()
			},
			is_active: true,
			patient_id: req.body.patient_id
		},
		include: [{
			model: models.schedule_activities,
			required: true,
			include: [{
				model: models.admin_activities,
				required: true,
				where: {
					id: req.body.activity_id
				}
			}]
		},
                    {
						model: models.verification_requests,
					},
		 {
			model: models.aide,
			required: true
		}, {
			model: models.patients,
			required: false,
			include: [{
				model: models.patient_details,
				required: false
			}]
		}],
		order: [
						[DB_CONSTANTS.AIDE_ACTIVITIES.DATETIME_START, STRING_CONSTANTS.SORT_ORDER.DESC]
					]

	})
		.then(function (data) {
			var list = data;
			console.log(data,'///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////');
			for (var i = 0; i <= list.length; i++) {
				if (list[i]) {
					list[i].patient.first_name = cryptoService.decryptString(list[i].patient.first_name);
					list[i].patient.last_name = cryptoService.decryptString(list[i].patient.last_name);
					list[i].patient.patient_detail.address = cryptoService.decryptString(list[i].patient.patient_detail.address);
					list[i].patient.patient_detail.dob = new Date(cryptoService.decryptString(list[i].patient.patient_detail.dob));

					if (list[i].patient.patient_detail.phone != null) {
						list[i].patient.patient_detail.phone = cryptoService.decryptString(list[i].patient.patient_detail.phone);
					} 
					if (list[i].patient.patient_detail.ssn != null) {
						list[i].patient.patient_detail.ssn = cryptoService.decryptString(list[i].patient.patient_detail.ssn);
					}
					if (list[i].patient.patient_detail.email != null) {
						list[i].patient.patient_detail.email = cryptoService.decryptString(list[i].patient.patient_detail.email);
					}

					if (list[i].date) {
						list[i].schedule_activity.scheduled_time_start_date = moment(list[i].datetime_start).isValid() ? moment(list[i].datetime_start).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT) : null
						list[i].schedule_activity.scheduled_time_end_date = moment(list[i].datetime_end).isValid() ? moment(list[i].datetime_end).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT) : null
					}
				}
			}
			var output = cryptoService.encryptMobileData(req.headers, JSON.stringify(list));
			return res.status(200).json({
				data: output
			});
		}).catch(function (err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.ACTVTY_ERR,
				err: err
			};
			output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.getActivityHistory = getActivityHistory;

/*________________________________________________________________________
 * @Date:      		12 June 2017
 * @Method :   		getActivityHistory
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		get overall performance for patient associated with family app.
 _________________________________________________________________________
 */
var getOverAllPerformance = (req, res) => {
	var patient_array = [];
	var query1 = {}
	if (req.body.patient_id >= 0 && req.body.patient_id) {
		query1.patient_id = req.body.patient_id;
		finalOverAllPerformance(req, query1, function (err, success) {
			if (err) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR
				}
				output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			} else {
				var outputJson = {};
				outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
				outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/'  + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
				outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(success));
				res.status(200).jsonp(outputJson)
			}
		});

	} else if (req.body.aide_id >= 0 && req.body.aide_id) {
		query1.aide_id = req.body.aide_id;
		finalOverAllPerformance(req, query1, function (err, success) {
			if (err) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR
				}
				output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			} else {
				var outputJson = {};
				outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
				outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/'  + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
				outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(success));
				res.status(200).jsonp(outputJson)
			}
		});

	} else {
		models.emergency_contacts.findAll({
			where: {
				email: req.headers.ec_email,
				is_active: true,
			}
		})
			.then(function (data) {
				data.forEach(function (value) {
					patient_array.push(value.patient_id);
				});
				if (patient_array.length >= 0) {
					query1 = {
						patient_id: {
							in: patient_array
						}
					}
					finalOverAllPerformance(req, query1, function (err, success) {
						if (err) {
							var output = {
								msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR
							}
							output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
							return res.status(400).json({
								data: output
							});
						} else {
							var outputJson = {};
							outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
							outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/'  + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
							outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(success));
							res.status(200).jsonp(outputJson)
						}
					});

				}
			})
			.catch(function (error) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR,
					err: error
				}
				output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			});
	}
}
exports.getOverAllPerformance = getOverAllPerformance;

var finalOverAllPerformance = function (req, query, cb) {
	var outputJson;
	var res;
	try {
		var query2 = {}
		if (!req.headers.ec_email) {
			outputJson.msg = CONSTANT_OBJ.MESSAGES.LOGIN_TOKEN_EXPIRED;
			return res.status(400).json(outputJson);
		}
		if (['week', 'month', '4month'].indexOf(req.body.for) == -1) {
			outputJson.msg = CONSTANT_OBJ.MESSAGES.INVALID_DURATION;
			return res.status(401).json(outputJson);
		}
		var days = 0;
		var datefor = 'week';
		switch (req.body.for) {
			case "week":
				days = 7;
				break;
			case "month":
				datefor = 'week';
				days = 31;
				break;
			case "4month":
				days = 120;
				break;
		}
		var endDate = moment(req.body.todaydate, STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT).format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT);
		var startDate = moment().subtract(days, "days").format(
			STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT);
		endDate = moment(endDate + " 23:59:59", STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT).format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		startDate = moment(startDate + " 00:00:00", STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT).format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		async.waterfall([
			//For personal care
			function (callback) {
				var result = {};
				models.schedule_activities.findAll({
					include: [{
						model: models.admin_activities, //parent_node_id
						required: true,
						where: {
							parent_node_id: 2
						}
					}],
					where: query
				}).then(function (pcIds) {
					pcIds = pcIds.map(function (obj) {
						return obj.id;
					})
					query2.datetime_start = {
						lte: endDate,
						gte: startDate,

					};
					query2.task_performed = true;
					query2.scheduled_activity_id = {
						in: pcIds
					};
					models.aide_activities.findAll({
						attributes: [
							[Sequelize.fn('COUNT', Sequelize.col(DB_CONSTANTS.AIDE_ACTIVITIES.ID)), 'count'],
							[DB_CONSTANTS.AIDE_ACTIVITIES.DATE, 'datefor'],
							DB_CONSTANTS.AIDE_ACTIVITIES.STATUS
						],
						where: query2,
						group: [DB_CONSTANTS.AIDE_ACTIVITIES.DATE, DB_CONSTANTS.AIDE_ACTIVITIES.STATUS],
					})
						.then(function (resultPC) {
							result.pc = resultPC;
							callback(null, result);
						}).catch(function (err) {
							return res.status(400).json({
								msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
								err: err
							});
						})
				}).catch(function (err) {
					return res.status(400).json({
						msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
						err: err
					});
				})
			},
			//For client Activity
			function (result, callback) {
				models.schedule_activities.findAll({
					include: [{
						model: models.admin_activities, //parent_node_id
						required: true,
						where: {
							parent_node_id: 3
						}
					}],
					where: query
				}).then(function (pcIds) {
					pcIds = pcIds.map(function (obj) {
						return obj.id;
					})
					query2.datetime_start = {
						lte: endDate,
						gte: startDate
					};
					query2.task_performed = true;
					query2.scheduled_activity_id = { in: pcIds };
					models.aide_activities.findAll({
						attributes: [
							[Sequelize.fn('COUNT', Sequelize.col(DB_CONSTANTS.AIDE_ACTIVITIES.ID)), 'count'],
							[DB_CONSTANTS.AIDE_ACTIVITIES.DATE, 'datefor'],
							DB_CONSTANTS.AIDE_ACTIVITIES.STATUS
						],
						where: query2,
						group: [DB_CONSTANTS.AIDE_ACTIVITIES.DATE, DB_CONSTANTS.AIDE_ACTIVITIES.STATUS],
					})
						.then(function (resultCa) {
							result.ca = resultCa;
							callback(null, result);
						})
				})
			},
			//For nutrition
			function (result, callback) {
				models.schedule_activities.findAll({
					include: [{
						model: models.admin_activities, //parent_node_id
						required: true,
						where: {
							parent_node_id: 1
						}
					}],
					where: query
				}).then(function (pcIds) {
					pcIds = pcIds.map(function (obj) {
						return obj.id;
					})
					query2.datetime_start = {
						lte: endDate,
						gte: startDate

					};
					query2.task_performed = true;
					query2.scheduled_activity_id = {
						in: pcIds
					};
					models.aide_activities.findAll({
						attributes: [
							[Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
							[DB_CONSTANTS.AIDE_ACTIVITIES.DATE, 'datefor'],
							DB_CONSTANTS.AIDE_ACTIVITIES.STATUS
						],
						where: query2,
						group: [DB_CONSTANTS.AIDE_ACTIVITIES.DATE, DB_CONSTANTS.AIDE_ACTIVITIES.STATUS],
					})
						.then(function (resultMed) {
							result.med = resultMed;
							callback(null, result);
						}).catch(function (err) {
							return res.status(400).json({
								msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
								err: err
							});
						})
				}).catch(function (err) {
					return res.status(400).json({
						msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
						err: err
					});
				})
			},
			//For medical
			function (result, callback) {
				models.schedule_activities.findAll({
					include: [{
						model: models.admin_activities, //parent_node_id
						required: true,
						where: {
							parent_node_id: 4
						}
					}],
					where: query
				}).then(function (pcIds) {
					pcIds = pcIds.map(function (obj) {
						return obj.id;
					})
					query2.datetime_start = {
						lte: endDate,
						gte: startDate
					};
					query2.task_performed = true;
					query2.scheduled_activity_id = {
						in: pcIds
					};
					models.aide_activities.findAll({
						attributes: [
							[Sequelize.fn('COUNT', Sequelize.col(DB_CONSTANTS.AIDE_ACTIVITIES.ID)), 'count'],
							[DB_CONSTANTS.AIDE_ACTIVITIES.DATE, 'datefor'],
							DB_CONSTANTS.AIDE_ACTIVITIES.STATUS
						],
						where: query2,
						group: [DB_CONSTANTS.AIDE_ACTIVITIES.DATE, DB_CONSTANTS.AIDE_ACTIVITIES.STATUS],
					})
						.then(function (resultNut) {
							result.nut = resultNut;
							callback(null, result);
						}).catch(function (err) {
							return res.status(400).json({
								msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
								err: err
							});
						})
				}).catch(function (err) {
					return res.status(400).json({
						msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
						err: err
					});
				})

			},
			function (result, callback) {
				query.datetime_start = {
					lte: endDate,
					gte: startDate
				};
				query.task_performed = true;
				models.aide_activities.findAll({
					attributes: [
						[Sequelize.fn('COUNT', Sequelize.col(DB_CONSTANTS.AIDE_ACTIVITIES.ID)), 'count'],
						[DB_CONSTANTS.AIDE_ACTIVITIES.DATE, 'datefor'],
						DB_CONSTANTS.AIDE_ACTIVITIES.STATUS
					],
					where: query,
					group: [DB_CONSTANTS.AIDE_ACTIVITIES.DATE, DB_CONSTANTS.AIDE_ACTIVITIES.STATUS],
				})
					.then(function (averageData) {
						result.average = averageData;
						callback(null, result);
					}).catch(function (err) {
						return res.status(400).json({
							msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
							err: err
						});
					})
			}
		],
			function (err, result) {
				if (err) {
					return cb(err)
				} else {
					return cb(null, result);
				}
			})
	} catch (err) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.CLOCK_IN_WEEK_ERROR,
			err: err
		}
		output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
		return res.status(400).json({
			data: output
		});

	}

}
exports.finalOverAllPerformance = finalOverAllPerformance;

/*________________________________________________________________________
 * @Date:      		12 June 2017
 * @Method :   		getPatient
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		give details of the patinets associated with that Emergency Contact.
 _________________________________________________________________________
 */

var getPatient = (req, res) => {
	var outputJson = {};
	var patient_array = [];
	if (!req.headers.ec_email) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}

	models.emergency_contacts.findAll({
		where: {
			email: req.headers.ec_email,
			is_active: true,
		}
	})
		.then(function (data) {
			data.forEach(function (value) {
				patient_array.push(value.patient_id);
			});
			if (patient_array.length >= 0) {
				async.waterfall([
					function (callback) {
						models.main_schedule.findAll({
							where: {
								patient_id: { in: patient_array },
								is_active: true
							},
							attributes: [DB_CONSTANTS.MAIN_SCHEDULES.PATIENT_ID]
						}, {
								raw: true
							})
							.then(function (data) {
								data = data.map(function (obj) {
									return obj.patient_id;
								})
								//data = _.uniq(data);
								data = _.uniq(patient_array);
								if (data) {
									commonFunction.patientDetails(req, res, data, function (successData) {
										var result = {};
										result = successData;
										if (result) {
											var endDate = moment().format(
												STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT);
											models.aide_activities.findAll({
												attributes: [
													[Sequelize.fn('COUNT', Sequelize.col(DB_CONSTANTS.AIDE_ACTIVITIES.ID)), 'count'],
													DB_CONSTANTS.AIDE_ACTIVITIES.STATUS, DB_CONSTANTS.AIDE_ACTIVITIES.PATIENT_ID
												],
												where: {
													date: {
														lt: endDate + " 23:59:59"
													},
													task_performed: true,
													patient_id: {
														in: patient_array
													},

												},
												group: [DB_CONSTANTS.AIDE_ACTIVITIES.STATUS, DB_CONSTANTS.AIDE_ACTIVITIES.PATIENT_ID],
											})
												.then(function (resultPC) {
													var i = 0;
													var j = 0;
													resultPC = JSON.parse(JSON.stringify(resultPC));
													result = JSON.parse(JSON.stringify(result));
													for (i = 0; i < result.patients.length; i++) {
														result.patients[i].peformance = [];
														for (j = 0; j < resultPC.length; j++) {
															if (resultPC[j].patient_id == result.patients[i].id) {
																result.patients[i].peformance.push(resultPC[j]);
															}
														}
													}
													delete result.patientIds;
													var outputResult = [];
													outputResult = result.patients;
													var outputJson = {};
													outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
													outputJson.baseImgURL = CONSTANT_OBJ.URLS.BASE_URL + 'webservice/'  + STRING_CONSTANTS.MEDIA_URL.CROPPED_IMAGE;
													outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputResult));
													callback(null, outputJson)
												})
												.catch(function (err) {
													return res.status(400).json({
														msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
														err: err
													});
												})
										}
									})
								}
							})
							.catch(function (err) {
								return res.status(400).json({
									msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
									err: err
								});
							})
					},
				],
					function (err, result) {
						res.status(200).send(result);
					}
				)
			}
		})
		.catch(function (err) {
			return res.status(400).json({
				msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
				err: err
			});
		})
}
exports.getPatient = getPatient;




/*________________________________________________________________________
 * @Date:      		12 June 2017
 * @Method :   		getEcDetails
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		get detail of patient and emergency contact on basis of token.
 _________________________________________________________________________
 */
var getEcDetails = (req, res) => {
	var outputJson = {};
	var output;
	var contactObject;
	if (!req.body.data) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	models.emergency_contacts.findAll({
		where: {
			token: req.body.data
		}
	})
		.then(function (data) {
			models.patients.findOne({
				where: {
					id: data[0].patient_id,
					is_active: true
				}
			})
				.then(function (pdata) {
					// code to handle link expiration and user registered status
					if (data[0].dataValues.password) {
						contactObject = { 'email': data[0].dataValues.email, 'alertStatus': "1" }
						output = cryptoService.encryptMobileData(req.headers, JSON.stringify(contactObject));
						return res.status(200).jsonp({
							data: output
						});
					}
					var now = moment();
					var expiredDate = moment(data[0].dataValues.expired_on);
					if (expiredDate.diff(now, 'days') < 0) {
						contactObject = { 'email': data[0].dataValues.email, 'alertStatus': "2" }
						output = cryptoService.encryptMobileData(req.headers, JSON.stringify(contactObject));
						return res.status(200).json({
							data: output
						});
					}
					pdata.first_name = cryptoService.decryptString(pdata.first_name);
					pdata.last_name = cryptoService.decryptString(pdata.last_name);
					outputJson.pdata = pdata;
					outputJson.data = data[0];
					output = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson));
					return res.status(200).json({
						data: output
					});
				})
				.catch(function (error) {
					var output = {
						msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR,
						err: error
					}
					output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});

		})
		.catch(function (error) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR,
				err: error
			}
			output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});


}
exports.getEcDetails = getEcDetails;

/*________________________________________________________________________
 * @Date:      		12 July 2017
 * @Method :   		getAllactivities
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		get list of all admin activities
 _________________________________________________________________________
 */
var getAllactivities = (req, res) => {
	var outputJson = {};
	models.admin_activities.findAll({
		where: {
			root_node: false
		}
	})
		.then(function (data) {
			outputJson.msg = STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS;
			outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(data));
			return res.status(200).jsonp(outputJson)
		})
		.catch(function (error) {
			return res.status(400).json({
				msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
				err: error
			});
		})
}
exports.getAllactivities = getAllactivities;

/*________________________________________________________________________
 * @Date:      		12 July 2017
 * @Method :   		resetEcPassword
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		reset password for family app.
 _________________________________________________________________________
 */
var resetEcPassword = (req, res, next) => {
	var outputJson = {};
	if (!req.body.email) return res.status(400).json({
		msg: CONSTANT_OBJ.MESSAGES.ENTER_VALID_EMAIL
	});
	models.emergency_contacts.findOne({
		where: {
			email: {
				ilike: req.body.email
			},
			is_active: true,
			is_verified: true
		}
	}).then(function (userObj) {
		if (!userObj) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.EMAIL_NOT_EXIST
			}
			res.status(400).json(outputJson);
		} else {
			var data = {
				email: userObj.dataValues.email.toLowerCase(),
				token: UUID.create().toString(),
				expired_on: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
				status: true
			}
			var link = CONSTANT_OBJ.URLS.BASE_URL + 'familyResetPassword/' + data.token;
			var html = "Hello, <br/><br/> This email was sent automatically by " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " in response to your request to recover your password. <br/><br/>To reset your password and access your account, click on the following link :<br/><br/><a href='" + link + "'>" + link + "</a><br/><br/>If you did not forget your password, please ignore this email.<br/><br/>  Thank you,<br/>  " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " Team";
			var subject = "Forgot Password";
			mailer.sendMail(req.body.email, html, subject, function (error) {
				if (error) {
					outputJson = {
						msg: CONSTANT_OBJ.MESSAGES.EMAIL_SENT_ERR,
						error: error
					}
					res.status(400).json(outputJson);
				} else {
					models.ec_tokens.update({
						status: false
					}, {
							where: {
								email: userObj.dataValues.email
							}
						})
						.then(function () {
							models.ec_tokens.build(data)
								.save().then(function () {
									outputJson = {
										msg: CONSTANT_OBJ.MESSAGES.LINK_MSG
									};
									res.status(200).json(outputJson);
								}).catch(function (error) {
									return res.status(400).json({
										msg: CONSTANT_OBJ.MESSAGES.VERIFY_DETAILS,
										err: error
									});
								})
						}).catch(function (error) {
							outputJson = {
								msg: error
							}
							res.status(400).json(outputJson);
						});
				}
			});
		}

	})
		.catch(function (error) {
			return res.status(400).json({
				msg: CONSTANT_OBJ.MESSAGES.VERIFY_DETAILS,
				err: error
			});
		})
}


exports.resetEcPassword = resetEcPassword;

/*________________________________________________________________________
 * @Date:      		15 February 2017
 * @Method :   		resetEcPasswordPage
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		Reset password for family app.
 _________________________________________________________________________
 */
var resetEcPasswordPage = (req, res) => {
	if (!req.params.tokenId) {
		req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.TOKEN_INVALID)
		res.render('agencyIndex.ejs');
	} else {
		models.ec_tokens.findOne({
			where: {
				token: req.params.tokenId,
				status: true
			}
		}).then(function (result) {
			if (!result) {
				req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.TOKEN_INVALID);
				res.render('resetEcPassword.ejs', {
					success: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS),
					message: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR),
					token: req.params.tokenId
				});
			} else {
				var expired_on = moment(result.expired_on).format();
				var current_date = moment().format();
				if (expired_on < current_date || result.status == false) {
					req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.TOKEN_EXPIRED)
					res.render('resetEcPassword.ejs', {
						success: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS),
						message: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR),
						token: req.params.tokenId
					});
				} else {
					res.render('resetEcPassword.ejs', {
						success: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS),
						message: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR),
						token: req.params.tokenId
					});
				}
			}
		}).catch(function (error) {
			req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR, CONSTANT_OBJ.MESSAGES.SERVER_ERROR);
			res.render('resetEcPassword.ejs', {
				success: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS),
				message: req.flash(STRING_CONSTANTS.STATUS_CONSTANT.ERROR),
				token: req.params.tokenId
			});
		})
	}
}
exports.resetEcPasswordPage = resetEcPasswordPage;


/*________________________________________________________________________
 * @Date:      		10 May 2021
 * @Method :   		Check token validity
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		Reset password for family app.
 _________________________________________________________________________
 */
var resetTokenVerify = (req, res) => {
	var outputJson = {};
		if (!req.params.tokenId) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.MISSING_INFO
			};
			res.status(400).json(outputJson);
		} else {
		models.ec_tokens.findOne({
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
}
exports.resetTokenVerify = resetTokenVerify;


var changepasswordEc = (req, res) => {
	var outputJson = {};
	var scheme;
	if (!req.body.password || !req.body.token || !req.body.confirmpassword) return res.status(400).json({
		msg: CONSTANT_OBJ.MESSAGES.MISSING_DATA_MSG
	});

	models.ec_tokens.findOne({
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
				var user_agent_value = req.headers['user-agent'];
				var salt = bcrypt.genSaltSync(tokenObj.dataValues.email % 10);
				var hash = bcrypt.hashSync(req.body.password, salt);
				var data = {
					email: tokenObj.dataValues.email,
					user_password: hash
				}
				var fields = {
					password: data.user_password
				};

				models.emergency_contacts.update(
					fields, {
						where: {
							email: data.email,
						}
					}
				).then(function () {
					models.ec_tokens.update({
						status: false
					}, {
							where: {
								token: req.body.token,
								status: true

							}
						}).then(function () {
							if (user_agent_value.indexOf(STRING_CONSTANTS.DEVICE_TYPE.IPHONE) > -1 || user_agent_value.indexOf(STRING_CONSTANTS.DEVICE_TYPE.IPAD) > -1) {
								scheme = DEEP_LINK_CONSTANT.IOS_FAMILY_URL_SCHEME
							} else {
								scheme = DEEP_LINK_CONSTANT.ANDROID_FAMILY_URL_SCHEME;
							}
							outputJson = {
								msg: CONSTANT_OBJ.MESSAGES.PASSWD_CHANGE,
								scheme: scheme
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

	}).catch(function (error) {
		return res.status(400).json({
			msg: CONSTANT_OBJ.MESSAGES.VERIFY_DETAILS,
			err: error
		});
	});
}
exports.changepasswordEc = changepasswordEc;



/*________________________________________________________________________
 * @Date:      		15 February 2017
 * @Method :   		settings
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		save settings of user regarding notification settings
 _________________________________________________________________________
 */
var settings = (req, res) => {
	var outputJson = {};
	if (!req.headers.ec_email || !req.body.email || !req.body.user_setting) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	models.emergency_contacts.findAll({
		where: {
			email: req.body.email,
			is_verified: true
		}
	})
		.then(function (data) {
			if (!data) {
				outputJson = {
					msg: CONSTANT_OBJ.MESSAGES.NO_RECORD_FOUND
				}
				res.status(400).json(outputJson);
			} else {
				var obj = {}
				obj.user_setting = req.body.user_setting;
				models.emergency_contacts.update(obj, {
					where: {
						email: req.body.email,
						is_verified: true
					}
				}).then(function () {
					outputJson.msg = CONSTANT_OBJ.MESSAGES.NOTIFICATION_SETTING_ALERT;
					res.status(200).jsonp(outputJson)
				}).catch(function (error) {
					outputJson = {
						msg: error
					}
					res.status(400).json(outputJson);
				});
			}

		})
		.catch(function (error) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.GET_EMGY_CONT_ERR,
				err: error
			}
			output = cryptoService.encryptMobileData(req.headers, JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});

}
exports.settings = settings;

/*________________________________________________________________________
 * @Date:      		15 February 2017
 * @Method :   		logout
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		logout for family app
 _________________________________________________________________________
 */
var logout = (req, res) => {
	var device = {};
	var outputJson = {};
	device.device_token = null;
	device.device_type = null;
	device.device_id = null;
	device.app_version = null;
	models.emergency_contacts.update(device, {
		where: {
			email: req.headers.ec_email
		}
	}).then(function () {
		models.ec_tokens.destroy({
			where: {
				email: req.headers.ec_email
			}
		})
			.then(function () {
				outputJson.msg = CONSTANT_OBJ.MESSAGES.LOGGED_OUT;
				res.status(200).jsonp(outputJson)
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
}

exports.logout = logout;

/*________________________________________________________________________
 * @Date:      		20 Jul 2018
 * @Method :   		logout
 * Created By: 		smartData Enterprises Ltd
 * Modified On:		-
 * @Purpose:   		to show legal popup  adding a patient to the family member
 _________________________________________________________________________
 */

var privacyTerm = (req, res) => {
	var outputJson = {};
	if (!req.headers.ec_email) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	if (!req.body.id) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.MISSING_INFO;
		return res.status(400).json(outputJson);
	}
	models.emergency_contacts.update({
		privacyTerm: true,
	}, {
			where: {
				email: req.headers.ec_email,
				is_verified: true,
				id: req.body.id
			}
		}).then(function () {
			outputJson.data = {};

			outputJson.data.msg = CONSTANT_OBJ.MESSAGES.STATUS_UPDATED;
			outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson.data));
			res.status(200).jsonp(outputJson)
		})
		.catch(function (err) {
			outputJson = {
				msg: CONSTANT_OBJ.MESSAGES.dataError
			}
			res.status(400).json(outputJson);

		});

}
exports.privacyTerm = privacyTerm;
/*_______________________
 * @Date:           14 Aug 2018
 * @Method :        aideChangePassword
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        to change password  for family app i.e Link under settings in family app
 _________________________________________________________________________
 */
var familyChangePassword = (req, res) => {
	var outputJson = {};
	if (!req.headers.ec_email) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_EMAIL;
		return res.status(400).json(outputJson);
	}
	if (!req.body.oldPassword || !req.body.password) {
		outputJson.msg = CONSTANT_OBJ.MESSAGES.MISSING_INFO;
		return res.status(400).json(outputJson);
	}
	var passwordFormatCheck = commonFunction.passwordFormat(req.body.password);
	if (passwordFormatCheck.status != true) {
		outputJson = {
			msg: passwordFormatCheck.message
		}
		return res.status(400).json(outputJson);
	}
	models.emergency_contacts.find({
		where: {
			is_active: true,
			email: {
				ilike: req.headers.ec_email
			},
			password: {
				ne: null
			}
		}
	}).then(function (emergencyContacts) {
		if (emergencyContacts) {
			// User exists but wrong password
			if (!isValidPassword(emergencyContacts['password'], req.body.oldPassword)) {
				outputJson.msg = CONSTANT_OBJ.MESSAGES.CHECK_EXISTING_PASSWORD;
				return res.status(203).json(outputJson);
			}
			// Old password and new password cannot be same
			if (isValidPassword(emergencyContacts['password'], req.body.password)) {
				outputJson.msg = CONSTANT_OBJ.MESSAGES.TRY_DIFFERENT_PASSWORD;
				return res.status(203).json(outputJson);
			}
			if (!isValidPassword(emergencyContacts['password'], req.body.password)) {
				var salt = bcrypt.genSaltSync(req.headers.aide_id % 10);
				var hash = bcrypt.hashSync(req.body.password, salt);
				var data = {
					email: req.headers.ec_email,
					user_password: hash
				}
				var fields = {
					password: data.user_password
				};
				models.emergency_contacts.update(
					fields, {
						where: {
							email: req.headers.ec_email,
							is_active: true,
						}
					}
				).then(function () {
					outputJson.data = {};
					outputJson.data.msg = CONSTANT_OBJ.MESSAGES.PASSWD_CHANGE;
					outputJson.data = cryptoService.encryptMobileData(req.headers, JSON.stringify(outputJson.data));
					res.status(200).jsonp(outputJson);
				}).catch(function (error) {
					outputJson = {
						msg: error
					}
					res.status(400).json(outputJson);
				})
			}

		} else {
			outputJson.msg = CONSTANT_OBJ.MESSAGES.API_MISSING_PASS;
			return res.status(203).json(outputJson);
		}

	}).catch(function (error) {
		outputJson = {
			msg: error
		}
		res.status(400).json(outputJson);
	});

}
exports.familyChangePassword = familyChangePassword;
