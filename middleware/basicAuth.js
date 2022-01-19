"use strict";
//========================== Load Modules Start ===========================
var auth = require('basic-auth');
//========================== Load internal Module =========================
var config = require('../config').cfg;
//========================== Load Modules End =============================

var basicAuthentication = (request, response, next) => {
    if (request.method == 'OPTIONS') {
        response.status(200).end();
    }
    var credentials = auth(request);
    if (!credentials || credentials.name !== config.basicAuth.username || credentials.pass !== config.basicAuth.password) {
        response.statusCode = 401
        response.setHeader('WWW-Authenticate', 'Basic realm="example"')
        response.send({
            message: 'Access denied'
        })
    } else {
        next();
    }
}

module.exports = {
    basicAuthentication
}