/*********************************************************************
 *this file contains middleware that pareses incoming forms with multer
**********************************************************************/

var path = require('path');
var crypto = require('crypto');
var multer = require('multer');

var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/uploads')
	},
	filename: function(req, file, cb) {
		crypto.pseudoRandomBytes(16, function(err, raw) {
			console.log(file,'***************file*****************************************');
			if (err) return cb(err)
			cb(null, raw.toString('hex') + path.extname(file.originalname))
		})
	}
});

var storage_video = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/uploads/video')
	},
	filename: function(req, file, cb) {
		crypto.pseudoRandomBytes(16, function(err, raw) {
			if (err) return cb(err)
			cb(null, raw.toString('hex') + path.extname(file.originalname))
		})
	}
});

var storageM = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/uploads')
	},
	filename: function(req, file, cb) {
		crypto.pseudoRandomBytes(16, function(err, raw) {
			if (err) return cb(err)
			cb(null, raw.toString('hex') + path.extname(file.originalname))
		})
	}
});

exports.cpUpload = multer({
	storage: storage
}).single('file');

exports.cpUpload_video = multer({
	storage: storage_video
}).single('file');

exports.cpUploadArray = multer({
	storage: storageM
}).array('file[]');
