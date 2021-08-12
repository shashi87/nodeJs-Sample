/*
 *This file contains code related to :
 *agency registeration
 *Invitation Process
 */

var models = require("../models");
var moment = require("moment");
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var Sequelize = require('sequelize');
var cryptoService = require("../services/crypto");
var tzlookup = require("tz-lookup");
var pushServiceUpdate = require('../services/pushServiceOnUpdate.js');
var DB_CONSTANTS = require("../constants/dbConstants.js");
var STRING_CONSTANTS = require("../constants/stringConstants.js");
/*________________________________________________________________________
* @Date:            21 March 2017
* @Method :         getAllLoginDetails
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all login attempts of users.
_________________________________________________________________________
*/
var getAllLoginDetails = (req, res) => {
	var colName = 'email_id';
	var order = STRING_CONSTANTS.SORT_ORDER.ASC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};
	query = {
		include: [{
			model: models.user_login_attempts,
			attributes: [DB_CONSTANTS.USER_LOGIN_ATTEMPTS.ID, DB_CONSTANTS.USER_LOGIN_ATTEMPTS.USER_ID, DB_CONSTANTS.USER_LOGIN_ATTEMPTS.STATUS, DB_CONSTANTS.USER_LOGIN_ATTEMPTS.DATETIME],
		}],
		order: [[colName, order], [{ model: models.user_login_attempts }, DB_CONSTANTS.USER_LOGIN_ATTEMPTS.ID, STRING_CONSTANTS.SORT_ORDER.DESC]],
		where: {
			type_id: {
				$ne: 1
			},
		}
	}
	models.users
		.findAndCountAll(query)
		.then(function (result) {
			var returnData = [];
			for (var i = 0; i < result.rows.length; i++) {
				if (result.rows[i].dataValues.user_login_attempts.length > 0) {
					returnData.push(result.rows[i]);
				}
			}
			var output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: returnData,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.getAllLoginDetails = getAllLoginDetails;

/*________________________________________________________________________
* @Date:            13 September 2017
* @Method :         getAllAgencyList
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all agency list.
_________________________________________________________________________
*/
var getAllAgencyList = (req, res) => {
	var colName = DB_CONSTANTS.USERS.EMAIL_ID;
	var order = STRING_CONSTANTS.SORT_ORDER.ASC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};
	query = {

		where: {
			type_id: 3,
			is_deleted: false
		},
		order: [[colName, order]]
	}

	models.users.findAndCountAll(query)
		.then(function (result) {
			var returnData = [];
			for (var i = 0; i < result.rows.length; i++) {
				returnData.push(result.rows[i]);
			}
			var output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: returnData,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.getAllAgencyList = getAllAgencyList;


/*________________________________________________________________________
* @Date:            13 September 2017
* @Method :         getAllPatientList
* Created By:       smartData Enterprises Ltd
* Modified On:      -
encrypt(JSON.stri* @Purpose:         Fetch all agency list.
_________________________________________________________________________
*/
var getAllPatientList = (req, res) => {
	var colName = DB_CONSTANTS.PATIENTS.ID;
	var order = STRING_CONSTANTS.SORT_ORDER.ASC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};
	query = {
		where: {
			is_active: true,
			user_id: req.body.user_id
		},
		order: [[colName, order]]
	}

	models.patients.findAndCountAll(query)
		.then(function (result) {
			var allData = result.rows;
			for (let i = 0; i <= allData.length; i++) {
				if (allData[i]) {
					allData[i].first_name = cryptoService.decryptString(allData[i].first_name);
					allData[i].last_name = cryptoService.decryptString(allData[i].last_name);
					allData[i].createdAt = moment(allData[i].createdAt).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_FORMAT);
				}
			}

			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: allData,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.getAllPatientList = getAllPatientList;


/*________________________________________________________________________
* @Date:            21 March 2017
* @Method :         getAllLoginDetails
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all login attempts of users.
_________________________________________________________________________
*/
var updateUserStatus = (req, res) => {
	var inputData = req.body;
	var data = {};

	if (inputData.type === 'userStatus') {
		data = { is_active: inputData.status }
	} else {
		if (inputData.failed_attempts == 5) {
			data = { failed_attempts: 0, last_attempt: null }
		} else {
			data = { failed_attempts: 5, last_attempt: moment() }
		}
	}
	models.users.update(data, {
		where: {
			id: inputData.id
		}
	}).then(function (user) {
		let output = {
			status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
			messageId: 200,
			data: user
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(200).json({ data: output });
	})
		.catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.updateUserStatus = updateUserStatus;



/*________________________________________________________________________
* @Date:            14 September 2018
* @Method :         deleteAgency
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Delete Agency.
_________________________________________________________________________
*/
var deleteAgency = (req, res) => {
	var inputData = req.body;
	var data = {};
	data = {
		is_deleted: true
	};
	models.users.update(data, {
		where: {
			id: inputData.id
		}
	}).then(function (user) {
		let output = {
			status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
			messageId: 200,
			data: user
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(200).json({ data: output });
	})
		.catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.deleteAgency = deleteAgency;


/*________________________________________________________________________
* @Date:            21 july 2016
* @Method :         registration
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Get agency Data.
_________________________________________________________________________
*/
var getSessionData = (req, res) => {
	models.users.findOne({ where: { id: req.user.id } })
		.then(function (result) {
			let output = {
				data: result
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		})
		.catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});

}
exports.getSessionData = getSessionData;

/*________________________________________________________________________
* @Date:            21 March 2017
* @Method :         getAllLoginDetails
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all login attempts of users.
_________________________________________________________________________
*/
var getAllLoginHistory = (req, res) => {
	var userId = req.body.user_id
	var pageSize = req.body.limit || 10;
	var page = req.body.page || 1;
	var offset = (page - 1) * pageSize;
	var colName = 'id';
	var order = STRING_CONSTANTS.SORT_ORDER.DESC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};
	query = {
		order: colName + ' ' + order,
		include: [{
			model: models.users,
			attributes: [DB_CONSTANTS.USERS.ID, DB_CONSTANTS.USERS.EMAIL_ID],
		}],
		where: {
			user_id: userId
		}
	}
	models.user_login_attempts
		.findAndCountAll(query)
		.then(function (result) {
			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.getAllLoginHistory = getAllLoginHistory;


/*________________________________________________________________________
* @Date:            21 March 2017
* @Method :         getAllLoginDetails
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all login attempts of users.
_________________________________________________________________________
*/
var blockIP = (req, res) => {
	var inputData = req.body;
	var data = { user_id: inputData.user_id, ip: inputData.ip }
	models.user_login_attempts.update({ is_ip_blocked: inputData.value }, {
		where: {
			address: inputData.ip
		}
	}).then(function () {
		if (inputData.value == true) {
			models.blocked_ip.build(data).save().then(function () {
				let output = {
					status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
					messageId: 200
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			});
		} else {
			models.blocked_ip.destroy({
				where: {
					ip: inputData.ip

				}
			}).then(function () {
				let output = {
					status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
					messageId: 200
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({ data: output });
			});
		}
	})
		.catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});

}
exports.blockIP = blockIP;

/*________________________________________________________________________
* @Date:            22 March 2017
* @Method :         getAllBlocked
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all blocked ip list.
_________________________________________________________________________
*/
var getAllBlocked = (req, res) => {
	var pageSize = req.body.limit || 10;
	var page = req.body.page || 1;
	var offset = (page - 1) * pageSize;
	var colName = 'id';
	var order = STRING_CONSTANTS.SORT_ORDER.DESC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};

	query = {
		order: colName + ' ' + order,
		offset: offset,
		limit: pageSize
	}
	models.blocked_ip
		.findAndCountAll(query)
		.then(function (result) {
			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.getAllBlocked = getAllBlocked;

/*get all login aides details*/
var getAllAidesDetails = (req, res) => {
	var pageSize = req.body.limit || 10;
	var page = req.body.page || 1;
	var offset = (page - 1) * pageSize;
	var query = {};
	query = {
		where: {

			is_active: true
		},
		offset: offset,
		limit: pageSize,
	}

	models.aide
		.findAndCountAll(query)
		.then(function (result) {
			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
}
exports.getAllAidesDetails = getAllAidesDetails;

var UnblockUser = (req, res) => {
	var inputData = req.body;
	models.aide.update({
		failed_attempts: 0,
		last_attempt: null,
		failed_status: true
	}, {
			where: {

				id: inputData.id

			}
		}).then(function () {
			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });

		})
		.catch(function (err) {
			//console.log('\n\n\n', err)
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});

}
exports.UnblockUser = UnblockUser;

var getBlockedAideLogin = (req, res) => {
	var query = {};
	query = {
		where: {
			failed_attempts: {
				gte: 5
			}
		},
	}
	models.aide
		.findAndCountAll(query)
		.then(function (result) {
			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});

}
exports.getBlockedAideLogin = getBlockedAideLogin;
/*________________________________________________________________________
* @Date:            4 Sep 2018
* @Method :         updatePatientTimeZone
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:        API to update Patient TimeZone.
_________________________________________________________________________
*/

var getPatientData = function (req, res) {
	var startDate = moment(req.body.date.startDate);
	var endDate = moment(req.body.date.endDate);
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

	models.schedule.findAll({
		where: {
			datetime_clock_in: {
				lte: endDate.toDate(),
				gte: startDate.toDate(),
			},
			patient_id: req.body.id,
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
			}, {
				model: models.verification_requests,
				where: {
					is_active: true
				},
			}],
			required: false
		}, {
			model: models.main_schedule,
			where: {
				is_active: true
			},
		}, {
			model: models.aide,
			where: {
				is_active: true
			},
			include: [{
				model: models.aide_details
			}]
		}],
		order: [
			[DB_CONSTANTS.SCHEDULES.DATETIME_CLOCK_IN, STRING_CONSTANTS.SORT_ORDER.ASC]
		]
	}).then(function (allScheduleData) {

		models.patients.findOne({
			where: {
				id: req.body.id,
				is_active: true
			},
			include: [{
				model: models.patient_details,
				where: {
					is_active: true
				},
				required: false
			}, {
				model: models.patient_daily_activities,
				where: {
					is_active: true
				},
				required: false
			}, {
				model: models.patient_skills,
				where: {
					is_active: true
				},
				required: false
			}, {
				model: models.patient_services,
				where: {
					is_active: true
				},
				required: false
			}],
			order: [
				[DB_CONSTANTS.PATIENTS.ID, STRING_CONSTANTS.SORT_ORDER.DESC],
			],
		}).then(function (aideServicesData) {

			models.patients.findOne({
				where: {
					id: req.body.id,
					is_active: true
				},
				include: [{
					model: models.patient_docs,
					where: {
						is_active: true
					},
					required: false
				}, {
					model: models.patient_medications,
					where: {
						is_active: true
					},
					required: false
				}, {
					model: models.patient_supplements,
					where: {
						is_active: true
					},
					required: false
				}, {
					model: models.patient_medical_informations,
					required: false
				}, {
					model: models.patient_fields_values,
					where: {
						is_active: true
					},
					required: false
				}],
				order: [
					[DB_CONSTANTS.PATIENTS.ID, STRING_CONSTANTS.SORT_ORDER.DESC],
				],
			}).then(function (medicalInformation) {

				models.patients.findOne({
					where: {
						id: req.body.id,
						is_active: true
					},
					include: [{
						model: models.patient_insurers,
						where: {
							is_active: true
						},
						required: false
					}, {
						model: models.patient_medicare,
						required: false
					}],
					order: [
						[DB_CONSTANTS.PATIENTS.ID, STRING_CONSTANTS.SORT_ORDER.DESC],
					],
				}).then(function (payorInfo) {
					var optionsIds = [];
					var optionsData = medicalInformation.patient_fields_values;
					if (optionsData) {
						for (var key in optionsData) {
							optionsIds.push(optionsData[key].patient_field_option_id);
						}
					}

					models.patient_fields_options.findAll({
						attributes: [DB_CONSTANTS.PATIENT_FIELDS_OPTIONS.TITLE],
						where: {
							id: { $in: optionsIds }
						},
						include: [{
							model: models.patient_fields,
							attributes: [DB_CONSTANTS.PATIENT_FIELDS.ORIG_TITLE, DB_CONSTANTS.PATIENT_FIELDS.FIELD_CATEGORY],
							order: [[DB_CONSTANTS.PATIENT_FIELDS_OPTIONS.FIELD_ORDER, STRING_CONSTANTS.SORT_ORDER.DESC]],
						}],
					}).then(function (fieldData11) {

						models.admin_activities.findAll({
						}).then(function (allAdminActivities) {
							var fieldData = JSON.parse(JSON.stringify(fieldData11));
							var finalData = []
							for (var i = 0; i < fieldData.length; i++) {
								var thisData = {};
								var flag = -1
								for (var j = 0; j < finalData.length; j++) {
									if (finalData[j]["key"] == fieldData[i]['patient_field'][DB_CONSTANTS.PATIENT_FIELDS.ORIG_TITLE]) {
										flag = j
										break
									}
								}

								if (flag != -1) {
									finalData[flag]["value"].push(fieldData[i]['title'])
								} else {
									thisData["key"] = fieldData[i]['patient_field']['origTitle'];
									thisData["fieldCategory"] = fieldData[i]['patient_field']['fieldCategory']
									thisData["value"] = [fieldData[i]['title']]
									finalData.push(thisData);
								}
							}
							aideServicesData.first_name = cryptoService.decryptString(aideServicesData.first_name);
							aideServicesData.last_name = cryptoService.decryptString(aideServicesData.last_name);
							aideServicesData.patient_detail.address = cryptoService.decryptString(aideServicesData.patient_detail.address);
							aideServicesData.patient_detail.dob = cryptoService.decryptString(aideServicesData.patient_detail.dob);

							if (aideServicesData.patient_detail.phone != null) {
								aideServicesData.patient_detail.phone = cryptoService.decryptString(aideServicesData.patient_detail.phone);
							}
							if (aideServicesData.patient_detail.ssn != null) {
								aideServicesData.patient_detail.ssn = cryptoService.decryptString(aideServicesData.patient_detail.ssn);
							}
							if (aideServicesData.patient_detail.email != null) {
								aideServicesData.patient_detail.email = cryptoService.decryptString(aideServicesData.patient_detail.email);
							}
							var output = {
								aideServicesData: aideServicesData,
								medicalInformation: medicalInformation,
								payorInfo: payorInfo,
								allScheduleData: allScheduleData,
								patientMedicalData: finalData,
								allAdminActivities: allAdminActivities
							};
							output = cryptoService.encrypt(JSON.stringify(output));
							return res.status(200).json({
								data: output
							});

						}).catch(function (error) {
							console.log('ddddddddddddddddddddddddddddd', error)
							let output = {
								msg: CONSTANT_OBJ.MESSAGES.GET_PTNT_DATA_ERR,
								err: error
							}
							output = cryptoService.encrypt(JSON.stringify(output));
							return res.status(400).json({
								data: output
							})
						});

					}).catch(function (error) {
						let output = {
							msg: CONSTANT_OBJ.MESSAGES.GET_PTNT_DATA_ERR,
							err: error
						}
						output = cryptoService.encrypt(JSON.stringify(output));
						return res.status(400).json({
							data: output
						})
					});
				}).catch(function (error) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.GET_PTNT_DATA_ERR,
						err: error
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});


				});
			}).catch(function (error) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.GET_PTNT_DATA_ERR,
					err: error
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});


			});
		}).catch(function (error) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.GET_PTNT_DATA_ERR,
				err: error
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});


		});
	}).catch(function (error) {
		let output = {
			msg: CONSTANT_OBJ.MESSAGES.GET_PTNT_DATA_ERR,
			err: error
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});


	});
}
exports.getPatientData = getPatientData;


var updatePatientTimeZone = function (req, res) {
	models.patients
		.findAndCountAll({
			attributes: [
				DB_CONSTANTS.PATIENT_DETAILS.ID
			],
			include: [{
				model: models.patient_details,
				attributes: [
					DB_CONSTANTS.PATIENT_DETAILS.LAT, DB_CONSTANTS.PATIENT_DETAILS.LNG, DB_CONSTANTS.PATIENT_DETAILS.PATIENT_ID
				],
			}]
		})
		.then(function (result) {
			var patientData = result.rows;
			var updateCount = 0;
			for (var i = 0; i < patientData.length; i++) {
				if (patientData[i]) {
					if (patientData[i].patient_detail.lat && patientData[i].patient_detail.lng) {
						var time_zone = tzlookup(patientData[i].patient_detail.lat, patientData[i].patient_detail.lng);
						var data = {
							time_zone: time_zone
						}
						models.patient_details.update(data, {
							where: {
								patient_id: patientData[i].patient_detail.patient_id
							}
						}).then(function () {
							updateCount++;
						})
					}
				}
			}
			if (updateCount == result.count) {
				let output = {
					status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
					message: "Patient data updated successfully",
					count: result.count,
				}
				output = JSON.stringify(output);
				return res.status(200).json({ data: output });
			}
		}).catch(function (err) {
			//console.log('\n\n\n', err)
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});


}
exports.updatePatientTimeZone = updatePatientTimeZone;


/*________________________________________________________________________
* @Date:            21 March 2017
* @Method :         getAllAPPVersions
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         Fetch all mobiel app versions used by the users.
_________________________________________________________________________
*/
var getAllAPPVersions = (req, res) => {
	var pageSize = req.body.limit || 10;
	var page = req.body.page || 1;
	var offset = (page - 1) * pageSize;
	var colName = 'email_id';
	var order = STRING_CONSTANTS.SORT_ORDER.ASC;
	if (req.body.sort) {
		for (var i in req.body.sort) {
			if (i) {
				colName = i;
				order = req.body.sort[i].toUpperCase();
			}
		}
	}
	var query = {};
	query = {
		attributes: [DB_CONSTANTS.AIDE.APP_VERSION, DB_CONSTANTS.AIDE.DEVICE_TYPE, [Sequelize.fn('COUNT', Sequelize.col(DB_CONSTANTS.AIDE.ID)), 'count'], DB_CONSTANTS.AIDE.IOS_MIN_VERSION, DB_CONSTANTS.AIDE.ANDROID_MIN_VERSION],
		order: [[colName, order]],
		where: {
			is_active: true,
			app_version: {
				$ne: null
			},
			device_type: {
				$ne: null
			}
		},
		group: [DB_CONSTANTS.AIDE.APP_VERSION, DB_CONSTANTS.AIDE.DEVICE_TYPE, DB_CONSTANTS.AIDE.IOS_MIN_VERSION, DB_CONSTANTS.AIDE.ANDROID_MIN_VERSION],
		offset: offset,
		limit: pageSize
	}

	if (req.body.appType == 'Aide') {
		models.aide.findAndCountAll(query).then(function (result) {
			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
	} else {
		models.emergency_contacts.findAndCountAll(query).then(function (result) {
			let output = {
				status: STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				messageId: 200,
				data: result.rows,
				count: result.count
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({ data: output });
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		});
	}
}
exports.getAllAPPVersions = getAllAPPVersions;


var setAllAPPVersions = (req, res) => {
	var updtval = {};

	if (req.body.device_type == STRING_CONSTANTS.DEVICE_TYPE.LOWER_CASE_ANDROID || req.body.device_type == STRING_CONSTANTS.DEVICE_TYPE.ANDROID) {
		updtval.android_min_version = req.body.app_version;
	} else {
		updtval.ios_min_version = req.body.app_version;
	}

	if (req.body.APP_TYPE == 'Aide') {

		models.aide.update(updtval, {
			where: {
				is_active: true
			}
		})
			.then(function () {
				//pushServiceUpdate.sendVersionNotUpdate('1', req.body); //
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.MIN_APP_VERSION_SUCCESS_MSG,
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({
					data: output
				});
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.MIN_APP_VERSION_ERROR_MSG,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	} else {

		models.emergency_contacts.update(updtval, {
			where: {
				is_active: true
			}
		})
			.then(function () {
				//pushServiceUpdate.sendVersionNotUpdate('1', req.body); //
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.MIN_APP_VERSION_SUCCESS_MSG,
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({
					data: output
				});
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.MIN_APP_VERSION_ERROR_MSG,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	}


}

exports.setAllAPPVersions = setAllAPPVersions;

var adminActivities = function (req, res) {
	models.admin_activities.findAll({

	}).then(function (result) {
		let output = {
			data: result
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		res.status(200).json({
			data: output
		})

	})
		.catch(function (err) {
			let output = {
				msg: "Activity data error",
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});

}
exports.adminActivities = adminActivities;
