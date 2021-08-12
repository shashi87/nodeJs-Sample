'use strict';
var hookController = require("../controllers/hookController.js");
var moment = require('moment');
var DB_CONSTANTS = require("../constants/dbConstants.js");
var STRING_CONSTANTS = require("../constants/stringConstants.js");
module.exports = function (sequelize, DataTypes) {
	var verification_requests = sequelize.define('verification_requests', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.ID
		},
		aide_id: {
			allowNull: false,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.AIDE_ID
		},
		agency_id:{
			allowNull: false,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.AGENCY_ID
		},
		patient_id: {
			allowNull: false,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.PATIENT_ID
		},
		aide_activities: {
			allowNull: false,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.AIDE_ACTIVITIES
		},
		date: {
			allowNull: false,
			type: DataTypes.DATE,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.DATE
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.IS_ACTIVE
		},
		verification_status:{
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.VERIFICATION_STATUS
		},
		job_status:{
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.JOB_STATUS,
			type: DataTypes.STRING,
			//defaultValue: 4
			enum:[
				STRING_CONSTANTS.STATUS_CONSTANT.SUCCESS,
				STRING_CONSTANTS.STATUS_CONSTANT.FAILURE,
				STRING_CONSTANTS.STATUS_CONSTANT.EXEMPT,
				STRING_CONSTANTS.STATUS_CONSTANT.INCOMPLETE,
			]
			//1- success 2- failure 3 - exempt 4- incomplete
			//verified--success, excused -- failure , unexcused -- exempt
		},
		verification_note:{ // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.VERIFICATION_NOTE
		},
		verification_proof:{ // media name
			type: DataTypes.STRING,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.VERIFICATION_PROOF
		},
		verification_type:{ // imgae /video/none
			type: DataTypes.STRING,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.VERIFICATION_TYPE
		},
		aide_notes:{ // added by aide while adding verification request
			type: DataTypes.STRING,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.AIDE_NOTES
		},
		formatted_address:{ // address where ver id done
			type: DataTypes.STRING,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.FORMATTED_ADDRESS
		},
		lat:{// ver lat
			type: DataTypes.FLOAT,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.LAT
		},
		lng:{// ver lng
			type: DataTypes.FLOAT,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.LNG
		},
		is_verified:{
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.IS_VERIFIED
		},
		failed_status:{ //default is FALSE, TRUE if task failed automatically (cron) or manually
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.FAILED_STATUS
		},
		signature_image:{ //default is FALSE, TRUE if task failed automatically (cron) or manually
			type: DataTypes.STRING,
			allowNull: true,
			field:DB_CONSTANTS.VERIFICATION_REQUESTS.SIGNATURE_IMAGE
		}

	}, {
		classMethods: {
			associate: function (models) {
				verification_requests.belongsTo(models.aide_activities, {
					foreignKey: DB_CONSTANTS.VERIFICATION_REQUESTS.AIDE_ACTIVITIES
				});
				verification_requests.belongsTo(models.aide, {
					foreignKey: DB_CONSTANTS.VERIFICATION_REQUESTS.AIDE_ID
				});
				verification_requests.belongsTo(models.patients, {
					foreignKey: DB_CONSTANTS.VERIFICATION_REQUESTS.PATIENT_ID
				});
				verification_requests.belongsTo(models.schedule_activities, {
					foreignKey: DB_CONSTANTS.VERIFICATION_REQUESTS.SCHEDULED_ACTIVITY_ID
				});
				verification_requests.belongsTo(models.schedule, {
					foreignKey: DB_CONSTANTS.VERIFICATION_REQUESTS.SCHEDULED_ID
				});
			}
		},
		hooks: {
			afterCreate: function(ins, opt) {
				var obj = {};
				sequelize.models.aide_activities.findAll({
					attributes : [DB_CONSTANTS.AIDE_ACTIVITIES.DATE, DB_CONSTANTS.AIDE_ACTIVITIES.DATETIME_START, DB_CONSTANTS.AIDE_ACTIVITIES.DATETIME_END, DB_CONSTANTS.AIDE_ACTIVITIES.SCHEDULE_TYPE,DB_CONSTANTS.AIDE_ACTIVITIES.ACTIVITY_ID],
					where: {
						id: opt.instance.aide_activities,
					},
					include: [{
						model: sequelize.models.schedule_activities,
						required: true,
						attributes : [DB_CONSTANTS.SCHEDULE_ACTIVITIES.CLOCK_IN_OUT, DB_CONSTANTS.SCHEDULE_ACTIVITIES.NOTE,DB_CONSTANTS.SCHEDULE_ACTIVITIES.SCHEDULED_TIME_START_DATE, DB_CONSTANTS.SCHEDULE_ACTIVITIES.SCHEDULED_TIME_START_DATE],
						include: [{
							model: sequelize.models.admin_activities,
							required: false,
							attributes : [DB_CONSTANTS.ADMIN_ACTIVITIES.TITLE],
						}],
					},{
						model: sequelize.models.aide,
						required:  true,
						attributes : [DB_CONSTANTS.AIDE.FIRST_NAME,DB_CONSTANTS.AIDE.LAST_NAME, DB_CONSTANTS.AIDE.ID,DB_CONSTANTS.AIDE.USER_ID],
					},{
						model: sequelize.models.patients,
						required: false,
						attributes : [DB_CONSTANTS.PATIENTS.FIRST_NAME, DB_CONSTANTS.PATIENTS.LAST_NAME]
					}]
				})
					.then(function(data){
						if (data) {
							var postData = JSON.parse(JSON.stringify(data));
							var scheduleType = '';
							var taskStatus = 'performed ';
							var verificationActivity = '';
							if (opt.instance.failure || opt.instance.failed_status) {
								taskStatus = 'failed ';
							}
							if (postData[0].schedule_type){
								var stringScheduleType = postData[0].schedule_type;
								scheduleType =  stringScheduleType === 2 ? 'Clock out' : 'Clock in'
							} else {
								scheduleType =  postData[0].schedule_activity.admin_activity.title ? 'duty - '+ '"' +postData[0].schedule_activity.admin_activity.title  +'"': '';
							}
							if (opt.instance.verification_type && opt.instance.verification_type !== 'none') {
								verificationActivity = opt.instance.verification_type == 'video' ? 'Uploaded video for verification' : 'Uploaded image for verification' ;
							}
							var clockIn =  moment(postData[0].datetime_start).format('LT');
							var clockOut =  moment(postData[0].datetime_end).format('LT');
							var formattedStartDate = moment(postData[0].datetime_start).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_STRING);
							var formattedEndDate = moment(postData[0].datetime_start).format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_STRING)
							var carePlan = formattedStartDate +  " " + clockIn + " - " + formattedEndDate + " " +clockOut;
							var aideDetail = postData[0].aide.first_name + ' ' + postData[0].aide.last_name;
							obj.user_id = postData[0].aide.user_id;
							obj.is_active = opt.instance.is_active;
							obj.table_name = 'verification_requests';
							obj.type = opt.type;
							obj.date = moment().format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT);
							obj.msg = aideDetail + ' has ' + taskStatus  +  scheduleType + ' scheduled at ' + carePlan + ' ' + verificationActivity + ' in ';
							obj.aide_id = opt.instance.aide_id;
							hookController.calllog(obj);
						}
					})
			},
		}
	});
	return verification_requests;

};
