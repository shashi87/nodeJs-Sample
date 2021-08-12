'use strict';
var DB_CONSTANTS = require("../constants/dbConstants.js");
module.exports = function(sequelize, DataTypes) {
	var user_types = sequelize.define('user_types', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.USER_TYPES.ID
		},
		type_name:{ // media name
			type: DataTypes.STRING,
			field:DB_CONSTANTS.USER_TYPES.TYPE_NAME
		},
		is_active: { // media name
			type: DataTypes.BOOLEAN,
			field:DB_CONSTANTS.USER_TYPES.IS_ACTIVE
		},
	});
	return user_types;
};
