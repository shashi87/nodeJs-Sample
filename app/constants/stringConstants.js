const STATUS_CONSTANT  = {
    EXEMPT : 'exempt',
    SUCCESS : 'success',
    FAILURE : 'failure',
    ERROR : 'error',
    INCOMPLETE : 'incomplete'
}
const DATE_CONSTANT = {
    DATE_FORMAT : 'Y-MM-DD',
    DATE_TIME_FORMAT :  'Y-MM-DD HH:mm:ss',
    MONTH_YEAR_FORMAT : 'YYYY-MM',
    YEAR_MONTH_FORMAT : 'YYYY-MM-DD HH:mm:ss',
    YEAR_FORMAT :'YYYY-MM-DD',
    YEAR_MONTH_STRING: 'MMMM Do, YYYY'
}
const SORT_ORDER = {
    ASC : 'ASC',
    DESC : 'DESC'
}
const SCHEDULE_TYPE = {
    CLOCK_IN : 1,
    CLOCK_OUT : 2
}
const ROUTES_CONSTANTS = {
    AGENCY_INVITE : 'invite/',
    AGENCY_LOGIN : '/login/agency',
    AIDE_RESET_PASS  : 'aideResetPassword/',
    AIDE_INVITE : 'invite/aide/',
    RESET_PASSWORD : 'resetPassword/',
    BASE_URL : '/',
    INVITE_EMERGENCY_CONTACT : 'invite/emergency?token=',
}
const DEVICE_TYPE = {
    IPHONE : 'iPhone',
    ANDROID : 'Android',
    IPAD : 'iPad',
    IOS  : 'iOS',
    LOWER_CASE_ANDROID : 'android'
}
const EMAIL_SUBJECT = {
    AIDE_FORGOT_PASSWORD : 'Forget Password',
    FORGOT_PASSWORD : 'Forget Password'
}
const EDUCATION = {
    HIGH_SCHOOL : 'highSchool',
    COLLEGE : 'college',
    VOCATIONAL_SCHOOL : 'vocationalSchool',
}
const MEDIA_URL = {
    CROPPED_IMAGE : 'uploads/100X100/',
    PUBLIC_URL : '/../../public/uploads/',
    PUBLIC_IMAGE_URL :'/../../public/uploads/100X100/',
    PUBLIC_VIDEO_URL : '/../../public/uploads/video/',
    PUBLIC_TEMP_URL : '/../../public/uploads/tmp',
    PUBLIC_SIGNATURE_URL :'/../../public/uploads/signature/',

}
const MISC_CONSTANTS = {
    CROP_GRAVITY : 'Center',
    BRANCH_API_URL: 'https://api.branch.io/v1/url'
}
const FILE_CONSTANTS = {
    INDEX_FILE_PATH : '/../../public/adminIndex.html'
}
const USER_TYPE = {
    SUPER_ADMIN : 1,
    AUTHORIZATION : 2,
    AGENCY : 3,
    VERIFICATION : 4
}
const DOCS_URL = {
    RELATIVE_LEGAL_PATH : 'uploads/emergencyLegal/',
    ABSOLUTE_LEGAL_PATH : '/../../public/uploads/emergencyLegal/',
    RELATIVE_PATH : 'uploads/',
    ABSOLUTE_INSURERS_PATH : '/../../public/uploads/insurers/',
    RELATIVE_LEGAL_DOCS : '/../../public/uploads/tmp/',
    LEGAL_DOCS : 'uploads/tmp/',
}
const RECURRENCE_TYPE = {
    TWO_WEEKS : '2 WEEKS',
    WEEK : 'WEEK',
    MONTH : 'MONTH',
    YEAR : 'YEAR',
}

const PARENT_CATEGORY = {
    MEDICAL : 'Medical',
    PERSONAL_CARE_NUTRITION : 'Personal Care / Nutrition',
    CLIENT_ACTIVITY : 'Client Activity',
    HOMEMAKER_SERVICES : 'Homemaker Services',
}
const NOTIFICATION_TYPE = {
    EDIT_PROFILE : '5',
}

var stringObj = {
    STATUS_CONSTANT: STATUS_CONSTANT,
    DATE_CONSTANT : DATE_CONSTANT,
    SORT_ORDER : SORT_ORDER,
    SCHEDULE_TYPE : SCHEDULE_TYPE,
    ROUTES_CONSTANTS : ROUTES_CONSTANTS,
    DEVICE_TYPE : DEVICE_TYPE,
    EMAIL_SUBJECT : EMAIL_SUBJECT,
    EDUCATION : EDUCATION,
    MEDIA_URL : MEDIA_URL,
    MISC_CONSTANTS : MISC_CONSTANTS,
    FILE_CONSTANTS : FILE_CONSTANTS,
    USER_TYPE : USER_TYPE,
    DOCS_URL : DOCS_URL,
    RECURRENCE_TYPE : RECURRENCE_TYPE,
    PARENT_CATEGORY : PARENT_CATEGORY,
    NOTIFICATION_TYPE : NOTIFICATION_TYPE
};
module.exports = stringObj;
