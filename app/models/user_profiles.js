'use strict';
var DB_CONSTANTS = require("../constants/dbConstants.js");
module.exports = function(sequelize, DataTypes) {
	var user_profiles = sequelize.define('user_profiles', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USER_PROFILES.ID
		},
		user_id:{
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USER_PROFILES.USER_ID
		},
		mainphone:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_PROFILES.MAIN_PHONE
		},
		emergencyphone:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_PROFILES.EMERGENCY_PHONE
		},
		address:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_PROFILES.ADDRESS
		},
		city:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_PROFILES.CITY
		},
		state:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_PROFILES.STATE
		},
		zipcode:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_PROFILES.ZIPCODE
		},
		unit:{
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_PROFILES.UNIT
		}
	}, {
		classMethods: {
			associate: function(models) {
				// associations can be defined here
				user_profiles.belongsTo(models.users);
			}
		}
	});
	return user_profiles;
};
