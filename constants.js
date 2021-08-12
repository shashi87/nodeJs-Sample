const messages={
  NOT_AUTHENTICATED: "Not Authenticated",
  EMAIL_NOT_EXIST: "This email id does not exist. Please check your email.",
  EMAIL_SENT_ERR: "There was some error! Email was not sent.",
  
  GET_EMGY_CONT_ERR: "Error while getting emergency contacts, please try again. ",
  UPDT_PTNT_DET_ERR: "Error while updating patient details. Please input valid values. ",
  DEL_EMGNCY_CONT_ERR: "Error while deleting emergency contacts. Please try again. ",
  DEL_MON_CONT_ERR: "Error while deleting monitoring contacts. Please try again. ",
  ADD_EMNCT_CONT_ERR: "Error while adding emergency contacts. Please try again. ",
  PTNT_IMG_MISNG_ERR: "Please provide valid information. Patient's picture is missing.",
  UPDT_PROF_IMG_ERR: "Error while updating profile picture. Please try again. ",
  TAG_INFO_ERR: "Incomplete tag information",
  ALDY_COND_ERR: "This condition is already present in patient's profile",
  ADD_MED_COND_ERR: "Error adding medical condition. Please try again.",
  REM_MED_CON_ERR: "Error removing medical condition. Please try again.",
  DOCMT_ERR: "Incomplete document information",
  REM_PTNT_DOC_ERR: "Error removing patient's document. Please try again.",
  ADD_PTNT_DOC_ERR: "Error while adding document to patient's profile. Please try again.",
  INVALID_ATTCH: "invalid attachments. Please use valid files for documents",
  LICENCE_ERR: "Error while getting all licence types for aide. Please try again.",
  PTNT_DEL_OK: "Patient has been delete successfully.",
  PTN_DELL_ERR: "eErropr while deleting patient. Please try again.",
  AVAILABILITY_ERR: "Invalid availability data. Please try again.",
  AVAILABILITY_SAVE_ERR: "Error while saving availability data. Please try again.",
  EDU_SAVE_ERR: "Error while saving aide's educational data. Please try again.",
  AIDE_DETAIL_SAVE_ERR: "Error while saving aide details. Please try again.",
  PASS_NOT_MATCH: "Please check your password and try again.",
  LANG_SAVE_ERR: "Error while saving aide's language data. Please try again.",
  SERVICE_SAVE_ERR: "Error while saving aide's services data. Please try again.",
  SKILL_SAVE_ERR: "Error while saving aide's expertise and skills data. Please try again.",
  DAILY_ACTIVITIES_SAVE_ERR: "Error while saving aide's daily activity data. Please try again.",
  AIDE_EXP_SAVE_ERR: "Error while saving aide's work experience data. Please try again.",
  AIDE_BG_SAVE_ERR: "Error while saving aide's background check data. Please try again.",
  AIDE_EC_SAVE_ERR: "Error while saving aide's emergency contact data. Please try again.",
  AIDE_ADD_SUCCESS: "Aide has been created successfully.",
  AIDE_UPDATE_ACTIVE_ERR: "Error while creating aide. Please try again.",
  AIDE_DEL_OK: "Aide data delete successfully",
  AIDE_DEL_ERR: "Error while deleting aide data.",
  GET_AIDE_DATA_ERR: "Error while getting aide data.",
  INVALID_AIDE_ID: "Invalid aide id",
  TOKEN_EXPIRED: "Token for reset password has expired!",
  TOKEN_UPDT_ERR: "Error while updating token status.",
  SESSION_EXPIRED: "Session Expired please login again.",
  SSN_INVALID: "Ssn is not registered.",
  DUP_SSN: "Ssn is already registered.",
  CLOCK_IN_WEEK_ERROR: "Schedule data for graph have some issue.",
  SCHEDULE_UPDATE_STATUS_ERR: "Error while updating task status. Please try again.",
  SHOW_VERIFICATION_ERR: "Error while fetching data",
  SCHEDULE_UPDATE_STATUS_SUCCESS: "Task status has been updated successfully.",
  MAIN_SCHD_SV_ERR: "Error while saving patient's schedule data",
  MAIN_SCHD_DEL_ERR: "Error while removing patient's schedule.",
  ACTVTY_ERR: "Error while getting activity data.",
  ACTVTY_SV_ERR: "Error while saving activity data.",
  NO_ACTIVITY: "No activity found to save.",
  AIDE_UPDT_ERR: "Error while updating aide schedule. Missing requierd information.",
  UPDT_MEDIA_TYPE_ERR: "Error while updating activity media type. Please try again later.",
  AIDE_DETAIL_ERROR: "Error getting during aide detail fetching",
  GET_PREV_AIDES_ERR: "Error while getting busy aides.",
  DEL_ALL_ACT_ERR: " Error while trying to delete all activities for a day",
  ACTVTY_UPDT_ERR: "Error while updating activity info. Please try again.",
  ALBUM_GRAPH_ERR: "Something went wrong while getting graph data.",

  /*************CRONFILEERRORS*******************/
  NO_STATUS_REASON: "Something went wrong. No status and faliure reason found.",
  NO_AGENCY_FOUND: "No agency found.",
  GET_AIDE_LOOP_ERR: "Error inside while getting all aides for agencies. Value for that index does not exist.",
  PAT_ALBUM_ERR: "Something went wrong.Please check the date",
  VERIFICATION_PROCESS: "Error getting data",

  /*************ApiERRORS/Messages*******************/
  API_MISSING_EMAIL: "Please provide email id.",
  API_MISSING_ID: "Please provide aide id.",
  API_MISSING_PASS: "Please provide password.",
  API_INVALID_CREDENTIALS: "Invalid credentials.",
  AIDE_REMOTE_WIPE: "You have been disabled. Kindly contact admin",
  API_LOGIN_SUCCESS: "Logged in successfully.",
  API_BLOCKED_MSG: "You are blocked for 24 hours!",
  API_BLOCKED_ACCOUNT: "Your account is blocked!",
  BLOCKED_IP: "Your system IP has been blocked.",
  EMERGENCY_SIGNUP_SUCCESS: "Contact registered successfully. Now you can use the created password with the registered email to login through mobile app.",
   /*************24 Jan, 2019*******************/
  AIDE_EXIST_ANOTHER_AGENCY :"Email is already registered with another agency",
  INVITED_EMAIL_MISMATCH : "Entered email does not match with invited email.",
  CONTACT_ALREADY_REGISTERED : "Contact already registered.",
  CHECK_AND_TRY_AGAIN : "Kindly check and try again.",
  AGENCY_ALREADY_EXIST : "Email id already exists.",
  CHECK_EXISTING_PASSWORD : "Please check your existing password and try again.",
  TRY_DIFFERENT_PASSWORD : "New password should not be same as old password.",
  IOS_APP_UPDATE_ALERT :"Crucial updates have been made! Please update from the apple store.",
  ANDROID_APP_UPDATE_ALERT : "Crucial updates have been made! Please update from the google play store.",
  DEVICE_TOKEN_NOT_FOUND: "Device token not found.",
  DEVICE_ID_NOT_FOUND : "Device Id not found.",
  DEVICE_TYPE_NOT_FOUND : "Device type not found.",
  SCHEDULE_NOT_FOUND : "No schedule found for this date.",
  SERVER_ERROR : "Server error.",
  LOGIN_TOKEN_EXPIRED : "Invalid token. Please login again.",
  END_DATE_MISSING : "Please provide end date.",
  INVALID_DURATION : "Invalid duration value. Please provide a valid duration.",
  LOGGED_OUT : "Logged out successfully.",
  FEEDBACK_EMAIL_SENT : "Email sent to the concern person successfully. Thank you for your feedback.",
  STATUS_UPDATED : "Status changed successfully.",
  DATA_FETCHING_ERROR : "Error getting data.",
  NOTIFICATION_SETTING_ALERT : "Notifications will be received in your device as per setting selected by you",
  MIN_APP_VERSION_SUCCESS_MSG : "Set min app version successfully.",
  MIN_APP_VERSION_ERROR_MSG : "Set min app version error.",
  FIRST_NAME_MISSING : "Please enter First Name.",
  MISSING_DATA_MSG : "Data is missing.",
  LAST_NAME_MISSING : "Please enter Last Name.",
  ADDRESS_MISSING : "Please enter address.",
  CITY_STATE_ZIP_MISSING : "Please enter city, state, zip.",
  GENDER_MISSING : "Please select gender.",
  DATE_OF_BIRTH_MISSING: "Please select date of birth.",
  GENERAL_INFO_SAVE_ERROR : "Patient general information save error.",
  ADD_PATIENT_ERROR : "Patient create error.",
  EMERGENCY_CONTACT_EXIST : "A contact with same email already exists.",
  FILE_NOT_FOUND : "No file found!",
  UPLOADED_SUCCESSFULLY : "Uploaded Successfuly.",
  AGENCY_CREATED_SUCCESSFULLY : "Agency Created Successfuly.",
  LARGE_FILE_SIZE_ERROR: "File size is too large.",
  INVALID_FILE_TYPE : "File type not allowed.",
  PHYSICIANS_SAVE_ERROR: "Physician save error.",
  PATIENT_HISTORY_ERROR: "Error: Patient History.",
  MEDICATIONS_SAVE_ERROR : "Medication save error.",
  SUPPLEMENTS_SAVE_ERROR : "Supplement save error.",
  INSURERS_SAVE_ERROR : "Insurers save error.",
  MEDICAL_INFO_SAVE_ERROR: "Error: Medical general info save error.",
  LICENCE_SAVE_ERROR : "Licence save error.",
  MEDICARE_SAVE_ERROR :"Medicare save error.",
  AGENCY_INFO_SAVE_ERROR : "Agency Information save error.",
  EMERGENCY_CONTACT_SAVE_ERROR: "Emergency contact save error.",
  MEDICATIONS_UPDATE_ERROR: "Medication update error.",
  SUPPLEMENT_UPDATE_ERROR : "Supplement update error.",
  PHYSICIANS_UPDATE_ERROR: "Physician update error.",
  INSURERS_UPDATE_ERROR : "Insurers update error.",
  SUCCESS_DELETE_MSG: "Deleted successfully.",
  ERROR_DELETE_MSG : "Not able to delete.Please try again.",
  SUBSTITUTION_SUCCESS_MSG : "Substitute has been added successfully.",
  SUBSTITUTION_ERROR_MSG : "Substitution save error.",
  UPDATE_SCHEDULE_ERROR : "Error while updating schedule.",
  VERFICATION_REQ_SUCCESS_MSG: "Verfication requested successfully.",
  VERIFICATION_ALREADY_EXIST: "Verification has already been requested for this activity.",
  NOTIFICATION_SAVE_ERROR : "Error while saving notification.",
  VERIFICATION_SAVE_ERROR: "Error while saving verification.",
  FAILED_TASK_SUCCESS_MSG: "Task marked as failed successfully.",
  //8 feb
  AIDE_SERVICE_ERROR : 'Error while deleting aide service.',
  INVITATION_EMAIL_ERROR : 'Error while sending invitation email.',
  PASSWORD_REQUIRED : 'Password is required.',
  PASSWORD_CHARACTER_REQUIRED : 'Password should contain at least 8 characters.',
  PASSWORD_UPPER_CASE_REQUIRED : 'Password should contain at least 1 uppercase.',
  PASSWORD_NUMBER_REQUIRED: 'Password should contain at least 1 number.',
  SUCCESS_PASSWORD : 'ok',
  INVALID_CAPTCHA : 'Invalid captcha.',
  ENTER_VALID_EMAIL : 'Please enter valid email.',
  AIDE_EXIST : 'Email already exist.',
  NO_RECORD_FOUND : 'No Record Found.',
  AUTHENTICATED : 'Authenticated.',
  VERIFY_DETAILS: 'Please verify details and try again.',
  UPDATE_ERROR_MSG : 'Erorr while performing action.',
  SCREENSHOT_NOTIFICATION_MSG : 'Notification saved successfully.',
  CHECK_LAST_TWO_PASSWORD: "Password should not match with last 2 passwords."

}

const timeSlots={
  MORNING_START: {
    HOURS: 8,
    MINS: 30
  },
  MORNING_END: {
    HOURS: 12,
    MINS: 30
  },
  AFTERNOON_START: {
    HOURS: 12,
    MINS: 00
  },
  AFTERNOON_END: {
    HOURS: 16,
    MINS: 30
  },
  EVENING_START: {
    HOURS: 16,
    MINS: 00
  },
  EVENING_END: {
    HOURS: 22,
    MINS: 30
  },
  OVERNIGHT_START: {
    HOURS: 22,
    MINS: 00
  },
  OVERNIGHT_END: {
    HOURS: 9,
    MINS: 00
  },

}

const weekdays=[
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const twilio={
  
}

const urls={
  
  // BASE_URL: 'http://54.245.183.179/',
  //BASE_URL: 'http://localhost:4200/',

}

var FFMPEG_PATH='/opt/ffmpeg/';

const multerLimits = {
  ALLOWED_IMAGE_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp"
  ],
  ALLOWED_IMAGE_MIME_TYPES_DOCS: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf",
    "text/plain",
    'application/x-download'
  ],
  MAX_ALLOWED_SIZE: 5000000,
  MAX_ALLOWED_SIZE_APP: 20000000
}



var obj={
  MULTER_LIMITS: multerLimits,
  MESSAGES: messages,
  TIME_SLOTS: timeSlots,
  WEEK_DAYS: weekdays,
  TWILIO: twilio,
  URLS: urls,
  MAX_FAILED_ATTEMPTS: 4,
  /*CAPTCHA_SECRET_KEY: '6Ld9lV4UAAAAAPcrpcctm7mUL9xCfxwPl7ZX2Ulf',*/
  CAPTCHA_SECRET_KEY:'6LeSYcYUAAAAAAUhioCSc02e816pCHF-nKOeEuVj',
  API_KEY: apiKey,
  SERVER_CONSTANTS: serverConstants,
  PUSH_NOTIFICATION: pushNotification,
  SITE_SETTING : siteSetting,
  DEEP_LINK_CONSTANT : deepLinkConstant
};
module.exports=obj;

