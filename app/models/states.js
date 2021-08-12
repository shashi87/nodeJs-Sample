'use strict';
var DB_CONSTANTS = require("../constants/dbConstants.js");
module.exports = function(sequelize, DataTypes) {
	var states = sequelize.define('states', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.STATES.ID
		},
		state: { // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.STATES.STATE
		},

	});
	return states;
};
