var jwt = require('jsonwebtoken');
exports.createToken = function(email,uuid){
	var token = jwt.sign({ email: email,token:uuid, iat: Math.floor(Date.now() / 1000) ,exp: Math.floor(Date.now() / 1000) + (60 * 60)}, 'LSC@2017@PS@AIDE');
	return token;
}
exports.verifyToken = function(){
	return function(req,res,next){
		jwt.verify(req.headers['access-token'], 'LSC@2017@PS@AIDE', function(err, decoded) {
			if (err){
				return res.status(401).json({
					msg : "Please login again your session has expired."
				})
			} else {
				req.headers.decoded = decoded;
				next();
			}
		});
	}
}
