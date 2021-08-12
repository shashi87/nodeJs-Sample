module.exports = function (app, express, passport) {
    var router = express.Router();
    var path = require("path");
    var middleware = require("./../app/policies/auth");
    var authObj = require('./../app/controllers/AuthController.js');
    var models = require("../app/models");
    var cryptoService = require("./../app/services/crypto");
    var moment = require("moment");
    var mailer = require('./../app/controllers/mailer');
    var root = process.cwd();
    var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
    var STRING_CONSTANTS = require("../app/constants/stringConstants");
    var siteSetting = {
        'siteName': 'Orah',
        'mailTo': 'info@orah.care'
    }
    router.get('/admin', function (req, res) {
        res.render('adminIndex.ejs', {
            siteName: siteSetting.siteName,
        });
    });

    router.get('/login/:id/*', function (req, res) {
        var login_type;
        var panelType = req.params.id;
        if (req.params.id == 'admin') {
            login_type = 1
        } else if (req.params.id == 'authorization') {
            login_type = 2
        } else if (req.params.id == 'agency') {
            login_type = 3
        } else if (req.params.id == 'verification') {
            login_type = 4
        } else {
            login_type = 0
        }
        if (login_type > 0) {
            res.render('loginIndex.ejs', {
                message: req.flash('error'),
                successMsg: req.flash('success'),
                type: login_type,
                panelType: panelType,
                siteName: siteSetting.siteName
            });
        } else {
            res.redirect('/404');
        }
    });

    router.get('/controlpanel', function (req, res) {
        res.render('mainIndex.ejs', {
            message: req.flash('error'),
            siteName: siteSetting.siteName,
        });
    });

    router.get('/failureRedirectCheck', function (req, res) {
        console.log(req.isAuthenticated(),'**************YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY*********************************************************');
        if (req.isAuthenticated()) {
            console.log(req.user.typeId,"^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^YYYYYYYYYYYYYYYYYYYYYYY");
            if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.AGENCY) {
                output = {
                    msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
                };
                output = cryptoService.encrypt(JSON.stringify(output));
                return res.status(200).json({ data: output });
            } else if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.SUPER_ADMIN) {
                output = {
                    msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
                };
                output = cryptoService.encrypt(JSON.stringify(output));
                return res.status(200).json({ data: output });
            } else if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.VERIFICATION) {
                output = {
                    msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
                };
                output = cryptoService.encrypt(JSON.stringify(output));
                return res.status(200).json({ data: output });
            } else if (req.user && req.user.typeId == STRING_CONSTANTS.USER_TYPE.AUTHORIZATION) {
                output = {
                    msg: CONSTANT_OBJ.MESSAGES.AUTHENTICATED
                };
                output = cryptoService.encrypt(JSON.stringify(output));
                return res.status(200).json({ data: output });
            } else {
                output = {
                    error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED
                };
                output = cryptoService.encrypt(JSON.stringify(output));
                return res.status(401).json({ data: output });
            }

        } else {
            output = {
                error: CONSTANT_OBJ.MESSAGES.NOT_AUTHENTICATED,
                message: req.flash('error'),
                successMsg: req.flash('success')
            };
            console.log(output,"else%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%UTU%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");

            output = cryptoService.encrypt(JSON.stringify(output));

            return res.status(401).json({ data: output });
        }
    });

    router.get('/index', function (req, res) {
        res.render('indexAgency.ejs', {
            message: req.flash('error'),
            siteName: siteSetting.siteName,
            mailTo: siteSetting.mailTo,
            host: req.get('host')
        });
    });

    router.get('/404', function (req, res) {
        res.render('pageNotFound.ejs', {
            message: req.flash('error'),
            siteName: siteSetting.siteName,
            mailTo: siteSetting.mailTo,
            host: req.get('host')
        });
    });

    router.get('/authorization', function (req, res) {
        res.render('authorizationIndex.ejs');
    });

    router.get('/agency', function (req, res) {
        res.render('agencyIndex.ejs');
    });

    router.get('/verification', function (req, res) {
        res.render('verificationScreen.ejs');
    });

    router.get('/privacypolicy', function (req, res) {
        res.render('privacypolicy.ejs', {
            message: req.flash('error'),
            siteName: siteSetting.siteName,
            mailTo: siteSetting.mailTo

        });
    });

    router.get('/termsofuse', function (req, res) {
        res.render('termsofuse.ejs', {
            message: req.flash('error'),
            siteName: siteSetting.siteName
        });
    });

    router.post('/resetPassword', authObj.resetPassword);

    router.get('/l_invite/:id', function (req, res) {
        var outputJson;
        models.invite.findOne({
            where: {
                type: 2,
                token: req.params.id
            }
        })
            .then(function (data) {
                if (data.status == false) {
                    res.redirect('/login/agency');

                } else {
                    models.monitoring_contacts.findOne({
                        where: {
                            id: data.dataValues.m_contacts_id
                        }
                    }).then(function (mcontactsObj) {
                        if (!mcontactsObj) {
                            outputJson = {
                                msg: "Contacts does not exist."
                            }
                            res.status(400).json(outputJson);
                        } else {
                            var data = {
                                email: mcontactsObj.dataValues.email,
                                name: mcontactsObj.dataValues.name,
                            }
                            outputJson = {
                                msg: "Please enter your details."
                            }
                            res.render('lovedoneregister.ejs', {
                                email: data.email,
                                name: data.name,
                                token: req.params.id
                            });

                        }

                    })
                }

            });
    });

    router.get('/:id', function (req, res) {
        res.redirect('/404');
    });

    router.get('/invite/emergency', function (req, res) {
        var outputJson;
        var user_agent_value = req.headers['user-agent'];
        models.emergency_contacts.findAll({
            where: {
                token: req.query.token
            }
        })
            .then(function (data) {
                if (data.length > 0) {
                    models.emergency_contacts.findAll({
                        where: {
                            email: data[0].email
                        }

                    })
                        .then(function (data1) {
                            if (data1.length > 0) {
                                if (data1.status == false) {
                                    res.redirect('/login/agency');
                                } else {
                                    var true_counter = 0
                                    var obj = {}
                                    data1.forEach(function (value) {
                                        obj.name = value.name;
                                        obj.email = value.email;
                                        obj.token = value.token;
                                        obj.is_verified = value.is_verified;
                                        if (value.is_verified) {
                                            true_counter = true_counter + 1;
                                        }

                                    })

                                    if (true_counter) {
                                        outputJson = {
                                            msg: "Please enter your details."
                                        }

                                        if (user_agent_value.indexOf("iPhone") > -1 || user_agent_value.indexOf("Android") > -1 || user_agent_value.indexOf("iPad") > -1) {
                                            //send to emergency registaration
                                            res.render('emergecyContactRegistration.ejs', {
                                                email: obj.email,
                                                is_verified: true,
                                                name: obj.name,
                                                token: req.query.token,
                                                patient_id: data.patient_id,
                                                agent_value: user_agent_value
                                            });
                                        } else {
                                            res.render('emergecyContactRegistrationWeb.ejs', {
                                                email: obj.email,
                                                is_verified: true,
                                                name: obj.name,
                                                token: req.query.token,
                                                patient_id: data.patient_id
                                            });
                                        }
                                    } else {
                                        outputJson = {
                                            msg: "Please enter your details."
                                        }
                                        var expired_on = moment(data[0].expired_on).format();
                                        var current_date = moment().format();
                                        if ((expired_on < current_date) && (!data1[0].is_verified)) {
                                            res.render('errEmergencyReg.ejs', {
                                                "message": "Token has expired!"
                                            });
                                            //msg token got expired
                                        } else {
                                            if (user_agent_value.indexOf("iPhone") > -1 || user_agent_value.indexOf("Android") > -1 || user_agent_value.indexOf("iPad") > -1) {
                                                res.render('emergecyContactRegistration.ejs', {
                                                    email: obj.email,
                                                    is_verified: false,
                                                    name: obj.name,
                                                    token: req.query.token,
                                                    patient_id: data.patient_id,
                                                    agent_value: user_agent_value
                                                });
                                            } else {
                                                res.render('emergecyContactRegistrationWeb.ejs', {
                                                    email: obj.email,
                                                    is_verified: false,
                                                    name: obj.name,
                                                    token: req.query.token,
                                                    patient_id: data.patient_id
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        })
                }
            })
    });

    /*index page email function*/
    router.post('/indexmail', function (req, res) {
        var html = '<br/><div style=" width:400px; margin:0px auto; border:1px solid #cecece;padding:10px;"><h5> Details of user who registred in our website: </h5><ul><li><b>Email</b> : ' + req.body.email + '</li><li><b>Location IP</b> : ' + req.body.ip + '</li><li><b>Date/Time</b> : ' + moment(req.body.time).format("MM/DD/YYYY HH:mm:ss") + '</li></ul></div> <br/><br/>  Warmly,<br/>Rose & Judy<br/> Co Founders, Orah Care'
        var sender = ["info@orah.care"]
        //var sender = "suman1459@gmail.com"
        var subject = 'Inquiry from ' + req.body.email;
        mailer.sendMail(sender, html, subject, function (error) {
            if (error) {
                var output = {
                    msg: "You will hear back from us shortly with exciting news."
                }
                output = cryptoService.encrypt(JSON.stringify(output));
                return res.status(400).json({
                    data: output
                });
            } else {
                res.render('indexAgency.ejs', {
                    message: req.flash('error'),
                    successMsg: req.flash('success'),
                    siteName: siteSetting.siteName,
                    host: req.get('host'),
                    mailTo: siteSetting.mailTo
                });

            }

        })
    })
    /*end*/
    app.get('/logout', function (req, res) {
        req.logout();
        output = {
            msg: CONSTANT_OBJ.MESSAGES.LOGGED_OUT,
            status: true
        };
        output = cryptoService.encrypt(JSON.stringify(output));
        return res.status(200).json({ data: output });
    });
    app.use('/', router);
};
