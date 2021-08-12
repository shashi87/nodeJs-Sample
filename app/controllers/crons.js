var CronJob = require('cron').CronJob;
var models = require("../models");
var moment = require('moment');
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var DB_CONSTANTS = require("../constants/dbConstants.js");
var STRING_CONSTANTS = require("../constants/stringConstants.js");
/*________________________________________________________________________
   * @Date:             21 Oct 2016
   * @Method :          Cron
   * Created By:        smartData Enterprises Ltd
   * Modified On:       -
   * @Purpose:          Cron to create schedule of all aides of an agency
_________________________________________________________________________
*/

// eslint-disable-next-line no-useless-catch
try {
	var job = new CronJob({
		cronTime: '0 0 0 * * *',
		//cronTime: '*/5 * * * * * *',
		onTick: function () {
			get2weekArrayCron();
		},
		start: true,
		//runOnInit : true
	});
	job.start();
} catch (ex) {
	throw ex;
}


/*
   * @Date:       22 Feb 2018
   * @Method :    Cron
   * Created By:  smartData Enterprises Ltd
   * Modified On: -
   * @Purpose:    Cron to create new schedules based on susbtituion criteria
______________________________________________________
*/
try {
	var job = new CronJob({
		cronTime: '0 23 * * *',
		onTick: function () {
			createScheduleFromSubstitution();
		},
		start: true,
		//runOnInit : true
	});
	job.start();
} catch (ex) {
	//console.log("cron pattern not valid", ex);
}

var createScheduleFromSubstitution = function () {
	var todayDate = moment();
	todayDate = todayDate.add(1, "days");
	todayDate = todayDate.format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT);
	models.substitutions.findAll({
		where: {
			is_active: true,
			enddate: {
				gte: todayDate + " 00:00:00",
				lte: todayDate + " 23:59:59",
				$ne: null
			},
		},
		include: [{
			model: models.main_schedule,
			where: {
				is_active: true,
			},
			required: false,
			include: [{
				model: models.schedule,
				where: {
					is_active: true,
				},
				required: false
			}]
		}],
		order: [
			['id', STRING_CONSTANTS.SORT_ORDER.ASC]
		],
		limit: 1
	})
		.then(function (substitute) {
			var newAideId = "";
			if (substitute.length > 0) {
				for (var i = 0; i < substitute.length; i++) {

					if (substitute[i].enddate != null) {
						var substituteEndDate = moment(substitute[i].enddate).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_FORMAT);
						substituteEndDate = new Date(substituteEndDate).getTime();
						var scheduledata = substitute[i].main_schedule.schedules;
						scheduledata.sort(function (a, b) {
							return a.id - b.id
						})
						if (scheduledata.length > 0) {
							for (var j = 0; j < scheduledata.length; j++) {
								var scheduleEnddate = moment(scheduledata[j].date).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_FORMAT);
								scheduleEnddate = new Date(scheduleEnddate).getTime();
								if (scheduleEnddate <= substituteEndDate) {
									newAideId = substitute[i].aide_id;
									if (newAideId != "") {
										var substituteData = substitute[i];
										getAideDetails(newAideId, function (successData) {
											if (successData) {
												var updateData = {};
												updateData.id = substituteData.main_schedule_id;
												updateData.aide_id = newAideId;
												updateData.aide_f_name = successData.first_name;
												updateData.aide_l_name = successData.last_name;
												updateData.substitute_id = substituteData.id;
												updateMainScheduleSubs(updateData, function () {
												});

											}
										});

									}
								}
							}
						}
					}
				}
			}
		})
		.catch(function () {
			//console.log(err);
			return "";
		})
}
exports.createScheduleFromSubstitution = createScheduleFromSubstitution;

var updateMainScheduleSubs = function (optionsData, cb) {
	models.main_schedule.update({
		aide_id: optionsData.aide_id,
		aide_f_name: optionsData.aide_f_name,
		aide_l_name: optionsData.aide_l_name,
	}, {
		where: {
			id: optionsData.id
		}
	})
		.then(function (updated_main_sch) {
			models.substitutions.update({
				is_active: false,
			}, {
				where: {
					id: optionsData.substitute_id
				}
			})
				.then(function () {
					cb(updated_main_sch)
				})
				.catch(function (err) {
					cb(err)
				})
		})
		.catch(function (err) {
			cb(err)
		})
}

var getAideDetails = function (aide_id, cb) {
	models.aide.findOne({
		where: {
			is_active: true,
			id: aide_id
		},
	})
		.then(function (aideData) {
			cb(aideData)
		})
		.catch(function (err) {
			cb(err)
		})
}

/******************************************************************/
/*function for cron*/

var get2weekArrayCron = function () {
	var date = moment().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT);
	var nextDates = [];
	for (var x = 0; x < 3; x++) {
		nextDates.push(moment(date).add(x, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT));
	}
	getAllSchedulesCron(nextDates, date);
}
exports.get2weekArrayCron = get2weekArrayCron;

var getPatientDetails = function (patient_id, cb) {
	models.patients.find({
		where: {
			is_active: true,
			id: patient_id
		},
		include: [{
			model: models.patient_details
		}]
	})
		.then(function (patientData) {
			cb(patientData)
		})
		.catch(function (err) {
			cb(err)
		})
}

/*get schedules for cron*/
var getAllSchedulesCron = function (dateArray, todayDate) {
	models.main_schedule.findAll({
		where: {
			is_active: true,
			next_recurring_date: {
				gte: todayDate + " 00:00:00",
				lte: todayDate + " 23:59:59"
			},
		},
		include: [{
			model: models.aide,
			where: {
				is_active: true
			},
			required: true,
			include: [{
				model: models.users
			}]
		}, {
			model: models.schedule_activities,
			where: {
				is_active: true
			},
			required: false
		}]
	})
		.then(function (schedules) {
			for (var s = 0; s < schedules.length; s++) {
				updateScheduleCron(schedules[s].dataValues, dateArray, 0);
			}
		})
		.catch(function () {

		})
}
exports.getAllSchedulesCron = getAllSchedulesCron;

var updateScheduleCron = function (schedule, dateArray, i) {
	if (i < dateArray.length) {
		models.schedule.findAll({
			where: {
				datetime_clock_in: {
					gte: dateArray[i] + " 00:00:00",
					lte: dateArray[i] + " 23:59:59"
				},
				main_schedule_id: schedule.id,
				is_active: true
			}
		}).then(function (data) {
			if (data.length) {
				updateScheduleCron(schedule, dateArray, i + 1);
			} else {
				getPatientDetails(schedule.patient_id, function (successData) {
					if (successData) {
						var patient_timezone = successData.patient_detail.time_zone;
						var date_array = moment(schedule.clock_in).add(schedule.recurring_counter, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						var c_in = moment(schedule.clock_in).add(schedule.recurring_counter, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						var c_out = moment(schedule.clock_out).add(schedule.recurring_counter, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						var clock_in_date = moment.tz(c_in, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						var clock_out_date = moment.tz(c_out, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						var newSchedule = {
							aide_id: schedule.aide_id,
							user_id: schedule.agency_id,
							patient_id: schedule.patient_id,
							date: date_array,
							main_schedule_id: schedule.id,
							scheduled_clock_in: c_in,
							datetime_clock_in: clock_in_date,
							scheduled_clock_out: c_out,
							datetime_clock_out: clock_out_date,
						};

						var clock_in_nrd = moment(schedule.clock_in).add(schedule.recurring_counter - 1, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);

						var next_recurring_date = moment.tz(clock_in_nrd, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);

						models.main_schedule.update({
							next_recurring_date: next_recurring_date,
							recurring_counter: schedule.recurring_counter + 1,
						}, {
							where: {
								id: schedule.id
							}
						}).then(function () {

							models.schedule.build(newSchedule).save().then(function (data) {
								schedule.scheduled_id = data.id;
								schedule.date = newSchedule.date;
								schedule.datetime_start = newSchedule.datetime_clock_in;
								schedule.datetime_end = newSchedule.datetime_clock_out;
								if (schedule.schedule_activities.length > 0) {
									updateActForScheduleCron(schedule, dateArray, i, 0)
								} else {
									if (i < dateArray.length) {
										updateScheduleCron(schedule, dateArray, i + 1);
									}
								}
							})
								.catch(function () {

								})
						}).catch(function () {

						})

					}
				});
			}
		}).catch(function () {

		});
	}
}
exports.updateScheduleCron = updateScheduleCron;


var updateActForScheduleCron = function (schedule, dateArray, i, j) {
	var datetime_start = '';
	var datetime_end = '';
	getPatientDetails(schedule.patient_id, function (successData) {
		if (successData) {
			var patient_timezone = successData.patient_detail.time_zone;

			if (j < schedule.schedule_activities.length) {
				var schDate = moment(schedule.schedule_activities[j].scheduled_time_start_date).format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT);
				var diff_in_weeks = moment(dateArray[i]).diff(schDate, 'weeks', true);
				var diff = Math.round(diff_in_weeks);
				var is_insertion = false;

				var localTimeIn = moment(schedule.schedule_activities[j].scheduled_time_start_date).tz(patient_timezone).add(diff, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
				var localTimeOut = moment(schedule.schedule_activities[j].scheduled_time_end_date).tz(patient_timezone).add(diff, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);

				if (schedule.schedule_activities[j].period === STRING_CONSTANTS.RECURRENCE_TYPE.WEEK) {
					is_insertion = true;
					datetime_start = moment.tz(localTimeIn, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
					datetime_end = moment.tz(localTimeOut, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
				} else if (schedule.schedule_activities[j].period === STRING_CONSTANTS.RECURRENCE_TYPE.TWO_WEEKS) {
					if (diff % 2 == 0) {
						is_insertion = true;
						datetime_start = moment.tz(localTimeIn, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						datetime_end = moment.tz(localTimeOut, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
					} else {
						is_insertion = false;
					}
				} else if (schedule.schedule_activities[j].period === STRING_CONSTANTS.RECURRENCE_TYPE.MONTH) {
					if (diff % 4 == 0) {
						is_insertion = true;
						datetime_start = moment.tz(localTimeIn, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						datetime_end = moment.tz(localTimeOut, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
					} else {
						is_insertion = false;
					}
				} else if (schedule.schedule_activities[j].period === STRING_CONSTANTS.RECURRENCE_TYPE.YEAR) {
					if (diff % 52 == 0) {
						is_insertion = true;
						datetime_start = moment.tz(localTimeIn, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
						datetime_end = moment.tz(localTimeOut, patient_timezone).utc().format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
					} else {
						is_insertion = false;
					}
				}
				if (is_insertion) {
					var newAct = {
						aide_id: schedule.schedule_activities[j].dataValues.aide_id,
						user_id: schedule.agency_id,
						patient_id: schedule.schedule_activities[j].dataValues.patient_id,
						main_schedule_id: schedule.schedule_activities[j].dataValues.main_schedule_id,
						scheduled_id: schedule.scheduled_id,
						date: schedule.date,
						scheduled_activity_id: schedule.schedule_activities[j].dataValues.id,
						datetime_start: datetime_start,
						datetime_end: datetime_end,
						schedule_type: schedule.schedule_activities[j].clock_in_out
					};
					models.aide_activities.findOrCreate({
						where: {
							scheduled_id: schedule.scheduled_id,
							scheduled_activity_id: schedule.schedule_activities[j].dataValues.id
						},
						defaults: newAct
					}).then(function () {
						if (j < schedule.schedule_activities.length) {
							updateActForScheduleCron(schedule, dateArray, i, j + 1)
						} else {
							if (i < dateArray.length) {
								updateScheduleCron(schedule, dateArray, i + 1);
							}
						}
					}).catch(function () {

					});
				} else {
					updateActForScheduleCron(schedule, dateArray, i, j + 1)
				}

			} else {
				updateScheduleCron(schedule, dateArray, i + 1);
			}
			return false
		}
	});
}
exports.updateActForScheduleCron = updateActForScheduleCron;
/*end schedules for cron*/
/*end cron*/

var get2weekArrayWeb = function (todayDate, main_schedule_id) {
	var nextDates = [];
	for (var x = 0; x < 3; x++) {
		nextDates.push(moment(todayDate).add(x, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_FORMAT));
	}
	getAllSchedules(nextDates, todayDate, main_schedule_id);

}
exports.get2weekArrayWeb = get2weekArrayWeb;


var getAllSchedules = function (dateArray, todayDate, main_schedule_id) {
	models.main_schedule.findAll({
		where: {
			is_active: true,
			id: main_schedule_id
		},
		include: [{
			model: models.aide,
			where: {
				is_active: true
			},
			required: true,
			include: [{
				model: models.users
			}]
		}, {
			model: models.schedule_activities,
			required: false
		}]
	})
		.then(function (schedules) {
			for (var k = 0; k < schedules.length; k++) {
				updateSchedule(schedules[k].dataValues, dateArray, 0);
			}
		})
		.catch(function () {

		})
}
exports.getAllSchedules = getAllSchedules;

var updateSchedule = function (schedule, dateArray, i) {
	if (i < dateArray.length) {
		var date_array = moment(schedule.clock_in).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		var clock_in_date = moment(schedule.clock_in_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		var clock_out_date = moment(schedule.clock_out_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		var c_in = moment(schedule.clock_in).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		var c_out = moment(schedule.clock_out).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);

		var newSchedule = {
			aide_id: schedule.aide_id,
			user_id: schedule.agency_id,
			patient_id: schedule.patient_id,
			date: date_array,
			main_schedule_id: schedule.id,
			scheduled_clock_in: c_in,
			datetime_clock_in: clock_in_date,
			scheduled_clock_out: c_out,
			datetime_clock_out: clock_out_date,
		};
		models.schedule.findOrCreate({
			where: {
				datetime_clock_in: {
					gte: dateArray[i] + " 00:00:00",
					lte: dateArray[i] + " 23:59:59"
				},
				main_schedule_id: schedule.id
			},
			defaults: newSchedule
		}).then(function (data) {
			//console.log("newSchedule.date", newSchedule.date);
			schedule.scheduled_id = data[0].dataValues.id;
			schedule.date = newSchedule.date;
			schedule.datetime_start = newSchedule.datetime_clock_in;
			schedule.datetime_end = newSchedule.datetime_clock_out;
			if (schedule.schedule_activities.length > 0) {
				updateActForSchedule(schedule, dateArray, i, 0)
			} else {
				if (i < dateArray.length) {
					updateSchedule(schedule, dateArray, i + 1);
				}
			}
		}).catch(function () {
			//console.log('\n\n\n\n ', err);
		});
	}
}
exports.updateSchedule = updateSchedule;

var updateActForSchedule = function (schedule, dateArray, i, j) {
	var datetime_start = '';
	var datetime_end = '';
	if (schedule.schedule_activities[j].clock_in_out == 1) {
		datetime_start = moment(schedule.schedule_activities[j].scheduled_time_start_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		datetime_end = moment(schedule.schedule_activities[j].scheduled_time_end_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
	} else if (schedule.schedule_activities[j].clock_in_out == 2) {
		datetime_start = moment(schedule.schedule_activities[j].scheduled_time_start_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		datetime_end = moment(schedule.schedule_activities[j].scheduled_time_end_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
	} else {
		datetime_start = moment(schedule.schedule_activities[j].scheduled_time_start_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
		datetime_end = moment(schedule.schedule_activities[j].scheduled_time_end_date).add(i, 'week').format(STRING_CONSTANTS.DATE_CONSTANT.DATE_TIME_FORMAT);
	}
	var newAct = {
		aide_id: schedule.schedule_activities[j].dataValues.aide_id,
		user_id: schedule.agency_id,
		patient_id: schedule.schedule_activities[j].dataValues.patient_id,
		main_schedule_id: schedule.schedule_activities[j].dataValues.main_schedule_id,
		scheduled_id: schedule.scheduled_id,
		date: schedule.date,
		scheduled_activity_id: schedule.schedule_activities[j].dataValues.id,
		datetime_start: datetime_start,
		datetime_end: datetime_end,
		schedule_type: schedule.schedule_activities[j].clock_in_out
	};
	models.aide_activities.findOrCreate({
		where: {
			scheduled_id: schedule.scheduled_id,
			scheduled_activity_id: schedule.schedule_activities[j].dataValues.id
		},
		defaults: newAct
	}).then(function () {
		if (j + 1 < schedule.schedule_activities.length) {
			updateActForSchedule(schedule, dateArray, i, j + 1)
		} else {
			if (i < dateArray.length) {
				updateSchedule(schedule, dateArray, i + 1);
			}
		}
	}).catch(function () {
		//console.log('\n\n\n\n ', err);
	});

}
exports.updateActForSchedule = updateActForSchedule;

var addClockInOutAct = function (schedule, dateArray, i) {
	var endDate = moment(dateArray[i]);
	var startDate = moment(dateArray[i]);
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
	var newActStart = {
		aide_id: schedule.aide_id,
		user_id: schedule.agency_id,
		patient_id: schedule.patient_id,
		main_schedule_id: schedule.id,
		scheduled_id: schedule.scheduled_id,
		scheduled_activity_id: 0,
	};
	var newActEnd = {
		aide_id: schedule.aide_id,
		user_id: schedule.agency_id,
		patient_id: schedule.patient_id,
		main_schedule_id: schedule.id,
		scheduled_id: schedule.scheduled_id,
		scheduled_activity_id: 1,
	};
	models.aide_activities.findOrCreate({
		where: {
			//date: {gte: startDate.toDate(),lte:endDate.toDate()},
			scheduled_id: schedule.scheduled_id,
			scheduled_activity_id: 0 // 0 will be used for clock in task // 1 for clockOut
		},
		defaults: newActStart
		// if it doesn't exist, we create it with this additional data
	}).then(function () {
		models.aide_activities.findOrCreate({
			where: {
				//date: {gte: startDate.toDate(),lte:endDate.toDate()},
				scheduled_id: schedule.scheduled_id,
				scheduled_activity_id: 1 // 0 will be used for clock in task // 1 for clockOut
			},
			defaults: newActEnd
			// if it doesn't exist, we create it with this additional data
		}).then(function () {
			if (i < dateArray.length) {
				updateSchedule(schedule, dateArray, i + 1);
			}
		})
	}).catch(function () {
		//console.log('\n\n\n\n ', err);

	});

}
exports.addClockInOutAct = addClockInOutAct;

/*________________________________________________________________________
   * @Date:             21 Oct 2016
   * @Method :          getAgencyCount
   * Created By:        smartData Enterprises Ltd
   * Modified On:       -
   * @Purpose:          get count of all agencies
_________________________________________________________________________
*/
var getAgencyCount = function () {
	models.users.count({
		where: {
			is_active: true,
			type_id: 3,
			is_deleted: false
		}
	})
		.then(function () {
			////console.log('\n\n count --',count);

		})
		.catch(function (err) {
			saveCronError(null, 'failure', err.message);
		})
}
exports.getAgencyCount = getAgencyCount;
//getAgencyCount();
/**************************************************************************/



/*________________________________________________________________________
   * @Date:             21 Oct 2016
   * @Method :          getAllAgencies
   * Created By:        smartData Enterprises Ltd
   * Modified On:       -
   * @Purpose:          get list of all agencies
_________________________________________________________________________
*/
var getAllAgencies = function (AiterationNo, Alimit, Aoffset, Acount) {
	Aoffset = AiterationNo * Alimit;
	models.users.findAll({
		attributes: [DB_CONSTANTS.USERS.ID, DB_CONSTANTS.USERS.TYPE_ID],
		where: {
			is_active: true,
			type_id: 3,
			is_deleted: false
		},
		offset: Aoffset,
		limit: Alimit
	}, {
		raw: true
	})
		.then(function (agencies) {
			if (agencies.length > 0) {
				////console.log('*******************************************\n',agencies,'\n**********************');
				getAllAideForAgency(agencies, 0);
			} else {
				saveCronError(null, 'failure', CONSTANT_OBJ.MESSAGES.NO_AGENCY_FOUND)
			}
		})
}
exports.getAllAgencies = getAllAgencies;
/**************************************************************************/



/*________________________________________________________________________
   * @Date:             21 Oct 2016
   * @Method :          getAllAideForAgency
   * Created By:        smartData Enterprises Ltd
   * Modified On:       -
   * @Purpose:          get all aides for an agency
_________________________________________________________________________
*/
var getAllAideForAgency = function (agencies, i) {
	if (agencies[i]) {
		models.aide.findAll({
			attributes: [DB_CONSTANTS.AIDE.ID],
			where: {
				user_id: agencies[i].id,
				is_active: true
			}
		})
			.then(function () {
				////console.log('\n\n\n\n',agencies,'\n\n\n',aides)
			})
			.catch(function (err) {
				saveCronError(null, 'failure', err.message);
			})
	} else {
		saveCronError(null, 'failure', CONSTANT_OBJ.MESSAGES.GET_AIDE_LOOP_ERR)
	}
}
exports.getAllAideForAgency = getAllAideForAgency;
/**************************************************************************/

/*________________________________________________________________________
   * @Date:             21 Oct 2016
   * @Method :          updateAideSchedule
   * Created By:        smartData Enterprises Ltd
   * Modified On:       -
   * @Purpose:          save new aide schedule
_________________________________________________________________________
*/
var updateAideSchedule = function () {

};
exports.updateAideSchedule = updateAideSchedule;


/*________________________________________________________________________
   * @Date:             21 Oct 2016
   * @Method :          saveCronError
   * Created By:        smartData Enterprises Ltd
   * Modified On:       -
   * @Purpose:          save any error encountered during cron was running
_________________________________________________________________________
*/
var saveCronError = function (agencyId, status, errMsg) {
	var data = {};
	if (agencyId) {
		data.user_id = agencyId;
	}
	if (status || errMsg) {
		data.status = status;
		if (errMsg.length > 150) {
			data.failure_reason = errMsg.subString(0, 149);
		} else {
			data.failure_reason = errMsg;
		}
	} else {
		data.status = 'failure';
		data.failure_reason = CONSTANT_OBJ.MESSAGES.NO_STATUS_REASON;
	}

	models.dailyAgencyWiseCronStatus.build(data).save()
		.then(function () {
			//console.log("\n\ndailyAgencyWiseCronStatus saved successfully.\n\n");
		})
		.catch(function () {
			//console.log("\n\n ", data, "\n\ndailyAgencyWiseCronStatus save err.\n\n", err);
		})
}
exports.saveCronError = saveCronError;
/**************************************************************************/

