'use strict';
var hookController = require("../controllers/hookController.js");
var moment = require('moment');
var DB_CONSTANTS = require("../constants/dbConstants.js");
var STRING_CONSTANTS = require("../constants/stringConstants.js");
module.exports = function(sequelize, DataTypes) {
	var user_password = sequelize.define('users_password', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USERS_PASSWORDS.ID
		},
		user_id:{
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USERS_PASSWORDS.USER_ID
		},
		user_password:{
			allowNull: false,
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USERS_PASSWORDS.USER_PASSWORD
		}
	}, {
		classMethods: {
			associate: function(models) {
				// associations can be defined here
				user_password.belongsTo(models.users ,  {
					as: "pswd"
				});
			}
		},
		hooks: {
			beforeBulkUpdate: function(inst) {
				var new_val = inst.attributes;
				if ('user_password' in new_val) {
					var obj = {}
					obj.user_id = inst.where.user_id;
					obj.table_name = 'agency_password';
					obj.type = 'EDIT';
					obj.prev_val = '';
					obj.new_val = '';
					obj.field_name = 'password';
					obj.date = moment().format(STRING_CONSTANTS.DATE_CONSTANT.YEAR_MONTH_FORMAT);
					obj.msg = "changed " + obj.field_name + " in " + obj.table_name + " table on " + obj.date;
					hookController.calllog(obj);
				}
			}
		}
	});
	return user_password;
};
