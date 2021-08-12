/*
 *This is common module which will be used to send mails
*/

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: 'info@orah.care',
		pass: 'Lifesharecare123'
	}

});
var sendMail = function(email,html,subject,callback) {
	let mailOptions = {
		from: "Orah",
		to: email,
		subject: subject,
		html: html
	};
	transporter.sendMail(mailOptions, function(error) {
		if (error) {
			callback(error);
		} else {
			callback(null)
		}
	});
}
exports.sendMail = sendMail;


/*send mail via aide app*/
var sendAppMail = function(email,html,subject,data,callback) {
	let mailOptions = {
		from: "Orah",
		to: email,
		subject: subject,
		html: html,
		attachments: [
			{
				path: data
			}
		]
	};
	transporter.sendMail(mailOptions, function(error) {
		if (error) {
			callback(error);
		} else {
			callback(null)
		}
	});
}
exports.sendAppMail = sendAppMail;
