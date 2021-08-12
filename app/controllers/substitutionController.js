/*
 *This file contains code related to :
 *agency registeration
 *Substitution Process
 */

var models = require("../models");
var moment = require("moment");
var cryptoService = require("../services/crypto");
var pushServiceUpdate = require('../services/pushSubstitution.js');
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var STRING_CONSTANTS = require("../constants/stringConstants.js");

var changeAide= (req,res) => {
	var startDate=req.body.task.startDateTime;
	var endDate=req.body.task.endDateTime;
	var mainScheduleWhere;
	var scheduleWhere;
	var scheduleActivitiesWhere;
	var aideActivitiesWhere;
	if (req.body.substituteType!='permanent'){
		mainScheduleWhere = {
			id: req.body.task.id
		}
		scheduleWhere = {
			main_schedule_id: req.body.task.id,
			scheduled_clock_in:{
				gte:startDate
			},
			scheduled_clock_out:{
				lte:endDate,
			}
		}
		scheduleActivitiesWhere = {
			main_schedule_id: req.body.task.id,
			scheduled_time_start:{
				gte: moment(req.body.task.clock_in,'HH : mm A').format("HH:mm"),
			},
			scheduled_time_end:{
				lte:moment(req.body.task.clock_out,'HH : mm A').format("HH:mm"),
			}
		}

		aideActivitiesWhere = {
			main_schedule_id: req.body.task.id,
			date:{
				gte:startDate,
				lte:endDate,
			}
		}
	} else {
		mainScheduleWhere = {
			id: req.body.task.id
		}
		scheduleWhere = {
			main_schedule_id: req.body.task.id,
			scheduled_clock_in: {
				gte: startDate
			},
		}
		scheduleActivitiesWhere = {
			main_schedule_id: req.body.task.id,
			scheduled_time_start: {
				gte: moment(startDate).format('HH:MM')
			},
		}
		aideActivitiesWhere = {
			main_schedule_id: req.body.task.id,
			date: {
				gte: startDate
			},
		}
	}
	models.main_schedule.update({
		aide_id:     req.body.new_aide_info.id,
		aide_f_name: req.body.new_aide_info.first_name,
		aide_l_name: req.body.new_aide_info.last_name
	}, {
		where: mainScheduleWhere
	}).then(function(){
		models.schedule.update({
			aide_id:req.body.new_aide_info.id,
		},
		{
			where: scheduleWhere
		}
		).then(function(){
			models.schedule_activities.update({
				aide_id:req.body.new_aide_info.id,
			}, {
				where: scheduleActivitiesWhere
			}).then(function(){
				models.aide_activities.update({
					aide_id:req.body.new_aide_info.id,
				}, {
					where: aideActivitiesWhere
				}).then(function(){
					var data = {};
					data.aide_id=req.body.old_aide.id;
					data.substitute_aide_id=req.body.new_aide_info.id;
					data.patient_id=req.body.task.patient_id;
					data.startdate=req.body.startDate;
					if (req.body.endDate){
						data.enddate= req.body.endDate;
					} else {
						data.enddate= null;
					}
					data.main_schedule_id=req.body.task.id;
					//data.schedule_id=req.body.task.id;
					data.sub_type=req.body.substituteType;
					models.substitutions.build(data).save().then(function(){
						models.aide.findOne({
							where: {
								is_active: true,
								id: req.body.old_aide.id
							}
						}).then(function(aideData){
							var output = {
								msg: CONSTANT_OBJ.MESSAGES.SUBSTITUTION_SUCCESS_MSG
							};
							output = cryptoService.encrypt(JSON.stringify(output));
							if (aideData.device_token!=null ) {
								if (aideData.device_type == STRING_CONSTANTS.DEVICE_TYPE.IOS){
									
									pushServiceUpdate.sendPushSubstitution('3', req.body);
								} 
								if (aideData.device_type == STRING_CONSTANTS.DEVICE_TYPE.ANDROID){
									pushServiceUpdate.sendToAndroid(aideData.device_token, req.body);
									
								} 
							} 
console.log('(((((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))))))))))))))))');
							 /////Aide details for new aide ////////////////////////////////////
			                        models.aide.findOne({
										where: {
											is_active: true,
											id: req.body.new_aide_info.id
										}
									}).then(function(newAideData){
										var output = {
										msg: CONSTANT_OBJ.MESSAGES.SUBSTITUTION_SUCCESS_MSG
									};
									output = cryptoService.encrypt(JSON.stringify(output));
									console.log('***************************0************************************************',newAideData);
										if (newAideData.device_token!=null ) {
											if (newAideData.device_type == STRING_CONSTANTS.DEVICE_TYPE.IOS){
												console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
												pushServiceUpdate.sendPushSubstitutionNewAide('3', req.body);
												return res.status(200).json({
													data: output
												});

												
											} else if (newAideData.device_type == STRING_CONSTANTS.DEVICE_TYPE.ANDROID){
												pushServiceUpdate.sendToAndroidNewAide(newAideData.device_token, req.body);
												return res.status(200).json({
													data: output
												});
												
											} else {
												return res.status(200).json({
													data: output
												});
												
											}
										} 
										else{
											return res.status(200).json({
													data: output
												});
												
										}
									}).catch(function(err){
										var output = {
										msg: CONSTANT_OBJ.MESSAGES.GET_AIDE_DATA_ERR
									};
									output = cryptoService.encrypt(JSON.stringify(output));
									return res.status(400).json({
										data: output
									});
									})

                                ///////////////////////////////////////////////////////////////////////////////////////////////

						}).catch(function(err){
							var output = {
								msg: CONSTANT_OBJ.MESSAGES.GET_AIDE_DATA_ERR
							};
							output = cryptoService.encrypt(JSON.stringify(output));
							return res.status(400).json({
								data: output
							});
						});
                        

                       

					}).catch(function(err){
						var output = {
							msg: CONSTANT_OBJ.MESSAGES.SUBSTITUTION_ERROR_MSG
						};
						output = cryptoService.encrypt(JSON.stringify(output));
						return res.status(400).json({
							data: output
						});
					})
				}).catch(function(err) {
					var output = {
						msg: CONSTANT_OBJ.MESSAGES.SUBSTITUTION_ERROR_MSG
					};
					output = cryptoService.encrypt(JSON.stringify(output));
					return res.status(400).json({
						data: output
					});
				})
			}).catch(function(err) {
				var output = {
					msg: CONSTANT_OBJ.MESSAGES.SUBSTITUTION_ERROR_MSG
				};
				output = cryptoService.encrypt(JSON.stringify(output));
				return res.status(400).json({
					data: output
				});
			})
		}).catch(function(err) {
			var output = {
				msg: CONSTANT_OBJ.MESSAGES.SUBSTITUTION_ERROR_MSG
			};
			output = cryptoService.encrypt(JSON.stringify(output));
			return res.status(400).json({
				data: output
			});
		})
	}).catch(function(err) {
		var output = {
			msg: CONSTANT_OBJ.MESSAGES.SUBSTITUTION_ERROR_MSG
		};
		output = cryptoService.encrypt(JSON.stringify(output));
		return res.status(400).json({
			data: output
		});
	})
}

exports.changeAide = changeAide;
