/*
 *This file contains code related to :
 *snapshot
 *
 */
var models = require("../../models");
var moment = require("moment");
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var Sequelize = require('sequelize');
var cryptoService = require("../../services/crypto");
var _ = require('lodash');
var DB_CONSTANTS = require("../../constants/dbConstants.js");
var STRING_CONSTANTS = require("../../constants/stringConstants.js");
/*________________________________________________________________________
 * @Date:           23 September 2016
 * @Method :        getClockList
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get the clock data of aides .
 _________________________________________________________________________
 */

var getDutiesList = (req, res) => {
	var date = req.body.date;
	var pageSize = req.body.limit || 10;
	var page = req.body.page || 1;
	var offset = (page - 1) * pageSize;
	var startDate = moment(date).format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT) + " 00:00:00";
	var endDate = moment(date).format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT) + " 23:59:59";

	var query = {
		datetime_start: {
			lte: endDate,
			gte: startDate,

		},
		user_id: req.user.id,
		is_active: true
	};

	models.aide_activities
		.findAndCountAll({
			include: [{
				model: models.aide,
				where: {
					is_active: true
				},
				attributes: [
					DB_CONSTANTS.AIDE.FIRST_NAME,
					DB_CONSTANTS.AIDE.LAST_NAME
				],
				include: [{
					model: models.aide_details
				}],
			}, {
				model: models.patients,
				where: {
					is_active: true
				},
				include: [{
					model: models.patient_details
				}, {
					model: models.emergency_contacts,
					where: {
						is_active: true
					},
					required: false
				}],
			}, {
				model: models.verification_requests,
				required: false
			}, {
				model: models.schedule_activities,
				include: [{
					model: models.admin_activities,
					required: true
				}]
			}],
			where: query,
			offset: offset,
			order: [[Sequelize.literal('"schedule_activity.scheduled_time_end"'), STRING_CONSTANTS.SORT_ORDER.ASC]],
			limit: pageSize,
		})
		.then(function (result) {

			var allData = result.rows;
			allData = _.orderBy(allData, ['schedule_activity.scheduled_time_end'], [STRING_CONSTANTS.SORT_ORDER.DESC]);
			for (var i = 0; i <= allData.length; i++) {
				if (allData[i]) {
					allData[i].patient.first_name = cryptoService.decryptString(allData[i].patient.first_name);
					allData[i].patient.last_name = cryptoService.decryptString(allData[i].patient.last_name);
					allData[i].patient.patient_detail.address = cryptoService.decryptString(allData[i].patient.patient_detail.address);

					allData[i].patient.patient_detail.dob = cryptoService.decryptString(allData[i].patient.patient_detail.dob);

					if (allData[i].patient.patient_detail.phone != null) {
						allData[i].patient.patient_detail.phone = cryptoService.decryptString(allData[i].patient.patient_detail.phone);
					}
					if (allData[i].patient.patient_detail.ssn != null) {
						allData[i].patient.patient_detail.ssn = cryptoService.decryptString(allData[i].patient.patient_detail.ssn);
					}
					if (allData[i].patient.patient_detail.email != null) {
						allData[i].patient.patient_detail.email = cryptoService.decryptString(allData[i].patient.patient_detail.email);
					}
				}
			}
			var output = {
				data: {
					rows: allData,
					count: result.count
				}
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			res.status(200).json({
				data: output
			})
		})
		.catch(function (err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.CLOCK_IN_WEEK_ERROR,
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});
}
exports.getDutiesList = getDutiesList;

var getAdminActivities = function (req, res) {
	models.admin_activities.findAll({

	}).then(function (result) {
		var output = {
			data: result
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		res.status(200).json({
			data: output
		})

	})
		.catch(function (err) {
			var output = {
				msg: "Activity data error",
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});

}
exports.getAdminActivities = getAdminActivities;

var updateDutyStatus = (req, res) => {
	var aide_activity_id = req.body.update_on.id
	var updateData = req.body.update_on;
	updateData.task_performed = true;
	var id = updateData.id;
	delete updateData["id"];

	models.aide_activities.update(updateData, {
		where: {
			id: id
		}
	}).then(function () {
		models.verification_requests.update({
			job_status: req.body.update_on.status
		}, {
				where: {
					aide_activities: aide_activity_id
				}
			}).then(function () {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.SCHEDULE_UPDATE_STATUS_SUCCESS,
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({
					data: output
				});
			}).catch(function (err) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.SCHEDULE_UPDATE_STATUS_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});

			});
	}).catch(function (err) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.SCHEDULE_UPDATE_STATUS_ERR,
			err: err
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});

	});
}
exports.updateDutyStatus = updateDutyStatus;

var showverification = (req, res) => {
	if (req.body.activity_id >= 0) {
		models.verification_requests.find({
			where: {
				aide_activities: req.body.activity_id
			}
		}).then(function (result) {
			var output = {
				data: result
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		}).catch(function (err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.SHOW_VERIFICATION_ERR,
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});
	} else {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
}
exports.showverification = showverification;
