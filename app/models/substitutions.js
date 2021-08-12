'use strict';
var DB_CONSTANTS = require("../constants/dbConstants.js");
module.exports = function(sequelize, DataTypes) {
	var substitutions = sequelize.define('substitutions', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		aide_id: { // added by verification
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.SUBSTITUTIONS.AIDE_ID
		},     // old aide id
		substitute_aide_id: { // added by verification
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.SUBSTITUTIONS.SUBSTITUTE_AIDE_ID
		},    // new substitute aide id
		patient_id: { // added by verification
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.SUBSTITUTIONS.PATIENT_ID
		},
		startdate : { // added by verification
			type: DataTypes.DATE,
			field:DB_CONSTANTS.SUBSTITUTIONS.START_DATE
		},
		enddate : { // added by verification
			type: DataTypes.DATE,
			field:DB_CONSTANTS.SUBSTITUTIONS.END_DATE
		},
		main_schedule_id: { // added by verification
			type: DataTypes.INTEGER,
			field:DB_CONSTANTS.SUBSTITUTIONS.MAIN_SCHEDULE_ID
		},
		sub_type: { // added by verification
			type: DataTypes.STRING,
			field:DB_CONSTANTS.SUBSTITUTIONS.SUB_TYPE
		}, // old aide last name
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue : true,
			field:DB_CONSTANTS.SUBSTITUTIONS.IS_ACTIVE
		},
	}, {
		classMethods: {
			associate: function(models) {
				substitutions.belongsTo(models.aide, {
					foreignKey: DB_CONSTANTS.SUBSTITUTIONS.AIDE_ID
				});

				substitutions.belongsTo(models.patients, {
					foreignKey: DB_CONSTANTS.SUBSTITUTIONS.PATIENT_ID
				});
				substitutions.belongsTo(models.main_schedule, {
					foreignKey: DB_CONSTANTS.SUBSTITUTIONS.MAIN_SCHEDULE_ID
				});
			}
		}
	});
	return substitutions;
};
