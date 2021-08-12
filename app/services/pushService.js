//exports.sendPush = function(type, token, message) {
var models = require("../models");
var moment = require("moment");
var fs = require('fs');
var path = require("path");
var root = process.cwd();
var CONSTANT_OBJ = require(path.resolve(root, 'constants.js'));
var bundleIdentifier = CONSTANT_OBJ.PUSH_NOTIFICATION.IOS_BUNDLE_INDENTTIFIER;
var androidAideServerKey = CONSTANT_OBJ.PUSH_NOTIFICATION.ANDROID_AIDE_SERVER_KEY;
var STRING_CONSTANTS = require("../constants/stringConstants.js");
exports.sendPush = function(value,message) {
    var path = require('path');
    //console.log("Path is " , path.resolve('./config/ios/pushcert.pem') );
    if(value.aide.device_type === STRING_CONSTANTS.DEVICE_TYPE.IOS){
        sendToIOS(value.aide.device_token, message,value);
    }
    if (value.aide.device_type === STRING_CONSTANTS.DEVICE_TYPE.ANDROID) {
        sendToAndroid(value.aide.device_token, message, value);
    }
};


    var apns = require('apn');
    function sendToIOS(deviceToken, message,value) {
        var data = {};
        data.date = Date.now();
        var endDate = moment(data.date);
        var startDate = moment(data.date);;
        startDate.set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        });
        endDate.set({
            hour: 23,
            minute: 59,
            second: 59,
            millisecond: 999
        });
        models.verification_requests.find({
            where:{
                date: {gte: startDate.toDate(),lte:endDate.toDate()},
                aide_activities: value.id
            }}
        ).then(function(data){
            if(!data){
                var apns = require('apn');
                var path = require('path');
                var deviceTokenArray = [ /*"31338985f27ac69a9ac3f1a0ab7b5b9c0885d10d26af10562afd501e7f64cba5" ,*/ deviceToken];
                var errorCallback = function(err, notif) {
                    console.log('ERROR : ' + err + '\nNOTIFICATION : ' + notif);
                }
                var options = {
                  token: {
                    key: path.resolve('./config/ios/APNsAuthKey_7ZLWCHPLF2.p8'),
                    keyId: "7ZLWCHPLF2",
                    teamId: "DEW6D46636"
                  },
                  production: true
                };

                options.gateway = "gateway.push.apple.com" ;
                var apnsConnection = new apns.Provider(options);
                var note = new apns.Notification();
                note.expiry = Math.floor(Date.now() / 1000) + 3600;
                note.payload = {
                    "schedule_id": value.scheduled_id,
                    "activity_id": value.id,
                    "patient_id":value.patient_id,
                    "aide_id":value.aide_id
                     }
                note.sound = 'ping.aiff';
                note.topic = bundleIdentifier;
                note.alert=message
                note.badge = 1;
                apnsConnection.send(note, deviceTokenArray).then(function(result) {
                    fs.appendFile('./ioscareplannotification.log', JSON.stringify(result)+',\n', (err) => {
                     if (err) throw err;
                        });
                    // body...
                })
                function log(type) {
                    return function() {
                        console.log(type, arguments, arguments.toString('utf-8'));
                    }
                }
            }else{
                console.log('data found')
            }
        })
    }
    /*push for android*/
var FCM = require('fcm-push');

function sendToAndroid(deviceToken, message, value) {
    var fcm = new FCM(androidAideServerKey);
    var data = {};
    data.date = Date.now();
    var endDate = moment(data.date);
    var startDate = moment(data.date);
    startDate.set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    });
    endDate.set({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999
    });
    models.verification_requests.find({
        where: {
            date: {
                gte: startDate.toDate(),
                lte: endDate.toDate()
            },
            aide_activities: value.id
        }
    }).then(function(data) {
        if (!data) {
            var msg = {
                to: deviceToken, // required fill with device token or topics
                collapse_key: 'green',
                data: {
                "schedule_id": value.scheduled_id,
                "activity_id": value.id,
                "patient_id": value.patient_id,
                "aide_id": value.aide_id
                },
                notification: {
                    //"click_action" : ".DashboardActivity",
                    "title" : "Orah ",
                    body: message
                }
            };
            fcm.send(msg)
                .then(function(response) {
                    console.log("Successfully sent with response: ", response);
                })
                .catch(function(err) {
                    console.log("Something has gone wrong!");
                    console.error(err);
                })

        } else {
            console.log('data found')
        }
    })
}
/*________________________________________________________________________
* @Date:            2 Jan 2018
* @Method :         sendIOSVersionPush
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         push notification to user when that are using the older app version.
_________________________________________________________________________
*/

exports.sendIOSVersionPush = function(type, deviceToken, message, value) {
    var data = {};
    var deviceTokenArray =  ['399025D29DFE356804F3ABE3838244DAB7ECFDC859DE57C563150F36DFEF52A6'/*deviceToken*/];
    var errorCallback = function(err, notif) {
        console.log('ERROR : ' + err + '\nNOTIFICATION : ' + notif);
    }
    var options = {
      token: {
        key: path.resolve('./config/ios/APNsAuthKey_7ZLWCHPLF2.p8'),
        keyId: "7ZLWCHPLF2",
        teamId: "DEW6D46636"
      },
      production: true
    };

    options.gateway = "gateway.push.apple.com" ;
    var apnsConnection = new apns.Provider(options);
    var note = new apns.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.payload = {
        "type": type,
        "aide_id":value
    }
    note.sound = 'ping.aiff';
    note.topic = bundleIdentifier;
    note.alert = message
    note.badge = 1;
    apnsConnection.send(note, deviceTokenArray).then(function(result) {
        console.log('result >>', JSON.stringify(result))
    })
    function log(type) {
        return function() {
            console.log(type, arguments, arguments.toString('utf-8'));
        }
    }

}

/*________________________________________________________________________
* @Date:            2 Jan 2018
* @Method :         sendAndroidVersionPush
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         push notification to user when that are using the older app version.
_________________________________________________________________________
*/
exports.sendAndroidVersionPush = function(type, deviceToken, message, value) {
    var fcm = new FCM(androidAideServerKey);
    var data = {};
    data.date = Date.now();
    var msg = {
        to: 'fGEsnrsvWPE:APA91bER7fJrkEnYg7d10KjKhd8uZ2ajJ-LxRU38R7nncL4b_w3kXcZCZ3SpLr-ieR4NqppoyBBoToWwcDZD17aADh0GF_llytWgfItu84x01O8twhJwpMsJyqXnD2b2RClxY1D1WyZa', //deviceToken, // required fill with device token or topics
        collapse_key: 'green',
        data: {
            "type": type,
            "aide_id": value.id,
            "appversion" : value.appversion
        },
        notification: {
            //"click_action" : ".LoginActivity",
            "title" : "Orah ",
            body: message
        }
    };
    fcm.send(msg)
        .then(function(response) {
            console.log("Successfully sent with response: ", response);
        })
        .catch(function(err) {
            console.log("Something has gone wrong!");
            console.error(err);
        })
}

/*________________________________________________________________________
* @Date:            2 Jan 2018
* @Method :         sendIOSPatientUpdate
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         push notification to aide ios device on patient edit profile.
_________________________________________________________________________
*/

exports.sendIOSPatientUpdate = function(type, deviceToken, message, value) {
    var data = {};
    var deviceTokenArray =  [deviceToken];
    var errorCallback = function(err, notif) {
        console.log('ERROR : ' + err + '\nNOTIFICATION : ' + notif);
    }
    var editDate = moment().unix();
    var options = {
      token: {
        key: path.resolve('./config/ios/APNsAuthKey_7ZLWCHPLF2.p8'),
        keyId: "7ZLWCHPLF2",
        teamId: "DEW6D46636"
      },
      production: true
    };

    options.gateway = "gateway.push.apple.com" ;
    var apnsConnection = new apns.Provider(options);
    var note = new apns.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.payload = {
        type: type,
        value: value,
        date : editDate,
        msg : message
    }
    note.sound = 'ping.aiff';
    note.topic = bundleIdentifier;
    note.alert = message
    note.badge = 1;
    apnsConnection.send(note, deviceTokenArray).then(function(result) {
        console.log('result >>', JSON.stringify(result))
    })
    function log(type) {
        return function() {
            console.log(type, arguments, arguments.toString('utf-8'));
        }
    }

}

/*________________________________________________________________________
* @Date:            2 Jan 2018
* @Method :         sendAndroidPatientUpdate
* Created By:       smartData Enterprises Ltd
* Modified On:      -
* @Purpose:         push notification to aide android device on patient edit profile.
_________________________________________________________________________
*/
exports.sendAndroidPatientUpdate = function(type, deviceToken, message, value) {
    var fcm = new FCM(androidAideServerKey);
    var data = {};
    data.date = Date.now();
    var editDate = moment().unix();
    var msg = {
        to:  deviceToken, // required fill with device token or topics
        collapse_key: 'green',
        data: {
            type: type,
            value: value,
            date : editDate,
            msg : message
        },
        notification: {
            //"click_action" : ".DashboardActivity",
            "title" : "Orah ",
            body: message
        }
    };
    fcm.send(msg)
        .then(function(response) {
            console.log("Successfully sent with response: ", response);
        })
        .catch(function(err) {
            console.log("Something has gone wrong!");
            console.error(err);
        })
}
