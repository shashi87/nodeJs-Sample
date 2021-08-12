'use strict';
var DB_CONSTANTS = require("../constants/dbConstants.js");
module.exports = function(sequelize, DataTypes) {
	var user_login_attempts = sequelize.define('user_login_attempts', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.ID
		},
		user_id:{
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.USER_ID
		},
		address:{ // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.ADDRESS
		},
		browser:{ // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.BROWSER
		},
		datetime: { // added by verification
			type: DataTypes.DATE,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.DATETIME
		},
		status: { // added by verification
			type: DataTypes.BOOLEAN,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.STATUS
		},
		city: { // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.CITY
		},
		country: { // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.COUNTRY
		},
		zip: { // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.ZIP
		},
		lat: { // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.LAT
		},
		lng:{ // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.LNG
		},
		is_ip_blocked : { // added by verification
			type: DataTypes.BOOLEAN,
			field:DB_CONSTANTS.USER_LOGIN_ATTEMPTS.IS_IP_BLOCKED
		},

	}, {
		classMethods: {
			associate: function(models) {
				// associations can be defined here
				user_login_attempts.belongsTo(models.users, {
					foreignKey: DB_CONSTANTS.USER_LOGIN_ATTEMPTS.USER_ID
				});
			}
		}
	});
	return user_login_attempts;
};
