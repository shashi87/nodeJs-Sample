
var models = require("../models");
exports.audit_log = function(data) {
	//audit_log
	if (Array.isArray(data)){
		var i =0;
		var ret = false;
		for (i=0;i<data.length;i++){

			if (!data[i].field_name || !data[i].new_val || !data[i].user_id || !data[i].patient_id || !data[i].table_name || !data[i].type || !data[i].action ){
				ret = true
			}
		}
		if (ret){
			return false;
		}
		models.audit_trail.bulkCreate(data).then(function(){
			//console.log('Successfully saved Log')
		})
			.catch(function(err){
			//console.log('err-------------\n\n\n',err);
			});
	} else {
		if (!data.field_name || !data.new_val || !data.user_id || !data.patient_id || !data.table_name || !data.type || !data.action ){
			return;
		}

		models.audit_trail.build(data)
			.save().then(function(){
			//console.log('Successfully saved Log')
			})
			.catch(function(err){
			//console.log('err-------------\n\n\n',err);
			});
	}
};
