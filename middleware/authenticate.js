"use strict";
//========================== Load Modules Start ===========================


//========================== Load internal Module =========================
var exceptions = require("../customException.js");
var jwtHandler = require("../jwtHandler");

const userService=require('./../modules/user/service');
const adminService=require('./../modules/admin/service');
//========================== Load Modules End =============================

var expireToken = (req, res, next) =>
    jwtHandler.expireToken(req).then(result => {
            //return result;
            next();
        })
        .catch(err => {
            next(err);
        });


const adminAuthenticateTkn = (req, res, next) => {
    var acsToken = req.get("accessToken");
    if(acsToken){
    jwtHandler.verifyToken(acsToken)
        .then(paylod => {
            return adminService.getById(paylod);
        }).then(user=>{
            if(user){
                req.user =user;
                next();
            }
            //else throw exceptions.completeCustomException('admn_n_exst')
        }).catch(err => {
            next(err);
        });
    }else throw exceptions.unauthorizeAccess();
}
var verifyClientSecreate = (req, res, next) => {
    //  req.body=JSON.parse(req.body);
    var clientSecret = req.body.clientSecret;

    console.log("jsonData...", clientSecret);
    if (clientSecret != "Mi6lhaR10HyWOxjMqITx3ONWHFkTcHuebIZPYNi1") {
        throw exceptions.invalidClientSecreate();
    }
    next();
};

//========================== Export Module Start ===========================

module.exports = {
    adminAuthenticateTkn,
    expireToken,
    verifyClientSecreate
};

//========================== Export Module End ===========================