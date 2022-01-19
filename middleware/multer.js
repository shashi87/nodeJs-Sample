const multer = require('multer'),
	fs = require('fs'),
	config = require('../config');

var init = function () {
	if (!fs.existsSync(config.cfg.uploadDir)) {
		fs.mkdir(config.cfg.uploadDir, 0744);
	}
}
var fileName;
var storage = multer.diskStorage({
	destination: function (request, file, callback) {
		callback(null, uploadPath(file));
	},
	filename: function (request, file, callback) {

		var time = new Date().getTime();
		fileName = file.fieldname + '_' + time + '_' + file.originalname.slice(file.originalname.lastIndexOf('.') - 1);
		fileName=fileName.replace(/ /g,'');
		callback(null, fileName);
	}
});
var upload = multer({
	storage: storage
});

function _singleFile(key) {
	return upload.single(key);
}

function _fileArray(key, count) {
	return upload.array(key, count);
}

const fields = arr => {
	return upload.fields(arr);
}
const uploadPath= file=>{
	let path=config.cfg.uploadDir;
	switch(file.fieldname){
		case 'prod_img':
		path=path+'/product'
			if (!fs.existsSync(path)) {
				fs.mkdir(path, { recursive: true },err=>{});
			}
			return path;
			case 'usr_img':
			path=path+'/users'
			if (!fs.existsSync(path)) {
				fs.mkdir(path, { recursive: true },err=>{});
			}
			return path;
		default:
			return path
	}
}

// ========================== Export Module Start ==========================
module.exports = {
	single: _singleFile,
	array: _fileArray,
	fields
}
// ========================== Export Module End ============================