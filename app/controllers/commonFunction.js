/*
 *This file contains code related to :
 *push services for aides
 */
var models = require("../models");
var fs = require('fs');
var cryptoService = require("../services/crypto");
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var DB_CONSTANTS = require("../constants/dbConstants.js");
var STRING_CONSTANTS = require("../constants/stringConstants.js");

var patientDetails = (req, res, data, cb) => {
	models.patients.findAll({
		where: {
			id: {
				in: data
			},
			is_active: true
		},
		include: [{
			model: models.patient_details
		}, {

			model: models.patient_languages,
			where: {
				is_active: true
			},
			required: false
		}],
		order: [
			[DB_CONSTANTS.PATIENTS.ID, STRING_CONSTANTS.SORT_ORDER.DESC],
		],
	})
		.then(function (patientsGeneral) {
			models.patients.findAll({
				where: {
					id: { in: data },
					is_active: true
				},
				include: [{
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
			})
				.then(function (aideServicesData) {
					models.patients.findAll({
						where: {
							id: { in: data },
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
					})
						.then(function (medicalInformation) {
							models.patients.findAll({
								where: {
									id: { in: data },
									is_active: true
								},
								include: [{
									model: models.physicians,
									where: {
										is_active: true
									},
									required: false
								}, {
									model: models.emergency_contacts,
									where: {
										is_active: true
									},
									required: false
								}, {
									model: models.patient_agency_infos,
									required: false
								}],
								order: [
									[DB_CONSTANTS.PATIENTS.ID, STRING_CONSTANTS.SORT_ORDER.DESC],
								],
							})
								.then(function (emergSection) {
									models.patients.findAll({
										where: {
											id: { in: data },
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
									})
										.then(function (payorInfo) {
											var patientsData = [];
											if (patientsGeneral.length > 0) {
												for (var i = 0; i < patientsGeneral.length; i++) {
													if(patientsGeneral[i].patient_detail.ethnicity  == 'selected'){
														patientsGeneral[i].patient_detail.ethnicity == "" ;
													}

													patientsData.push({
														id: patientsGeneral[i].id,
														user_id: patientsGeneral[i].user_id,
														first_name: patientsGeneral[i].first_name,
														last_name: patientsGeneral[i].last_name,
														patient_detail: patientsGeneral[i].patient_detail,
														patient_languages: patientsGeneral[i].patient_languages,
														patient_services: aideServicesData[i].patient_services,
														patient_daily_activities: aideServicesData[i].patient_daily_activities,
														patient_skills: aideServicesData[i].patient_skills,
														patient_agency_infos: emergSection[i].patient_agency_infos,
														physicians: emergSection[i].physicians,
														emergency_contacts: emergSection[i].emergency_contacts,
														patient_medical_informations: medicalInformation[i].patient_medical_informations,
														patient_supplements: medicalInformation[i].patient_supplements,
														patient_medications: medicalInformation[i].patient_medications,
														patient_docs: medicalInformation[i].patient_docs,
														patient_fields_values: medicalInformation[i].patient_fields_values,
														patient_insurers: payorInfo[i].patient_insurers,
														patient_medicares: payorInfo[i].patient_medicares,
														patient_medi_histories: medicalInformation[i].patient_medi_histories
													});
												}
											}

											var patients = {};
											patients = patientsData;
											(function checkPatientFields(req, res, patients, recNum) {
												patients = JSON.parse(JSON.stringify(patients))
												if (patients.length == recNum) {
													var result = {
														patients: JSON.parse(JSON.stringify(patients))
													}
													var patientIDs = [];
													patients.map(function (obj) {
														patientIDs.push(obj.id);
													})
													result.patientIds = patientIDs;
													cb(result);
												} else {
													if (patients[recNum]) {
														patients[recNum].first_name = cryptoService.decryptString(patients[recNum].first_name);
														patients[recNum].last_name = cryptoService.decryptString(patients[recNum].last_name);
														patients[recNum].patient_detail.address = cryptoService.decryptString(patients[recNum].patient_detail.address);
														if (patients[recNum].patient_detail.ssn != null) {
															patients[recNum].patient_detail.ssn = cryptoService.decryptString(patients[recNum].patient_detail.ssn);
														}
														if (patients[recNum].patient_detail.email != null) {
															patients[recNum].patient_detail.email = cryptoService.decryptString(patients[recNum].patient_detail.email);
														}
														if (patients[recNum].patient_detail.dob != null) {
															patients[recNum].patient_detail.dob = new Date(cryptoService.decryptString(patients[recNum].patient_detail.dob));
														}
														if (patients[recNum].patient_detail.phone != null) {
															let phoneDecrypt = cryptoService.decryptString(patients[recNum].patient_detail.phone);
															patients[recNum].patient_detail.phone = JSON.parse(phoneDecrypt);
														} else {
															patients[recNum].patient_detail.phone = [];
														}
														var pateintData = patients[recNum].patient_fields_values;
                                                                                                      
														if (patients[recNum].patient_medical_informations[0]) {
															if (patients[recNum].patient_medical_informations[0].allergy == null) {
																patients[recNum].patient_medical_informations[0].allergy = [];
															} else {
																patients[recNum].patient_medical_informations[0].allergy = JSON.parse(patients[recNum].patient_medical_informations[0].allergy);
															}
 console.log('))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))',patients[recNum].patient_medical_informations[0].advancedDirective , "************************************************", __dirname + STRING_CONSTANTS.DOCS_URL.RELATIVE_LEGAL_DOCS  + patients[recNum].patient_medical_informations[0].advancedDirective , fs.existsSync(__dirname + STRING_CONSTANTS.DOCS_URL.ABSOLUTE_LEGAL_PATH + patients[recNum].patient_medical_informations[0].advancedDirective));
															if (patients[recNum].patient_medical_informations[0].advancedDirective != null && fs.existsSync(__dirname + STRING_CONSTANTS.DOCS_URL.RELATIVE_LEGAL_DOCS  + patients[recNum].patient_medical_informations[0].advancedDirective)) {
console.log('truuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuue');

																patients[recNum].patient_medical_informations[0].advancedDirective =
																	STRING_CONSTANTS.DOCS_URL.LEGAL_DOCS + patients[recNum].patient_medical_informations[0].advancedDirective
															} else {
																patients[recNum].patient_medical_informations[0].advancedDirective = null;
															}

															if (patients[recNum].patient_docs.length > 0) {
																var tempInsu = [];
																patients[recNum].patient_docs.map(function (obj) {
																	if (obj.doc != null && fs.existsSync(__dirname + STRING_CONSTANTS.MEDIA_URL.PUBLIC_URL + obj.doc)) {
																		obj.doc = STRING_CONSTANTS.DOCS_URL.RELATIVE_PATH + obj.doc
																	} else {
																		obj.doc = null;
																	}
																	tempInsu.push(obj)
																})
																patients[recNum].patient_docs = tempInsu;
															}
															patients[recNum].patient_medical_informations[0].patient_docs = patients[recNum].patient_docs;
															
															if (patients[recNum].patient_medical_informations[0].additionalDocs != null) {
																console.log(patients[recNum].patient_medical_informations[0].additionDocs ,'%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
																var additionDocs = JSON.parse(patients[recNum].patient_medical_informations[0].additionalDocs);
																if (additionDocs.length > 0) {
																	var tempInsu = [];
																	additionDocs.map(function (obj) {
																		if (obj.additionalDocs != null && fs.existsSync(__dirname + STRING_CONSTANTS.DOCS_URL.ABSOLUTE_LEGAL_PATH + obj.additionalDocs)) {
																			obj.additionalDocs = STRING_CONSTANTS.DOCS_URL.RELATIVE_LEGAL_PATH + obj.additionalDocs;
																			tempInsu.push(obj.additionalDocs)
																		} /*else {
																			obj.additionalDocs = null;
																		}*/
																		
																	})
																	patients[recNum].patient_medical_informations[0].additionalDocs = tempInsu;
																}
																else{
																	patients[recNum].patient_medical_informations[0].additionalDocs = [];
																}
															}
console.log('##################################################################################**********************************************************************************',patients[recNum].patient_medical_informations[0].livingwill,STRING_CONSTANTS.DOCS_URL.RELATIVE_LEGAL_DOCS);
															if (patients[recNum].patient_medical_informations[0].livingwill != null && fs.existsSync(__dirname + STRING_CONSTANTS.DOCS_URL.RELATIVE_LEGAL_DOCS + patients[recNum].patient_medical_informations[0].livingwill)) {

																patients[recNum].patient_medical_informations[0].livingwill = STRING_CONSTANTS.DOCS_URL.LEGAL_DOCS + patients[recNum].patient_medical_informations[0].livingwill
															} else {
																patients[recNum].patient_medical_informations[0].livingwill = null;
															}
														}

														var temdataMedical = [];
														temdataMedical = patients[recNum].patient_medical_informations ? patients[recNum].patient_medical_informations : [];
														patients[recNum].patient_medical_informations = [];
														patients[recNum].patient_medical_informations[0] = {};
														patients[recNum].patient_medical_informations[1] = {};
														patients[recNum].patient_medical_informations[2] = {};
														patients[recNum].patient_medical_informations[3] = {};
														patients[recNum].patient_medical_informations[0]["info"] = temdataMedical;
														patients[recNum].patient_medical_informations[1]['medications'] = patients[recNum]['patient_medications'];
														patients[recNum].patient_medical_informations[2]['supplements'] = patients[recNum]['patient_supplements'];
														var requestedServices = [];

														if (patients[recNum].patient_detail.typeOfcare == null) {
															requestedServices.push({ typeOfcare: [] });
														} else {
															requestedServices.push({ typeOfcare: JSON.parse(patients[recNum].patient_detail.typeOfcare) });
														}

														requestedServices.push({ additional_requests: patients[recNum].patient_detail.additionalRequests });

														patients[recNum].requested_aide_services = [];
														patients[recNum].requested_aide_services[0] = {};
														patients[recNum].requested_aide_services[1] = {};
														patients[recNum].requested_aide_services[2] = {};
														patients[recNum].requested_aide_services[3] = {};
														var temdataPatientServices = [];
														temdataPatientServices = patients[recNum].patient_services ? patients[recNum].patient_services : [];
														patients[recNum].requested_aide_services[0]["info"] = requestedServices;
														patients[recNum].requested_aide_services[1]['licence_or_Credential'] = [];
														patients[recNum].requested_aide_services[2]['patient_daily_activities'] = [];
														patients[recNum].requested_aide_services[3]['patient_skills'] = [];
														if (temdataPatientServices.length > 0) {
															var tempInsu = [];
															temdataPatientServices.map(function (obj) {
																tempInsu.push(obj.title)
															})
															patients[recNum].requested_aide_services[1]['licence_or_Credential'] = tempInsu;
														}
														var temdataPatientServices = [];
														temdataPatientServices = patients[recNum].patient_daily_activities ? patients[recNum].patient_daily_activities : [];
														if (temdataPatientServices.length > 0) {
															var tempInsu = [];
															temdataPatientServices.map(function (obj) {
																tempInsu.push(obj.title)
															})
															patients[recNum].requested_aide_services[2]['patient_daily_activities'] = tempInsu;
														}

														var temdataPatientServices = [];
														temdataPatientServices = patients[recNum].patient_skills ? patients[recNum].patient_skills : [];
														if (temdataPatientServices.length > 0) {
															var tempInsu = [];
															temdataPatientServices.map(function (obj) {
																tempInsu.push(obj.title)
															})
															patients[recNum].requested_aide_services[3]['patient_skills'] = tempInsu;
														}

														patients[recNum].emergency_contacts_additional = [];
														patients[recNum].emergency_contacts_additional[0] = {}
														patients[recNum].emergency_contacts_additional[1] = {};
														patients[recNum].emergency_contacts_additional[2] = {}

														var temdata = []
														temdata = patients[recNum].representatives ? patients[recNum].representatives : [];

														patients[recNum].emergency_contacts_additional[0]['representatives'] = [];
														var temdata = []
														temdata = patients[recNum].physicians ? patients[recNum].physicians : [];

														patients[recNum].emergency_contacts_additional[1]['physicians'] = temdata;
														var temdata = []
														temdata = patients[recNum].patient_agency_infos ? patients[recNum].patient_agency_infos : [];
														patients[recNum].emergency_contacts_additional[2]['agencyInfo'] = temdata;
														if (patients[recNum].emergency_contacts_additional[2]['agencyInfo'][0]) {
															if (patients[recNum].emergency_contacts_additional[2]['agencyInfo'][0].agencyPhone == null) {
																patients[recNum].emergency_contacts_additional[2]['agencyInfo'][0].agencyPhone = [];
															} else {
																patients[recNum].emergency_contacts_additional[2]['agencyInfo'][0].agencyPhone = JSON.parse(patients[recNum].emergency_contacts_additional[2]['agencyInfo'][0].agencyPhone);
															}
														}
														var temdata = []
														temdata = patients[recNum].patient_insurers ? patients[recNum].patient_insurers : [];


														if (temdata.length > 0) {
															var tempInsu = [];
															temdata.map(function (obj) {
																if (obj.cardPDF != null && fs.existsSync(__dirname + STRING_CONSTANTS.DOCS_URL.RELATIVE_LEGAL_DOCS + obj.cardPDF)) {
																	obj.cardPDF = STRING_CONSTANTS.DOCS_URL.LEGAL_DOCS + obj.cardPDF
																} else {
																	obj.cardPDF = null;
																}

																tempInsu.push(obj)
															})

															temdata = tempInsu;
														}

														patients[recNum].patient_insurers = [];
														patients[recNum].patient_insurers[0] = {}
														patients[recNum].patient_insurers[1] = {}
														patients[recNum].patient_insurers[0]["info"] = temdata;

														var temdata = [];
														temdata = patients[recNum].patient_medicares ? patients[recNum].patient_medicares : []


														if (temdata.length > 0) {
															var tempInsu = [];
															temdata.map(function (obj) {
																if (obj.cardfile != null && fs.existsSync(__dirname + STRING_CONSTANTS.DOCS_URL.RELATIVE_LEGAL_DOCS + obj.cardfile)) {
																	obj.cardfile = STRING_CONSTANTS.DOCS_URL.LEGAL_DOCS + obj.cardfile
																} else {
																	obj.cardfile = null;
																}

																tempInsu.push(obj)
															})

															temdata = tempInsu;
														}
														patients[recNum].patient_insurers[1]["medicare"] = temdata;

														delete patients[recNum].patient_medications;
														delete patients[recNum].patient_fields_values;
														delete patients[recNum].patient_supplements;
														delete patients[recNum].representatives;
														delete patients[recNum].physicians;
														delete patients[recNum].patient_History;
														delete patients[recNum].patient_medicares;
														if (pateintData) {
															checkPatientFieldsData(pateintData, function (successData) {
																if (patients[recNum]) {
																	patients[recNum].patient_medical_informations[3]['patient_History'] = [];
																	patients[recNum].patient_medical_informations[3]['patient_History'] = successData;
																	var sensoryData = [];
																	sensoryData = patients[recNum].patient_medical_informations[3]['patient_History'][1]['sensory_status'];
																	delete patients[recNum].patient_medical_informations[3]['patient_History'][1]['sensory_status'];
																	patients[recNum].patient_medical_informations[3]['patient_History'][1]['sensory_status'] = []
																	patients[recNum].patient_medical_informations[3]['patient_History'][1]['sensory_status'].push({
																		data: sensoryData
																	});

																	var pressureUlcerAssessment = '';
																	var ulcerIdentified = '';
																	var problematicUlcer = '';
																	if (temdataMedical[0] && temdataMedical[0].pressureUlcerAssessment != null) {
																		pressureUlcerAssessment = temdataMedical[0].pressureUlcerAssessment;
																	}

																	if (temdataMedical[0] && temdataMedical[0].ulcerIdentified != null) {
																		ulcerIdentified = temdataMedical[0].ulcerIdentified;
																	}
																	if (temdataMedical[0] && temdataMedical[0].problematicUlcer != null) {
																		problematicUlcer = temdataMedical[0].problematicUlcer;
																	}
																	var ulcerdata = [];
																	ulcerdata.push({
																		key: "Pressure Ulcer Assessment",
																		value: [pressureUlcerAssessment]

																	});
																	ulcerdata.push({
																		key: "Record when Ulcer was identified",
																		value: [ulcerIdentified]

																	})
																	ulcerdata.push({
																		key: "Status of most problematic ulcer",
																		value: [problematicUlcer]

																	})
																	patients[recNum].patient_medical_informations[3]['patient_History'][1]['sensory_status'].push({
																		ulcer_status: ulcerdata

																	})
																}

																checkPatientFields(req, res, patients, ++recNum)
															});
														}
													}
												}
											})(req, res, patients, 0);
										}).catch(function () {
											cb([]);
										})
								}).catch(function () {
									cb([]);
								})
						}).catch(function () {
							cb([]);
						})
				}).catch(function () {
					cb([]);
				});
		})
}



var checkPatientFieldsData = (optionsData, cb) => {
	var optionsIds = [];
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
	}).then(function (data) {
		var data = JSON.parse(JSON.stringify(data));
		var finalData = []
		for (var i = 0; i < data.length; i++) {
			var thisData = {};
			var flag = -1
			for (var j = 0; j < finalData.length; j++) {
				if (finalData[j]["key"] == data[i]['patient_field'][DB_CONSTANTS.PATIENT_FIELDS.ORIG_TITLE]) {
					flag = j
					break
				}
			}

			if (flag != -1) {
				finalData[flag]["value"].push(data[i]['title'])
			} else {
				thisData["key"] = data[i]['patient_field']['origTitle'];
				thisData["fieldCategory"] = data[i]['patient_field']['fieldCategory']
				thisData["value"] = [data[i]['title']]
				finalData.push(thisData);
			}
		}

		var newData = [];
		var history = [];
		var sensory_status = [];
		var nutritional_status = [];
		for (i = 0; i < finalData.length; i++) {
			if (finalData[i]['fieldCategory'] == 'history') {
				history.push(finalData[i])
			} else if (finalData[i]['fieldCategory'] == 'sensory_status') {
				sensory_status.push(finalData[i])
			} else if (finalData[i]['fieldCategory'] == 'nutritional_status') {
				nutritional_status.push(finalData[i])
			}
		}
		newData.push({
			history: history
		});
		newData.push({
			sensory_status: sensory_status
		});
		newData.push({
			nutritional_status: nutritional_status
		});
		cb(newData)
	})
		.catch(function () {
			cb([])
		});


}

module.exports.patientDetails = patientDetails;

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
module.exports.passwordFormat = passwordFormat;
