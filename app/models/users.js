'use strict';
var DB_CONSTANTS = require("../constants/dbConstants.js");
module.exports = function(sequelize, DataTypes) {
	var users = sequelize.define('users', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USERS.ID
		},
		typeId: {
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USERS.TYPE_ID
		},
		parent_user:{
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USERS.PARENT_USER
		},
		pswdId: {
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USERS.PSWD_ID
		},
		email_id: {
			allowNull: false,
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USERS.EMAIL_ID
		},
		phone_number: {
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USERS.PHONE_NUMBER
		},
		first_name: {
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USERS.FIRST_NAME
		},
		last_name: {
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USERS.LAST_NAME
		},
		failed_attempts: {
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USERS.FAILED_ATTEMPTS
		},
		last_attempt: {
			type: DataTypes.DATE,
			field:DB_CONSTANTS.USERS.LAST_ATTEMPT
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue : true,
			field:DB_CONSTANTS.USERS.IS_ACTIVE
		},
		is_deleted: {
			type: DataTypes.BOOLEAN,
			defaultValue : false,
			field:DB_CONSTANTS.USERS.IS_DELETED
		},
		time_offSet:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USERS.TIME_OFFSET
		}
	}, {
		classMethods: {
			associate: function(models) {
				// associations can be defined here
				users.belongsTo(models.user_types, {
					as: "type"
				});
				users.hasMany(models.aide, {
					foreignKey: DB_CONSTANTS.AIDE.USER_ID
				});
				users.hasOne(models.users_password, {
					foreignKey: DB_CONSTANTS.USERS_PASSWORDS.USER_ID
				});
				users.hasMany(models.main_schedule, {
					foreignKey: DB_CONSTANTS.MAIN_SCHEDULES.AGENCY_ID
				});
				users.hasMany(models.user_login_attempts, {
					foreignKey: DB_CONSTANTS.USER_LOGIN_ATTEMPTS.USER_ID
				});
			}
		},
		timestamps: false
	});
	return users;
};
