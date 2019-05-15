if (matches(currentUserID,"ADMIN")) {
showDebug = false;
showMessage= false;
}
include("EMSE:SETCONTACTRELATIONSHIPTOCONTACTTYPE");
if (matches(currentUserID,"PUBLICUSER122")) {
include("TESTDRIVE_ASA");
}
editAppSpecific("Application Expiration Date",dateAdd(fileDate,180));