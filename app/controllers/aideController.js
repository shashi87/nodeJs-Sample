/*
 *This file contains code related to :
 *aides
 *
 */
var models = require("../models");
var bcrypt = require("bcryptjs");
var bitly = require('../services/bitly.js');
var UUID = require('uuid-js');
var mailer = require('./mailer');
var fs = require("fs");
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var allowedImageMimeTypes = CONSTANT_OBJ.MULTER_LIMITS.ALLOWED_IMAGE_MIME_TYPES;
var allowedImageMimeTypesDocs = CONSTANT_OBJ.MULTER_LIMITS.ALLOWED_IMAGE_MIME_TYPES_DOCS;
var maxAllowedSize = CONSTANT_OBJ.MULTER_LIMITS.MAX_ALLOWED_SIZE;
var twilio = require('twilio');
var cryptoService = require("../services/crypto");
var Sequelize = require('sequelize');
var im = require('imagemagick');
var request = require('request');
var moment = require('moment');
var environment = CONSTANT_OBJ.SERVER_CONSTANTS.ENVIRONMENT;
var DB_CONSTANTS = require("../constants/dbConstants.js");
var STRING_CONSTANTS = require("../constants/stringConstants.js");
/*________________________________________________________________________
 * @Date:           2 August 2016
 * @Method :        getList
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        TO SAVE AIDE DATA .
 _________________________________________________________________________
 */
var saveAide = (req, res) => {
	req.body.aide = JSON.parse(req.body.aide);
	req.body.availability = JSON.parse(req.body.availability);
	if (!req.body.aide.accountId || !req.body.aide.email) {
		let output = {
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	if (req.body.aide.email) {
		req.body.aide.email = req.body.aide.email.toLowerCase();
	}

	models.aide.findOne({
		where: Sequelize.and({
			is_active: true
		},
			Sequelize.or(

				{
					email: {
						ilike: req.body.aide.email
					},
					//user_id: req.user.id
				})
		)
	}).then(function (aideDbObj) {
		if (aideDbObj) {
			let msg = CONSTANT_OBJ.MESSAGES.AIDE_EXIST;
			if (aideDbObj.dataValues.user_id !== req.user.id) {
				msg = CONSTANT_OBJ.MESSAGES.AIDE_EXIST_ANOTHER_AGENCY;
			}
			let output = {
				msg: msg
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
		let aideObj = {
			email: req.body.aide.email,
			ssn: req.body.aide.ssn ? req.body.aide.ssn : '',
			accountId: req.body.aide.accountId ? req.body.aide.accountId : '',
			user_id: req.user.id,
			is_active: false,
			first_name: req.body.aide.first_name,
			last_name: req.body.aide.last_name
		}

		models.aide.build(aideObj)
			.save().then(function (data) {
				if (req.body.availability.length == 7) {
					addAideAvailability(req, res, data.id)
				} else {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AVAILABILITY_ERR
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				}
			}).catch(function (err) {

				let output = {
					msg: CONSTANT_OBJ.MESSAGES.AIDE_SAVE_ERROR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	}).catch(function (err) {

		let output = {
			msg: CONSTANT_OBJ.MESSAGES.AIDE_SAVE_ERROR,
			err: err
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	});
};

exports.saveAide = saveAide;

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideAvailability
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add availability data for aide
 _________________________________________________________________________
 */
var addAideAvailability = (req, res, aide_id) => {
	var i = 0;
	let availability = req.body.availability;
	let data = [];
	for (i = 0; i < availability.length; i++) {
		if (availability[i].active) {
			data.push({
				day: availability[i].day,
				status: true,
				morning: availability[i].shifts.morning,
				afternoon: availability[i].shifts.afternoon,
				evening: availability[i].shifts.evening,
				overnight: availability[i].shifts.overnight,
				aide_id: aide_id,
				is_active: true,
				user_id: req.user.id
			})
		}
	}
	if (data.length > 0) {
		models.aide_availability.bulkCreate(data)
			.then(function () {
				addAideEducation(req, res, aide_id);
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.AVAILABILITY_SAVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	} else {
		addAideEducation(req, res, aide_id);
	}
}
exports.addAideAvailability = addAideAvailability;



/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideEducation
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add education data for aide
 _________________________________________________________________________
 */
var addAideEducation = (req, res, aide_id) => {
	var data = [];
	if (req.body.aide.highSchool.name || req.body.aide.highSchool.year || req.body.aide.highSchool.city || req.body.aide.highSchool.state) {
		data.push({
			type: STRING_CONSTANTS.EDUCATION.HIGH_SCHOOL,
			aide_id: aide_id,
			school_name: req.body.aide.highSchool.name ? req.body.aide.highSchool.name : '',
			year: req.body.aide.highSchool.year ? req.body.aide.highSchool.year : undefined,
			city: req.body.aide.highSchool.city ? req.body.aide.highSchool.city : '',
			state: req.body.aide.highSchool.state ? req.body.aide.highSchool.state.state : '',
			is_active: true
		});
	}
	if (req.body.aide.college.name || req.body.aide.college.year || req.body.aide.college.city || req.body.aide.college.state) {
		data.push({
			type: STRING_CONSTANTS.EDUCATION.COLLEGE,
			aide_id: aide_id,
			school_name: req.body.aide.college.name ? req.body.aide.college.name : '',
			year: req.body.aide.college.year ? req.body.aide.college.year : undefined,
			city: req.body.aide.college.city ? req.body.aide.college.city : '',
			state: req.body.aide.college.state ? req.body.aide.college.state.state : '',
			is_active: true
		});
	}
	if (req.body.aide.vocationalSchool) {
		if (req.body.aide.vocationalSchool.name || req.body.aide.vocationalSchool.year || req.body.aide.vocationalSchool.city || req.body.aide.vocationalSchool.state) {
			data.push({
				type: STRING_CONSTANTS.EDUCATION.VOCATIONAL_SCHOOL,
				aide_id: aide_id,
				school_name: req.body.aide.vocationalSchool.name ? req.body.aide.vocationalSchool.name : '',
				year: req.body.aide.vocationalSchool.year ? req.body.aide.vocationalSchool.year : undefined,
				city: req.body.aide.vocationalSchool.city ? req.body.aide.vocationalSchool.city : '',
				state: req.body.aide.vocationalSchool.state ? req.body.aide.vocationalSchool.state.state : '',
				is_active: true
			});
		}
	}
	if (data.length > 0) {
		models.aide_education.bulkCreate(data)
			.then(function () {
				addAideDetails(req, res, aide_id);
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.EDU_SAVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	} else {
		addAideDetails(req, res, aide_id);
	}

}
exports.addAideEducation = addAideEducation;



/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideDetails
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add details of aide
 _________________________________________________________________________
 */
var addAideDetails = (req, res, aide_id) => {
	var output;
	if (!req.body.aide.first_name || !req.body.aide.last_name || !req.body.aide.dob || !req.body.aide.bI.length > 0 || !req.body.aide.address || !req.body.aide.city || !req.body.aide.state || !req.body.aide.zip || !req.body.aide.gender /*|| !req.body.aide.hourly_wage*/) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.MISSING_INFO
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	var data = {
		user_id: req.user.id,
		aide_id: aide_id,
		driving_licence_no: req.body.aide.driving_licence_no ? req.body.aide.driving_licence_no : '',
		license_issued_at: req.body.aide.license_issued_at ? req.body.aide.license_issued_at : '',
		dob: req.body.aide.dob,
		phNo: JSON.stringify(req.body.aide.bI),
		suiteNumber: req.body.aide.suiteNumber ? req.body.aide.suiteNumber : '',
		address: req.body.aide.address,
		city: req.body.aide.city,
		state: req.body.aide.state,
		zip: req.body.aide.zip,
		country: req.body.aide.country,
		pic: req.body.aide.pic,
		lat: req.body.aide.lat,
		lng: req.body.aide.lng,
		allow_drug_test: req.body.aide.allow_drug_test ? true : false,
		gender: req.body.aide.gender,
		//hourly_wage: req.body.aide.hourly_wage,
		ethnicity: req.body.aide.ethnicity ? req.body.aide.ethnicity : '',
		additional_offering: req.body.aide.additional_offering ? req.body.aide.additional_offering : '',
		religious_affiliation: req.body.aide.religious_affiliation ? req.body.aide.religious_affiliation : ''
	}
	if (req.body.aide.schedule_type) {
		data.schedule_type = req.body.aide.schedule_type;
	}
	if (req.body.aide.type) {
		data.type = req.body.aide.type;
	}
	if (req.body.aide.hrs_week) {
		data.hrs_week = req.body.aide.hrs_week;
	}
	if (req.body.aide.vaccine.length > 0) {
		data.vaccine = JSON.stringify(req.body.aide.vaccine);
	}
	if (req.body.aide.hobbies) {
		data.hobbies = req.body.aide.hobbies;
	}
	if (req.body.aide.total_work_exp || req.body.aide.total_work_exp == 0) {
		data.total_work_exp = req.body.aide.total_work_exp;
	}
	if (req.body.aide.description) {
		data.description = req.body.aide.description;
	}
	if (!req.files[0]) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.PTNT_IMG_ERR
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).djson({
			data: output
		});
	} else {
		if (allowedImageMimeTypes.indexOf(req.files[0].mimetype) == -1) {
			fs.unlink(req.files[0].path, function () { });
			output = {
				msg: CONSTANT_OBJ.MESSAGES.PTNT_IMG_ERR
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
		if (req.files[0].size > maxAllowedSize) {
			fs.unlink(req.files[0].path, function () { });
			output = {
				msg: CONSTANT_OBJ.MESSAGES.IMG_SIZE_ERR
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
	}
	var srcPath = path.resolve(__dirname + STRING_CONSTANTS.MEDIA_URL.PUBLIC_URL + req.files[0].filename);
	var destPath = path.resolve(__dirname + STRING_CONSTANTS.MEDIA_URL.PUBLIC_IMAGE_URL + req.files[0].filename);
	try {
		im.crop({
			srcPath: srcPath,
			dstPath: destPath,
			width: 100,
			height: 100,
			quality: 1,
			gravity: STRING_CONSTANTS.MISC_CONSTANTS.CROP_GRAVITY
		}, function (err) {
			if (err) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.IMG_CROP_ERR,
					err: err
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({ data: output });
			} else {
				data.pic = req.files[0].filename;
				addAideDocs(req, res, aide_id);
				models.aide_details.build(data)
					.save().then(function () {
						if (req.body.aide.languages.length > 0) {
							addAideLanguages(req, res, aide_id);
						} else if (req.body.aide.services.length > 0) {
							addAideServices(req, res, aide_id);
						} else if (req.body.aide.skills.length > 0) {
							addAideSkills(req, res, aide_id);
						} else if (req.body.aide.daily_activities.length > 0) {
							addAideDailyActivity(req, res, aide_id);
						} else if (req.body.aide.experience.length > 0) {
							addAideExperience(req, res, aide_id);
						} else if (req.body.aide.bgCheck.length > 0) {
							addAideBGcheck(req, res, aide_id);
						} else if (req.body.emergencyContacts.length > 0) {
							addAideEC(req, res, aide_id)
						} else {
							enableAideSuccessSave(req, res, aide_id);
						}
					})
					.catch(function (err) {
						let output = {
							msg: CONSTANT_OBJ.MESSAGES.AIDE_DETAIL_SAVE_ERR
						}
						output = cryptoService.encrypt(JSON.stringify(output));
						return res.status(400).json({
							data: output
						});
					})
			}

		});
	} catch (e) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.IMG_CROP_ERR,
			err: e
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({ data: output });
	}
};
exports.addAideDetails = addAideDetails;

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        nextForLanguage
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To determine next step to perform after adding language for aide
 _________________________________________________________________________
 */
var nextForLanguage = (req, res, aide_id) => {
	if (req.body.aide.services.length > 0) {
		addAideServices(req, res, aide_id);
	} else if (req.body.aide.skills.length > 0) {
		addAideSkills(req, res, aide_id);
	} else if (req.body.aide.daily_activities.length > 0) {
		addAideDailyActivity(req, res, aide_id);
	} else if (req.body.aide.experience.length > 0) {
		addAideExperience(req, res, aide_id);
	} else if (req.body.aide.bgCheck.length > 0) {
		addAideBGcheck(req, res, aide_id);
	} else if (req.body.emergencyContacts.length > 0) {
		addAideEC(req, res, aide_id)
	} else {
		enableAideSuccessSave(req, res, aide_id);
	}
}

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideLanguages
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add languages for aide
 _________________________________________________________________________
 */
var addAideLanguages = (req, res, aide_id) => {
	if (req.body.aide.languages.length > 0) {
		let data = [],
			i = 0;
		for (i = 0; i < req.body.aide.languages.length; i++) {
			let temp = {};
			temp.aide_id = aide_id;
			temp.language_id = req.body.aide.languages[i].id;
			temp.language = req.body.aide.languages[i].title;
			temp.is_active = true;
			data.push(temp)
		}
		if (data.length > 0) {
			models.aide_languages.bulkCreate(data)
				.then(function () {
					nextForLanguage(req, res, aide_id);
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.LANG_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			nextForLanguage(req, res, aide_id);
		}
	} else {
		nextForLanguage(req, res, aide_id);
	}
};
exports.addAideLanguages = addAideLanguages;

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        nextForServices
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To determine next step to perform after adding Services for aide
 _________________________________________________________________________
 */
var nextForServices = (req, res, aide_id) => {
	if (req.body.aide.skills.length > 0) {
		addAideSkills(req, res, aide_id);
	} else if (req.body.aide.daily_activities.length > 0) {
		addAideDailyActivity(req, res, aide_id);
	} else if (req.body.aide.experience.length > 0) {
		addAideExperience(req, res, aide_id);
	} else if (req.body.aide.bgCheck.length > 0) {
		addAideBGcheck(req, res, aide_id);
	} else if (req.body.emergencyContacts.length > 0) {
		addAideEC(req, res, aide_id)
	} else {
		enableAideSuccessSave(req, res, aide_id);
	}
}

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideServices
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add services for aide
 _________________________________________________________________________
 */
var addAideServices = (req, res, aide_id) => {
	if (req.body.aide.services.length > 0) {
		var data = [],
			i = 0;
		for (i = 0; i < req.body.aide.services.length; i++) {
			var temp = {};
			temp.aide_id = aide_id;
			temp.title = req.body.aide.services[i].licence.title;
			temp.licence_id = req.body.aide.services[i].licence.id;
			temp.license_issued_by = req.body.aide.services[i].license_issued_by;
			temp.license_no = req.body.aide.services[i].license_no;
			temp.date_licence_issued = req.body.aide.services[i].date_licence_issued;
			temp.is_active = true;
			temp.user_id = req.user.id;
			temp.licence_other = req.body.aide.services[i].licence_other;
			data.push(temp)
		}
		if (data.length > 0) {
			models.aide_services.bulkCreate(data)
				.then(function () {
					nextForServices(req, res, aide_id);
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.SERVICE_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			nextForServices(req, res, aide_id);
		}
	} else {
		nextForServices(req, res, aide_id)
	}
}
exports.addAideServices = addAideServices;

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        nextForSkills
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To determine next step to perform after adding skills for aide
 _________________________________________________________________________
 */
var nextForSkills = (req, res, aide_id) => {
	if (req.body.aide.daily_activities.length > 0) {
		addAideDailyActivity(req, res, aide_id);
	} else if (req.body.aide.experience.length > 0) {
		addAideExperience(req, res, aide_id);
	} else if (req.body.aide.bgCheck.length > 0) {
		addAideBGcheck(req, res, aide_id);
	} else if (req.body.emergencyContacts.length > 0) {
		addAideEC(req, res, aide_id)
	} else {
		enableAideSuccessSave(req, res, aide_id);
	}
}

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideSkills
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add skills for aide
 _________________________________________________________________________
 */
var addAideSkills = (req, res, aide_id) => {
	if (req.body.aide.skills.length > 0) {
		var data = [],
			i = 0;
		for (i = 0; i < req.body.aide.skills.length; i++) {
			var temp = {};
			temp.aide_id = aide_id;
			temp.title = req.body.aide.skills[i].condition;
			temp.skill_id = req.body.aide.skills[i].id;
			temp.is_active = true;
			temp.user_id = req.user.id;
			data.push(temp)
		}
		if (data.length > 0) {
			models.aide_skills.bulkCreate(data)
				.then(function () {
					nextForSkills(req, res, aide_id);
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.SKILL_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			nextForSkills(req, res, aide_id);
		}
	} else {
		nextForSkills(req, res, aide_id)
	}
}
exports.addAideSkills = addAideSkills;

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        nextForDailyActivity
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To determine next step to perform after adding daily activities for aide
 _________________________________________________________________________
 */
var nextForDailyActivity = (req, res, aide_id) => {
	if (req.body.aide.experience.length > 0) {
		addAideExperience(req, res, aide_id);
	} else if (req.body.aide.bgCheck.length > 0) {
		addAideBGcheck(req, res, aide_id);
	} else if (req.body.emergencyContacts.length > 0) {
		addAideEC(req, res, aide_id)
	} else {
		enableAideSuccessSave(req, res, aide_id);
	}
}

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideDailyActivity
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add DailyActivity  for aide
 _________________________________________________________________________
 */
var addAideDailyActivity = (req, res, aide_id) => {
	if (req.body.aide.daily_activities.length > 0) {
		var data = [],
			i = 0;
		for (i = 0; i < req.body.aide.daily_activities.length; i++) {
			var temp = {};
			temp.aide_id = aide_id;
			temp.title = req.body.aide.daily_activities[i].title;
			temp.activity_id = req.body.aide.daily_activities[i].id;
			temp.is_active = true;
			temp.user_id = req.user.id;
			data.push(temp)
		}
		if (data.length > 0) {
			models.aide_daily_activities.bulkCreate(data)
				.then(function () {
					nextForDailyActivity(req, res, aide_id);
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.DAILY_ACTIVITIES_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			nextForDailyActivity(req, res, aide_id);
		}
	} else {
		nextForDailyActivity(req, res, aide_id)
	}
}
exports.addAideDailyActivity = addAideDailyActivity;

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        nextForExp
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To determine next step to perform after adding experience for aide
 _________________________________________________________________________
 */
var nextForExp = (req, res, aide_id) => {
	if (req.body.aide.bgCheck.length > 0) {
		addAideBGcheck(req, res, aide_id);
	} else if (req.body.emergencyContacts.length > 0) {
		addAideEC(req, res, aide_id)
	} else {
		enableAideSuccessSave(req, res, aide_id);
	}
}

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideExperience
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add Experience for aide
 _________________________________________________________________________
 */
var addAideExperience = (req, res, aide_id) => {
	if (req.body.aide.experience.length > 0) {
		var data = [],
			i = 0;
		for (i = 0; i < req.body.aide.experience.length; i++) {
			var temp = req.body.aide.experience[i];
			temp.aide_id = aide_id;
			temp.is_active = true;
			data.push(temp);
		}
		if (data.length > 0) {
			models.aide_experience.bulkCreate(data)
				.then(function () {
					nextForExp(req, res, aide_id);
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_EXP_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			nextForExp(req, res, aide_id);
		}
	} else {
		nextForExp(req, res, aide_id)
	}
}
exports.addAideExperience = addAideExperience;

var nextForBGcheck = (req, res, aide_id) => {
	if (req.body.emergencyContacts.length > 0) {
		addAideEC(req, res, aide_id)
	} else {
		enableAideSuccessSave(req, res, aide_id);
	}
}
/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideBGcheck
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add background checks for aide
 _________________________________________________________________________
 */
var addAideBGcheck = (req, res, aide_id) => {
	if (req.body.aide.bgCheck.length > 0) {
		var data = [],
			i = 0;
		for (i = 0; i < req.body.aide.bgCheck.length; i++) {
			var temp = {};
			temp.aide_id = aide_id;
			temp.title = req.body.aide.bgCheck[i].title;
			temp.check_id = req.body.aide.bgCheck[i].id;
			temp.is_active = true;
			data.push(temp);
		}
		if (data.length > 0) {
			models.aide_background_checks.bulkCreate(data)
				.then(function () {
					nextForBGcheck(req, res, aide_id);
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_BG_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			nextForBGcheck(req, res, aide_id);
		}
	} else {
		nextForBGcheck(req, res, aide_id)
	}
}
exports.addAideBGcheck = addAideBGcheck;

/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideBGcheck
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To add background checks for aide
 _________________________________________________________________________
 */
var addAideEC = (req, res, aide_id) => {
	if (req.body.emergencyContacts.length > 0) {
		var contacts = req.body.emergencyContacts;
		var t = JSON.parse(contacts);
		t.map(function (obj) {
			obj.user_id = req.user.id;
			obj.aide_id = aide_id;
			if (obj.email) {
				obj.email = obj.email.toLowerCase();
			}
			obj.phNo = JSON.stringify(obj.ph_arr);
		})
		if (t.length > 0) {
			models.aide_emergency_contacts.bulkCreate(t)
				.then(function () {
					enableAideSuccessSave(req, res, aide_id);
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_EC_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			enableAideSuccessSave(req, res, aide_id);
		}
	} else {
		enableAideSuccessSave(req, res, aide_id)
	}
}
exports.addAideBGcheck = addAideBGcheck;
/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        addAideBGcheck
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To enable aide after successfully storing all aide informaion
 _________________________________________________________________________
 */
var enableAideSuccessSave = (req, res, aide_id) => {
	if (aide_id) {
		var token = UUID.create().toString();
		models.aide.update({
			is_active: true,
			token: token
		}, {
				where: {
					id: aide_id,
					user_id: req.user.id
				}
			})
			.then(function () {
				sendInvitation(req, res, aide_id, token);
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_ACTIVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	}
}
exports.enableAideSuccessSave = enableAideSuccessSave;



/*________________________________________________________________________
 * @Date:           30 August 2016
 * @Method :        sendInvitation
 * Created By:      smartData Enterprises Ltd
 * Modified On:     - 22 June By Hussain
 * @Purpose:        To invite aide after successfully storing all aide informaion
 _________________________________________________________________________
 */
var sendInvitation = (req, res, aide_id, token) => {
	if (environment == 'live') {
		let branchKey = CONSTANT_OBJ.API_KEY.AIDE_APP_BRANCH_KEY;
		let headers = {
			'Content-Type': 'application/json'
		}
		let postData = {
			branch_key: branchKey,
			data: {
				custom_object: {
					token: token,
					info: '1',
					createdDate: moment().format('x')
				}
			}
		};
		let options = {
			url: STRING_CONSTANTS.MISC_CONSTANTS.BRANCH_API_URL,
			method: 'POST',
			headers: headers,
			form: JSON.stringify(postData)
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				let obj = JSON.parse(body);
				let link = obj.url;
				sendAideInvitationEmail(req, res, aide_id, token, link);
			} else {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.BITLY_ERR,
					err: error
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			}
		})
	} else {
		let url = CONSTANT_OBJ.URLS.BASE_URL + STRING_CONSTANTS.ROUTES_CONSTANTS.AIDE_INVITE + token;
		bitly.shortner(url, function (err, sUrl) {
			if (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.BITLY_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			} else {
				let link = sUrl;
				sendAideInvitationEmail(req, res, aide_id, token, link)
			}
		});
	}

}
exports.sendInvitation = sendInvitation;

var resendInvite = (req, res) => {
	if (!req.body.aide_id) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	var token = UUID.create().toString();
	models.aide.update({
		is_active: true,
		createdAt: new Date(),
		token: token
	}, {
			where: {
				id: req.body.aide_id,
				user_id: req.user.id
			}
		})
		.then(function () {
			models.aide.findAll({
				where: {
					id: req.body.aide_id
				}
			}, {
					raw: true
				})
				.then(function (aide) {
					req.body.aide = aide[0]
					sendInvitation(req, res, req.body.aide_id, token);
				})
		})
		.catch(function (err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_ACTIVE_ERR,
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.resendInvite = resendInvite;
/*________________________________________________________________________
 * @Date:           31 August 2016
 * @Method :        sendMessage
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To send message to Aide after successfully sending invitation email.
 _________________________________________________________________________
 */

var sendMessage = (phone, message, callback) => {
	let client = new twilio.RestClient(CONSTANT_OBJ.TWILIO.ACCOUNTS_ID, CONSTANT_OBJ.twilio.authToken);
	client.messages.create({
		to: phone,
		from: CONSTANT_OBJ.twilio.twilio_number,
		body: message

	}, function (err, response) {

		if (err || !response) {
			return callback(err);
		}
		return callback(null, response);
	});
}
exports.sendMessage = sendMessage;


/*________________________________________________________________________
 * @Date:           2 August 2016
 * @Method :        getList
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To fetch Aide list.
 _________________________________________________________________________
 */
var getList = (req, res) => {

	var pageSize = req.query.per_page || 20;
	var page = req.query.page || 1;
	var offset = (page - 1) * pageSize;
	var searchStr = req.query.search;

	var sFname = searchStr;
	var sLname = searchStr;
	if (searchStr && searchStr != null && searchStr.indexOf(" ") > 1) {
		var sname = searchStr.split(" ");
		sFname = sname[0];
		sLname = sname[1];
	}

	var query = {};
	if (searchStr) {
		query = Sequelize.and({
			user_id: req.user.id
		}, {
				is_active: true
			},
			Sequelize.or({
				first_name: {
					ilike: '%' + sFname + '%'
				}
			}, {
					last_name: {
						ilike: '%' + sLname + '%'
					}
				})
		)
	} else {
		query = {
			user_id: req.user.id,
			is_active: true
		};
	}
	//TODO : - handle search param
	models.aide
		.findAndCountAll({
			where: query,
			offset: offset,
			limit: pageSize,
			include: [{
				model: models.aide_passwords,
				required: false
			}],
			order: [
				[DB_CONSTANTS.AIDE.CREATED_AT, STRING_CONSTANTS.SORT_ORDER.DESC]
			]
		})
		.then(function (result) {
			var output = {
				data: {
					rows: result.rows,
					count: result.count
				}
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		});
}
exports.getList = getList;



/*________________________________________________________________________
 * @Date:           8 Aug 2016
 * @Method :        updateImage
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To update profile pic of Aide
 _________________________________________________________________________
 */
var updateImage = (req, res) => {
	var output;
	if (!req.file || !req.body.id) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFO_AIDE
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	} else {
		if (allowedImageMimeTypes.indexOf(req.file.mimetype) == -1) {
			fs.unlink(req.file.path, function () { });
			output = {
				msg: CONSTANT_OBJ.MESSAGES.INVALID_IMG
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});

		}
		if (req.file.size > maxAllowedSize) {
			fs.unlink(req.file.path, function () { });
			output = {
				msg: CONSTANT_OBJ.MESSAGES.IMG_SIZE_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
	}
	var fields = {
		aide_pic: req.file.filename
	};
	var srcPath = path.resolve(__dirname + STRING_CONSTANTS.MEDIA_URL.PUBLIC_URL + req.file.filename);
	var destPath = path.resolve(__dirname + STRING_CONSTANTS.MEDIA_URL.PUBLIC_IMAGE_URL + req.file.filename);
	try {
		im.crop({
			srcPath: srcPath,
			dstPath: destPath,
			width: 100,
			height: 100,
			quality: 1,
			gravity: STRING_CONSTANTS.MISC_CONSTANTS.CROP_GRAVITY
		}, function (err) {
			if (err) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.IMG_CROP_ERR,
					err: err
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({ data: output });
			} else {
				models.aide.update(
					fields, {
						where: {
							id: req.body.id,
							user_id: req.user.id
						}
					}
				).then(function () {
					let output = {
						pic: req.file.filename
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(200).json({
						data: output
					});
				}).catch(function (error) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.SEQUALIZE_ERR,
						err: error
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
			}
		});
	} catch (e) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.IMG_CROP_ERR,
			err: e
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({ data: output });
	}
}
exports.updateImage = updateImage;

/*________________________________________________________________________
 * @Date:           8 Aug 2016
 * @Method :        getOneAide
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To fetch single Aide  detail
 _________________________________________________________________________
 */
var getOneAide = function (req, res, next) {
	var output;
	if (!req.body.id) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	try {
		req.body.id = parseInt(req.body.id);
	} catch (err) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.INVALID_AIDE_ID
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	models.aide.findOne({
		where: {
			user_id: req.user.id,
			id: req.body.id,
			is_active: true
		},
		include: [{
			separate: true,
			model: models.aide_details,
		}, {
			separate: true,
			model: models.aide_availability,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_background_checks,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_daily_activities,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_education,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_experience,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_languages,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_services,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_skills,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_emergency_contacts,
			where: {
				is_active: true
			},
			required: false,
		}, {
			separate: true,
			model: models.aide_docs,
			where: {
				is_active: true
			},
			required: false,
		}]
	})
		.then(function (data) {
			let output = {
				aide: data
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});

		})
		.catch(function (error) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.GET_AIDE_DATA_ERR,
				err: error
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});
}
exports.getOneAide = getOneAide;

/*________________________________________________________________________
 * @Date:           8 Aug 2016
 * @Method :        updateAide
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To update Aide  detail
 _________________________________________________________________________
 */
var updateAide = function (req, res, next) {
	var output;
	req.body.aide = JSON.parse(req.body.aide);
	req.body.availability = JSON.parse(req.body.availability);
	req.body.mode = 'edit';
	if (!req.body.aide || !req.body.availability) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	if (!req.body.aide.accountId || !req.body.aide.email || !req.body.aide.id) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.VALID_INFORMATION
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	var checkSsn = Sequelize.or({
		accountId: req.body.aide.accountId
	}, {
			email: {
				ilike: req.body.aide.email
			}
		})
	models.aide.findOne({
		where: Sequelize.and(checkSsn, {
			is_active: true
		}, {
				user_id: req.user.id
			}, {
				id: {
					ne: req.body.aide.id
				}
			})
	})
		.then(function (ssnExist) {
			if (!ssnExist) {
				var query = {
					is_active: true,
					user_id: req.user.id,
					id: req.body.aide.id
				}
				models.aide.findOne({
					where: query
				}).then(function (aideDbObj) {
					if (!aideDbObj) {
						var output = {
							msg: CONSTANT_OBJ.MESSAGES.INVALID_AIDE_DETAIL
						}
						output = cryptoService.encrypt(JSON.stringify(output));
						return res.status(400).json({
							data: output
						});
					}
					var aideObj = {
						first_name: req.body.aide.first_name,
						last_name: req.body.aide.last_name
					}

					models.aide.update(aideObj, {
						where: query
					})
						.then(function () {
							if (req.body.availability.length == 7) {
								updateAideAvailability(req, res, 0)

							} else {
								var output = {
									msg: CONSTANT_OBJ.MESSAGES.AVAILABILITY_ERR
								}
								output = cryptoService.encrypt(JSON.stringify(output));
								return res.status(400).json({
									data: output
								});
							}
						});
				});
			} else {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.DUP_SSN_EMAIL
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			}
		}).catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.DUP_SSN_EMAIL
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})

}
exports.updateAide = updateAide


var updateAideAvailability = function (req, res, i) {
	var adddata = {};
	var updateQuery = {};
	var availability = req.body.availability;
	if (availability[i].id) {
		updateQuery = {
			id: availability[i].id,
			aide_id: req.body.aide.id
		};
		if (!availability[i].active) {
			models.aide_availability.update({
				is_active: false,
				status: false
			}, {
					where: updateQuery
				})
				.then(function () {
					if (i + 1 < availability.length) {
						updateAideAvailability(req, res, i + 1);
					} else {
						updateAideEducation(req, res);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AVAILABILITY_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			let temp = {
				day: availability[i].day,
				status: true,
				morning: availability[i].shifts.morning,
				afternoon: availability[i].shifts.afternoon,
				evening: availability[i].shifts.evening,
				overnight: availability[i].shifts.overnight,
				is_active: true,
				user_id: req.user.id
			}
			models.aide_availability.update(temp, {
				where: updateQuery
			})
				.then(function () {
					if (i + 1 < availability.length) {
						updateAideAvailability(req, res, i + 1);
					} else {
						updateAideEducation(req, res);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AVAILABILITY_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		}
	} else if (availability[i].active) {
		adddata = {
			day: availability[i].day,
			status: true,
			morning: availability[i].shifts.morning,
			afternoon: availability[i].shifts.afternoon,
			evening: availability[i].shifts.evening,
			overnight: availability[i].shifts.overnight,
			aide_id: req.body.aide.id,
			is_active: true,
			user_id: req.user.id
		}
		models.aide_availability.build(adddata).save()
			.then(function () {
				if (i + 1 < availability.length) {
					updateAideAvailability(req, res, i + 1);
				} else {
					updateAideEducation(req, res);
				}
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.AVAILABILITY_SAVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	} else {
		if (i + 1 < availability.length) {
			updateAideAvailability(req, res, i + 1);
		} else {
			updateAideEducation(req, res);
		}
	}
}
exports.updateAideAvailability = updateAideAvailability;

var updateEduData = function (req, res, data, i) {
	if (data[i].id) {
		models.aide_education.update(data[i], {
			where: {
				id: data[i].id
			}
		})
			.then(function () {
				if (i + 1 < data.length) {
					updateEduData(req, res, data, i + 1)
				} else {
					updateAideDetails(req, res);
				}
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.EDU_SAVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	} else {
		//add case
		models.aide_education.build(data[i]).save()
			.then(function () {
				if (i + 1 < data.length) {
					updateEduData(req, res, data, i + 1)
				} else {
					updateAideDetails(req, res);
				}
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.EDU_SAVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	}
}

var updateAideEducation = (req, res) => {
	var data = [];
	var temp = {};
	if (req.body.aide.highSchool.name || req.body.aide.highSchool.id || req.body.aide.highSchool.year || req.body.aide.highSchool.city || req.body.aide.highSchool.state) {
		temp = {
			type: STRING_CONSTANTS.EDUCATION.HIGH_SCHOOL,
			aide_id: req.body.aide.id,
			school_name: req.body.aide.highSchool.name ? req.body.aide.highSchool.name : '',
			year: req.body.aide.highSchool.year ? req.body.aide.highSchool.year : null,
			city: req.body.aide.highSchool.city ? req.body.aide.highSchool.city : '',
			state: req.body.aide.highSchool.state ? req.body.aide.highSchool.state.state : '',
			is_active: true,
			id: req.body.aide.highSchool.id ? req.body.aide.highSchool.id : '',
		}
		data.push(temp);
	}
	if (req.body.aide.college.name || req.body.aide.college.year || req.body.aide.college.city || req.body.aide.college.state || req.body.aide.college.id) {
		temp = {
			type: STRING_CONSTANTS.EDUCATION.COLLEGE,
			aide_id: req.body.aide.id,
			school_name: req.body.aide.college.name ? req.body.aide.college.name : '',
			year: req.body.aide.college.year ? req.body.aide.college.year : null,
			city: req.body.aide.college.city ? req.body.aide.college.city : '',
			state: req.body.aide.college.state ? req.body.aide.college.state.state : '',
			is_active: true,
			id: req.body.aide.college.id ? req.body.aide.college.id : '',
		}
		data.push(temp);
	}
	if (req.body.aide.vocationalSchool.name || req.body.aide.vocationalSchool.year || req.body.aide.vocationalSchool.city || req.body.aide.vocationalSchool.state || req.body.aide.vocationalSchool.id) {
		temp = {
			type: STRING_CONSTANTS.EDUCATION.VOCATIONAL_SCHOOL,
			aide_id: req.body.aide.id,
			school_name: req.body.aide.vocationalSchool.name ? req.body.aide.vocationalSchool.name : '',
			year: req.body.aide.vocationalSchool.year ? req.body.aide.vocationalSchool.year : null,
			city: req.body.aide.vocationalSchool.city ? req.body.aide.vocationalSchool.city : '',
			state: req.body.aide.vocationalSchool.state ? req.body.aide.vocationalSchool.state.state : '',
			is_active: true,
			id: req.body.aide.vocationalSchool.id ? req.body.aide.vocationalSchool.id : '',
		}
		data.push(temp);
	}
	if (data.length > 0) {
		updateEduData(req, res, data, 0);
	} else {
		updateAideDetails(req, res)
	}
}
exports.updateAideEducation = updateAideEducation;

var updateAideDetails = (req, res) => {
	var output;
	if (!req.body.aide.first_name || !req.body.aide.last_name || !req.body.aide.dob || !req.body.aide.bI.length > 0 || !req.body.aide.address || !req.body.aide.city || !req.body.aide.state || !req.body.aide.zip || !req.body.aide.gender /*|| !req.body.aide.hourly_wage*/) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.MISSING_INFO
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	var data = {
		phNo: JSON.stringify(req.body.aide.bI),
		suiteNumber: req.body.aide.suiteNumber,
		address: req.body.aide.address,
		city: req.body.aide.city,
		driving_licence_no: req.body.aide.driving_licence_no,
		license_issued_at: req.body.aide.license_issued_at ? req.body.aide.license_issued_at : '',
		dob: req.body.aide.dob,
		state: req.body.aide.state,
		zip: req.body.aide.zip,
		country: req.body.aide.country,
		lat: req.body.aide.lat,
		lng: req.body.aide.lng,
		allow_drug_test: req.body.aide.allow_drug_test ? true : false,
		gender: req.body.aide.gender,
		//hourly_wage: req.body.aide.hourly_wage,
		ethnicity: req.body.aide.ethnicity ? req.body.aide.ethnicity : '',
		additional_offering: req.body.aide.additional_offering ? req.body.aide.additional_offering : '',
		religious_affiliation: req.body.aide.religious_affiliation ? req.body.aide.religious_affiliation : ''

	}
	if (req.body.aide.schedule_type) {
		data.schedule_type = req.body.aide.schedule_type;
	}
	if (req.body.aide.type) {
		data.type = req.body.aide.type;
	}

	if (req.body.aide.hrs_week) {
		data.hrs_week = req.body.aide.hrs_week;
	}

	if (req.body.aide.vaccine.length > 0) {
		data.vaccine = JSON.stringify(req.body.aide.vaccine);
	} else {
		data.vaccine = '';
	}

	if (req.body.aide.hobbies) {
		data.hobbies = req.body.aide.hobbies;
	}
	if (req.body.aide.total_work_exp || req.body.aide.total_work_exp == 0) {
		data.total_work_exp = req.body.aide.total_work_exp;
	}
	if (req.body.aide.description) {
		data.description = req.body.aide.description;
	}
	if (req.file) {
		if (allowedImageMimeTypes.indexOf(req.file.mimetype) == -1) {
			// UNLINK UPLOADED IMAGE AND SEND THE ERROR RESPONSE FROM HERE
			fs.unlink(req.file.path, function () { });
			output = {
				msg: CONSTANT_OBJ.MESSAGES.INVALID_IMG
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
		if (req.file.size > maxAllowedSize) {
			output = {
				msg: CONSTANT_OBJ.MESSAGES.IMG_SIZE_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
		data.pic = req.file.filename;
	}
	if (data.pic) {
		var srcPath = path.resolve(__dirname + STRING_CONSTANTS.MEDIA_URL.PUBLIC_URL + req.file.filename);
		var destPath = path.resolve(__dirname + STRING_CONSTANTS.MEDIA_URL.PUBLIC_IMAGE_URL + req.file.filename);
		try {
			im.crop({
				srcPath: srcPath,
				dstPath: destPath,
				width: 100,
				height: 100,
				quality: 1,
				gravity: STRING_CONSTANTS.MISC_CONSTANTS.CROP_GRAVITY
			}, function (err) {
				if (err) {
					var output = {
						msg: CONSTANT_OBJ.MESSAGES.IMG_CROP_ERR,
						err: err
					};
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({ data: output });
				} else {
					models.aide_details.update(data, {
						where: {
							aide_id: req.body.aide.id
						}
					})
						.then(function () {
							updateAideLanguages(req, res, 0);
						})
						.catch(function (err) {
							var output = {
								msg: CONSTANT_OBJ.MESSAGES.AIDE_DETAIL_SAVE_ERR
							}
							output = cryptoService.encrypt(JSON.stringify(output));
							return res.status(400).json({
								data: output
							});
						})
				}

			});
		} catch (e) {
			output = {
				msg: CONSTANT_OBJ.MESSAGES.IMG_CROP_ERR,
				err: e
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({ data: output });
		}
	} else {
		models.aide_details.update(data, {
			where: {
				aide_id: req.body.aide.id
			}
		})
			.then(function () {
				updateAideLanguages(req, res, 0);
			})
			.catch(function (err) {
				let output = {
					msg: CONSTANT_OBJ.MESSAGES.AIDE_DETAIL_SAVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	}

};
exports.updateAideDetails = updateAideDetails;

var updateAideLanguages = function (req, res, i) {
	if (req.body.aide.languages.length > 0) {
		var temp = {};

		if (req.body.aide.languages[i].aide_id) {
			temp = req.body.aide.languages[i];
			models.aide_languages.update(temp, {
				where: {
					id: req.body.aide.languages[i].id
				}
			})
				.then(function () {
					if (i + 1 < req.body.aide.languages.length) {
						updateAideLanguages(req, res, i + 1);
					} else {
						updateAideServices(req, res, 0);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.LANG_SAVE_ERR
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		} else {
			temp.aide_id = req.body.aide.id;
			temp.language_id = req.body.aide.languages[i].id;
			temp.language = req.body.aide.languages[i].title;
			temp.is_active = true;
			models.aide_languages.build(temp).save()
				.then(function () {
					if (i + 1 < req.body.aide.languages.length) {
						updateAideLanguages(req, res, i + 1);
					} else {
						updateAideServices(req, res, 0);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.LANG_SAVE_ERR
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		}

	} else {
		updateAideServices(req, res, 0);
	}
};
exports.updateAideLanguages = updateAideLanguages;


var updateAideServices = function (req, res, i) {
	if (req.body.aide.services.length > 0) {
		var temp = {};

		if (req.body.aide.services[i].id) {
			temp = req.body.aide.services[i];

			models.aide_services.update(temp, {
				where: {
					id: req.body.aide.services[i].id
				}
			})
				.then(function () {
					if (i + 1 < req.body.aide.services.length) {
						updateAideServices(req, res, i + 1);
					} else {
						commonFuncToRemovePreviousCheckboxValues('aide_skills', req.body.aide.id, function (finalRes) {
							updateAideSkills(req, res, 0);
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.SERVICE_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		} else {
			temp.aide_id = req.body.aide.id;
			temp.title = req.body.aide.services[i].licence.title;
			temp.licence_id = req.body.aide.services[i].licence.id;
			temp.date_licence_issued = req.body.aide.services[i].date_licence_issued;
			temp.license_issued_by = req.body.aide.services[i].license_issued_by;
			temp.license_no = req.body.aide.services[i].license_no;
			temp.user_id = req.user.id;
			temp.is_active = true;
			temp.licence_other = req.body.aide.services[i].licence_other;
			models.aide_services.build(temp).save()
				.then(function () {
					if (i + 1 < req.body.aide.services.length) {
						updateAideServices(req, res, i + 1);
					} else {
						commonFuncToRemovePreviousCheckboxValues('aide_skills', req.body.aide.id, function (finalRes) {
							updateAideSkills(req, res, 0);
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.SERVICE_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		}

	} else {
		commonFuncToRemovePreviousCheckboxValues('aide_skills', req.body.aide.id, function (finalRes) {
			updateAideSkills(req, res, 0);
		});
	}
}
exports.updateAideServices = updateAideServices;


var updateAideSkills = function (req, res, i) {
	if (req.body.aide.skills.length > 0) {
		var temp = {};

		if (req.body.aide.skills[i].aide_id) {
			temp = req.body.aide.skills[i];
			models.aide_skills.update(temp, {
				where: {
					id: req.body.aide.skills[i].id
				}
			})
				.then(function () {
					if (i + 1 < req.body.aide.skills.length) {
						updateAideSkills(req, res, i + 1);
					} else {
						commonFuncToRemovePreviousCheckboxValues('aide_daily_activities', req.body.aide.id, function (finalRes) {
							updateAideDailyActivity(req, res, 0);
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.SKILL_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		} else {
			temp.aide_id = req.body.aide.id;
			temp.title = req.body.aide.skills[i].condition;
			temp.skill_id = req.body.aide.skills[i].id;
			temp.is_active = true;
			temp.user_id = req.user.id;
			models.aide_skills.build(temp).save()
				.then(function () {
					if (i + 1 < req.body.aide.skills.length) {
						updateAideSkills(req, res, i + 1);
					} else {
						commonFuncToRemovePreviousCheckboxValues('aide_daily_activities', req.body.aide.id, function (finalRes) {
							updateAideDailyActivity(req, res, 0);
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.SKILL_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		}

	} else {
		commonFuncToRemovePreviousCheckboxValues('aide_daily_activities', req.body.aide.id, function (finalRes) {
			updateAideDailyActivity(req, res, 0);
		});
	}
}
exports.updateAideSkills = updateAideSkills;

var commonFuncToRemovePreviousCheckboxValues = function (table_name, id, cb) {
	models[table_name].destroy({
		where: {
			aide_id: id
		}
	})
		.then(function (success) {
			cb()
		}).catch(function (error) {
			return res.status(400).json({
				msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
				error: error
			});
		})
}

var updateAideDailyActivity = function (req, res, i) {
	if (req.body.aide.daily_activities.length > 0) {
		var temp = {};
		if (req.body.aide.daily_activities[i].aide_id) {
			temp = req.body.aide.daily_activities[i];
			models.aide_daily_activities.update(temp, {
				where: {
					id: req.body.aide.daily_activities[i].id
				}
			})
				.then(function () {
					if (i + 1 < req.body.aide.daily_activities.length) {
						updateAideDailyActivity(req, res, i + 1);
					} else {
						updateAideExperience(req, res, 0);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.DAILY_ACTIVITIES_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		} else {
			temp.aide_id = req.body.aide.id;
			temp.title = req.body.aide.daily_activities[i].title;
			temp.activity_id = req.body.aide.daily_activities[i].id;
			temp.is_active = true;
			temp.user_id = req.user.id;
			models.aide_daily_activities.build(temp).save()
				.then(function () {
					if (i + 1 < req.body.aide.daily_activities.length) {
						updateAideDailyActivity(req, res, i + 1);
					} else {
						updateAideExperience(req, res, 0);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.DAILY_ACTIVITIES_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		}

	} else {
		updateAideExperience(req, res, 0);
	}
}
exports.updateAideDailyActivity = updateAideDailyActivity;


var updateAideExperience = function (req, res, i) {
	if (req.body.aide.experience.length > 0) {
		var temp = {};
		if (req.body.aide.experience[i].aide_id) {
			temp = req.body.aide.experience[i];
			models.aide_experience.update(temp, {
				where: {
					id: req.body.aide.experience[i].id
				}
			})
				.then(function () {
					if (i + 1 < req.body.aide.experience.length) {
						updateAideExperience(req, res, i + 1);
					} else {
						commonFuncToRemovePreviousCheckboxValues('aide_background_checks', req.body.aide.id, function (finalRes) {
							updateAideBGcheck(req, res, 0);
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_EXP_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		} else {
			temp = req.body.aide.experience[i];
			temp.aide_id = req.body.aide.id;
			temp.is_active = true;
			models.aide_experience.build(temp).save()
				.then(function () {
					if (i + 1 < req.body.aide.experience.length) {
						updateAideExperience(req, res, i + 1);
					} else {
						commonFuncToRemovePreviousCheckboxValues('aide_background_checks', req.body.aide.id, function (finalRes) {
							updateAideBGcheck(req, res, 0);
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_EXP_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		}
	} else {
		commonFuncToRemovePreviousCheckboxValues('aide_background_checks', req.body.aide.id, function (finalRes) {
			updateAideBGcheck(req, res, 0);
		});
	}
}
exports.updateAideExperience = updateAideExperience;

var updateAideBGcheck = function (req, res, i) {
	if (req.body.aide.bgCheck.length > 0) {
		var temp = {};
		if (req.body.aide.bgCheck[i].aide_id) {
			temp = req.body.aide.bgCheck[i];
			models.aide_background_checks.update(temp, {
				where: {
					id: req.body.aide.bgCheck[i].id
				}
			})
				.then(function () {
					if (i + 1 < req.body.aide.bgCheck.length) {
						updateAideBGcheck(req, res, i + 1);
					} else {
						updateAideEC(req, res, 0);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_BG_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		} else {
			temp.aide_id = req.body.aide.id;
			temp.title = req.body.aide.bgCheck[i].title;
			temp.check_id = req.body.aide.bgCheck[i].id;
			temp.is_active = true;
			models.aide_background_checks.build(temp).save()
				.then(function () {
					if (i + 1 < req.body.aide.bgCheck.length) {
						updateAideBGcheck(req, res, i + 1);
					} else {
						updateAideEC(req, res, 0);
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_BG_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		}
	} else {
		updateAideEC(req, res, 0);
	}
}
exports.updateAideBGcheck = updateAideBGcheck

var updateAideEC = function (req, res, i) {
	var new_arr = JSON.parse(req.body.emergencyContacts);
	if (new_arr.length > 0) {
		var temp = {};
		if (new_arr[i].aide_id) {
			temp = new_arr[i];
			models.aide_emergency_contacts.update(temp, {
				where: {
					id: new_arr[i].id
				}
			})
				.then(function () {
					if (i + 1 < new_arr.length) {
						updateAideEC(req, res, i + 1);
					} else {
						let output = {
							msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_SUCCESS
						}
						output = cryptoService.encrypt(JSON.stringify(output));
						return res.status(200).json({
							data: output
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_EC_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		} else {
			if (new_arr[i].email) {
				new_arr[i].email = new_arr[i].email.toLowerCase();
			}
			temp.aide_id = req.body.aide.id;
			temp.user_id = req.user.id;
			temp.name = new_arr[i].name;
			temp.email = new_arr[i].email;
			temp.phNo = JSON.stringify(new_arr[i].ph_arr);
			temp.is_active = true;
			models.aide_emergency_contacts.build(temp).save()
				.then(function () {
					if (i + 1 < new_arr.length) {
						updateAideEC(req, res, i + 1);
					} else {
						let output = {
							msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_SUCCESS
						}
						output = cryptoService.encrypt(JSON.stringify(output));
						return res.status(200).json({
							data: output
						});
					}
				})
				.catch(function (err) {
					let output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_EC_SAVE_ERR,
						err: err
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				});
		}
	} else {
		let output = {
			msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_SUCCESS
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(200).json({
			data: output
		});
	}
}
exports.updateAideEC = updateAideEC


/*________________________________________________________________________
 * @Date:           23 Aug 2016
 * @Method :        getAllstates
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get all stated for dropdown
 _________________________________________________________________________
 */
var getAllstates = (req, res) => {
	models.states.findAll({})
		.then(function (stateData) {
			let output = {
				states: stateData
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.STATES_ERR,
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.getAllstates = getAllstates;


/*________________________________________________________________________
 * @Date:           23 Aug 2016
 * @Method :        getAllstates
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get all stated for dropdown
 _________________________________________________________________________
 */
var getAllskills = (req, res) => {
	models.aide_expertise.findAll({})
		.then(function (condData) {
			let output = {
				conditions: condData
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.STATES_ERR,
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.getAllskills = getAllskills;



/*________________________________________________________________________
 * @Date:           25 Aug 2016
 * @Method :        languageList
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get all languages for dropdown
 _________________________________________________________________________
 */
var languageList = (req, res) => {
	var query = {};
	if (req.query.query) {
		query = {
			where: {
				title: {
					ilike: '%' + req.query.query + '%'
				}
			}
		}
	}
	models.languages.findAll(query)
		.then(function (data) {
			let output = data;
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function () {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.MEDICAL_LIST_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.languageList = languageList;



/*________________________________________________________________________
 * @Date:           29 Aug 2016
 * @Method :        getAllactivities
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get all activities list for aides
 _________________________________________________________________________
 */
var getAllactivities = (req, res) => {
	var query = {
		where: {
			is_active: true
		}
	};
	models.daily_activities.findAll(query)
		.then(function (data) {
			let output = {
				activities: data
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function () {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.MEDICAL_LIST_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.getAllactivities = getAllactivities;



/*________________________________________________________________________
 * @Date:           29 Aug 2016
 * @Method :        getLicences
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get all activities list for aides
 _________________________________________________________________________
 */
var getLicences = (req, res) => {
	var query = {
		where: {
			is_active: true
		}
	};
	models.licences.findAll(query)
		.then(function (data) {
			let output = {
				licences: data
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function () {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.LICENCE_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.getLicences = getLicences;



/*________________________________________________________________________
 * @Date:           25 Aug 2016
 * @Method :        getBackCheckList
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get all languages for dropdown
 _________________________________________________________________________
 */
var getBackCheckList = (req, res) => {
	models.background_checks.findAll({})
		.then(function (data) {
			let output = data;
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function (err) {
			let output = {
				msg: CONSTANT_OBJ.MESSAGES.BACK_CHECKLIST_ERR,
				err: err
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.getBackCheckList = getBackCheckList;



/*________________________________________________________________________
 * @Date:            29 Aug 2016
 * @Method :         deleteAide
 * Created By:       smartData Enterprises Ltd
 * Modified On:      -
 * @Purpose:         to delete aide data
 _________________________________________________________________________
 */
exports.deleteAide = (req, res) => {
	var output = {};
	if (!req.body.id && !req.body.password) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	models.users.findOne({
		include: [{
			model: models.users_password,
			attributes: [
				DB_CONSTANTS.USERS_PASSWORDS.USER_PASSWORD,
				DB_CONSTANTS.USERS_PASSWORDS.USER_ID,

			]
		}],
		where: {
			id: req.user.id
		}
	}).then(function (data) {
		if (bcrypt.compareSync(req.body.password, data.users_password.dataValues.user_password)) {
			models.aide.update({
				is_active: false
			}, {
					where: {
						id: req.body.id,
						user_id: req.user.id,
						is_active: true
					}
				}).then(function () {
					/*delete schedule of aide after we delete aide*/
					models.main_schedule.update({
						is_active: false
					}, {
							where: {
								aide_id: req.body.id,
								agency_id: req.user.id,
								is_active: true
							}
						})
						.then(function () {
							models.schedule.update({
								is_active: false
							}, {
									where: {
										aide_id: req.body.id,
										user_id: req.user.id,
										is_active: true
									}
								})
								.then(function () {
									models.aide_activities.update({
										is_active: false
									}, {
											where: {
												aide_id: req.body.id,
												user_id: req.user.id,
												is_active: true
											}
										})
										.then(function () {
											output = {
												msg: CONSTANT_OBJ.MESSAGES.AIDE_DEL_OK
											};
											output = cryptoService.encrypt(JSON.stringify(output));
											return res.status(200).json({
												data: output
											});
										}).catch(function (err) {
											var output = {
												msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDT_ERR
											};
											output = cryptoService.encrypt(JSON.stringify(output));
											return res.status(400).json({
												data: output
											});
										})
								}).catch(function (err) {
									var output = {
										msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDT_ERR
									};
									output = cryptoService.encrypt(JSON.stringify(output));
									return res.status(400).json({
										data: output
									});
								})
						})
						.catch(function (err) {
							var output = {
								msg: CONSTANT_OBJ.MESSAGES.MAIN_SCHD_DEL_ERR
							};
							output = cryptoService.encrypt(JSON.stringify(output));
							return res.status(400).json({
								data: output
							});
						})

				}).catch(function (error) {
					var output = {
						msg: CONSTANT_OBJ.MESSAGES.AIDE_DEL_ERR
					};
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.PASS_NOT_MATCH
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
	}).catch(function (error) {
		var output = {
			msg: error
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	})
}

/*________________________________________________________________________
 * @Date:           25 Oct 2016
 * @Method :        getAideDetail
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        To get aide detail with id filter
 _________________________________________________________________________
 */
var getAideDetail = (req, res) => {
	models.aide.findAll({
		include: [{
			model: models.aide_details
		}],
		where: {
			id: req.body.aide_id
		}
	}).then(function (data) {
		var output = data;
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(200).json({
			data: output
		});
	}).catch(function (error) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.AIDE_DETAIL_ERROR
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	})
}
exports.getAideDetail = getAideDetail;

//getAideDetail

exports.checkSsn = (req, res) => {
	var output = {};
	var query = {
		ssn: req.body.ssn,
		user_id: req.user.id,
		is_active: true
	};
	if (req.body.aide_id) {
		query.id = {
			ne: req.body.aide_id
		}
	}
	if (!req.user.id) {
		output = {
			msg: CONSTANT_OBJ.MESSAGES.SESSION_EXPIRED
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	} else {
		if (req.body.aide_id && req.body.aide_id != null) {
			query.id = {
				ne: req.body.aide_id
			}
		}
		models.aide.findOne({
			where: query
		}).then(function (response) {
			if (!response) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.SSN_INVALID
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({
					data: output
				});
			} else {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.DUP_SSN
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});

			}
		}).catch(function (error) {
			output = {
				msg: error
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
	}
}

/*________________________________________________________________________
 * @Date:           2 Aug 2017
 * @Method :        updateAideStatus
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        activate/deactivate aide account by agency if he lost his phone
 _________________________________________________________________________
 */
var updateAideStatus = (req, res) => {
	var device = {};
	var outputJson = {};
	device.device_token = null;
	device.device_type = null;
	device.device_id = null;
	device.remoteWipe = req.body.status;
	if (!req.body.id) {

		var output = {
			msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});

	}
	models.aide.update(device, {
		where: {
			id: req.body.id
		}
	}).then(function () {
		models.aide_tokens.destroy({
			where: {
				aide_id: req.body.id
			}
		})
			.then(function () {
				outputJson.msg = CONSTANT_OBJ.MESSAGES.STATUS_UPDATED;
				output = cryptoService.encrypt(JSON.stringify(outputJson));
				return res.status(200).json({
					data: output
				});
			}).catch(function (error) {
				return res.status(400).json({
					msg: CONSTANT_OBJ.MESSAGES.SERVER_ERROR,
					error: error
				});
			})
	}).catch(function (error) {
		outputJson = {
			msg: error
		}
		res.status(400).json(outputJson);
	});

}
exports.updateAideStatus = updateAideStatus;

/*________________________________________________________________________
 * @Date:           2 Aug 2017
 * @Method :        updateAideECcontact
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        update aide emergency contact details
 _________________________________________________________________________
 */
var updateECContact = (req, res) => {
	var temp = {};
	if (req.body.aide_id) {
		if (req.body.email) {
			req.body.email = req.body.email.toLowerCase();
		}
		temp.user_id = req.body.user_id;
		temp.aide_id = req.body.aide_id;
		temp.name = req.body.name;
		temp.email = req.body.email;
		temp.phNo = JSON.stringify(req.body.ph_arr);
		models.aide_emergency_contacts.update(temp, {
			where: {
				id: req.body.id
			}
		})
			.then(function () {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_SUCCESS
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(200).json({
					data: output
				});
			})
			.catch(function (err) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.AIDE_EC_SAVE_ERR,
					err: err
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			});
	}

}
exports.updateECContact = updateECContact;


/*________________________________________________________________________
 * @Date:           2 Aug 2017
 * @Method :        deleteECContact
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        delete aide emergency contact details
 _________________________________________________________________________
 */
var deleteECContact = (req, res) => {
	if (!req.body.id || !req.body.contact_id) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	var fields = {
		is_active: false
	};
	models.aide_emergency_contacts.update(
		fields, {
			where: {
				id: req.body.contact_id,
				aide_id: req.body.id,
				user_id: req.user.id
			}
		})
		.then(function () {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_SUCCESS
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function (error) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.DEL_EMGNCY_CONT_ERR,
				err: error
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});

}
exports.deleteECContact = deleteECContact;


var generateAideAccountID = (req, res) => {

	var randDom = Math.random().toString();

	var string = randDom.split('.');

	string = string[1];

	var length = 7;
	var trimmedString = string.substring(0, length);

	models.aide.findOne({
		where: {
			accountId: trimmedString
		}
	}).then(function (response) {
		if (!response) {

			var output = {
				keyid: trimmedString
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		} else {
			generateAideAccountID(req, res);
		}
	}).catch(function (noData) {
		var output = {
			msg: noData
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	})
}

exports.generateAideAccountID = generateAideAccountID;



/*________________________________________________________________________
* @Date:            11 Aug 2016
* @Method :         addPatientDocs
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         add monitoring contacts to patient profile
_________________________________________________________________________
*/
var addAideDocs = (req, res, aide_id) => {
	var docs = [];
	req.files.splice(0, 1);
	if (req.files.length > 0) {
		req.files.map(function (obj) {
			var temp = {};
			temp.user_id = req.user.id;
			temp.aide_id = aide_id;
			temp.doc = obj.filename;
			temp.doc_type = obj.mimetype;
			if (allowedImageMimeTypesDocs.indexOf(obj.mimetype) == -1) {
				fs.unlink(obj.path, function () { });
			} else if (obj.size > maxAllowedSize) {
				fs.unlink(req.files[0].path, function () { });
			} else {
				docs.push(temp)
			}

		})
		if (docs.length > 0) {
			models.aide_docs.bulkCreate(docs)
				.then(function () {
				})
				.catch(function (error_em) {
					var output = {
						msg: CONSTANT_OBJ.MESSAGES.ADD_CONCT_ERR,
						err: error_em
					}
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
		} else {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.INVALID_ATT
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
	}
}

/*________________________________________________________________________
* @Date:            18 Aug 2016
* @Method :         deleteAideDoc
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         To delete document of aide
_________________________________________________________________________
*/
var deleteAideDoc = (req, res) => {
	if (!req.body.aide_id || !req.body.user_id || (req.body.user_id !== req.user.id) || !req.body.id) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.DOCMT_ERR
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	models.aide_docs.update({
		is_active: false
	}, {
			where: {
				aide_id: req.body.aide_id,
				user_id: req.user.id,
				id: req.body.id
			}
		})
		.then(function () {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.SUCCESS
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function (err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.REM_PTNT_DOC_ERR
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
}
exports.deleteAideDoc = deleteAideDoc;

/*________________________________________________________________________
 * @Date:           23 Apr 2018
 * @Method :        deleteProvidedAideService
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        delete Provided Aide Service
 _________________________________________________________________________
 */
var deleteProvidedAideService = (req, res) => {
	if (!req.body.service_id) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.REQUIRED_ERR
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	}
	var fields = {
		is_active: false
	};
	models.aide_services.update(
		fields, {
			where: {
				id: req.body.service_id,
				aide_id: req.body.id,
			}
		})
		.then(function () {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.AIDE_UPDATE_SUCCESS
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		})
		.catch(function (error) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.AIDE_SERVICE_ERROR,
				err: error
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		});

}
exports.deleteProvidedAideService = deleteProvidedAideService;

/*________________________________________________________________________
 * @Date:           5 Jul 2018
 * @Method :        uploadAideProfileDocs
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        upload aide profile docs
 _________________________________________________________________________
 */
var uploadAideProfileDocs = (req, res) => {
	var output;
	if (allowedImageMimeTypesDocs.indexOf(req.file.mimetype) == -1) {
		fs.unlink(req.file.path, function () { });
		output = {
			msg: CONSTANT_OBJ.MESSAGES.INVALID_ATT
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	} else if (req.file.size > maxAllowedSize) {
		fs.unlink(req.file.path, function () { });
		output = {
			msg: CONSTANT_OBJ.MESSAGES.INVALID_ATT
		}
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	} else {
		var temp = {};
		temp.user_id = req.user.id;
		temp.aide_id = req.body.aide_id;
		temp.doc = req.file.filename;
		temp.doc_type = req.file.mimetype;
		models.aide_docs.build(temp)
			.save().then(function (data) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.SUCCESS
				}
				output = cryptoService.encrypt(JSON.stringify(data));
				return res.status(200).json({
					data: output
				});
			})
			.catch(function (error) {
				output = {
					msg: CONSTANT_OBJ.MESSAGES.ADD_CONCT_ERR,
					err: error
				}
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
	}
}
exports.uploadAideProfileDocs = uploadAideProfileDocs;

/*________________________________________________________________________
 * @Date:           9 Jul 2018
 * @Method :        send Aide invitation email
 * Created By:      smartData Enterprises Ltd
 * Modified On:     -
 * @Purpose:        sendAideInvitationEmail
 _________________________________________________________________________
 */
var sendAideInvitationEmail = function (req, res, aide_id, token, link) {
	var output;
	var data = {
		email: req.body.aide.email.toLowerCase(),
		first_name: req.body.aide.first_name,
		last_name: req.body.aide.last_name,
		token: token
	}
	//var html = "Hello " + data.first_name.toUpperCase() + ",<p style='padding-left:10px'> We know how hard your job is. And we want to reward you for delivering great care.</p> <p style='padding-left:10px'>Welcome to " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " !</p><p style='padding-left:10px'>Between your care, and our support, you're going to be the best aide your family has ever hired! And we're going to pay you a bonus for your hard work.</p><p style='padding-left:10px'>We know you love us already--and we love you too.</p><p style='padding-left:10px'><a href='" + link + "'>Click here to download our app!</a></p> Warmly,<br/>Rose & Judy<br/> Co Founders, " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " Team";
	var html = data.first_name.toUpperCase() + ",<p style='padding-left:10px'>Welcome to " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " !</p> <p style='padding-left:10px'>At Orah, we believe that caregivers are angels on earth. You have an incredibly difficult yet a very rewarding role and we’re here to have your back!</p><p style='padding-left:10px'>It is your care that will keep your client flourishing and living a full and healthy life.</p><p style='padding-left:10px'>But, up until now you’ve been doing this alone. Quality care can be questioned even if you are doing your job. Miscommunications in care delivery are inevitable. Everyone suffers.</p> <p style='padding-left:10px'>With Orah, everyone will be on the same page.<br/>Between your care, and our support, you're going to be the best aide your agency has ever hired!</p><p style='padding-left:10px'>So let’s jump in -<br/><a href='" + link + "'>Click here to download our app!</a></p> Warmly,<br/>Rose & Judy<br/> Co Founders, " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME;

	var subject = "Welcome to " + CONSTANT_OBJ.SITE_SETTING.SITE_NAME + " !";
	mailer.sendMail(data.email, html, subject, function (error) {
		if (!error) {
			output = {
				msg: CONSTANT_OBJ.MESSAGES.AIDE_ADD_SUCCESS,
				aide_id: aide_id
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(200).json({
				data: output
			});
		} else {
			//console.log('aide invitation send email error')
			output = {
				msg: CONSTANT_OBJ.MESSAGES.INVITATION_EMAIL_ERROR,
				err: error
			}
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		}
	})
}
