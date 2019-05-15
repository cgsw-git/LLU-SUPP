newLic = null;
newLicId = null;
newLicIdString = null;
newLicenseType = "Event";
monthsToInitialExpire = 12;
newLicId = createParent(appTypeArray[0], appTypeArray[1], appTypeArray[2], "License",null);
// create the license record;
if (newLicId) {
newLicIdString = newLicId.getCustomID();
updateAppStatus("Active","Originally Issued",newLicId);
editAppName(AInfo["Event Title"],newLicId);
var ignore = lookup("EMSE:ASI Copy Exceptions","License/*/*/*");
var ignoreArr = new Array();
if(ignore != null) ignoreArr = ignore.split("|");
copyAppSpecific(newLicId,ignoreArr);
}
tmpNewDate = dateAddMonths(null, monthsToInitialExpire);
if (newLicId) {
thisLic = new licenseObject(newLicIdString,newLicId);
thisLic.setExpiration(dateAdd(tmpNewDate,0));
thisLic.setStatus("Active");
}
if (newLicId) {
changeCapContactTypes("Applicant","License Holder", newLicId);
}
if (newLicId) {
copyOwner(capId, newLicId);
}
if (newLicId) {
copyASITables(capId,newLicId);
}