var licenseDuration= AInfo['License Duration'];
var vaccExpirationDate= AInfo['Vaccination Expiration Date'];
vaccinationExpirationDate=aa.util.parseDate(vaccExpirationDate);
newLic = null;
newLicId = null;
newLicIdString = null;
newLicenseType = "Animal";
monthsToInitialExpire = licenseDuration*12;
newLicId = createParent(appTypeArray[0], appTypeArray[1], appTypeArray[2], "License",null);
// create the license record;
if (newLicId) {
newLicIdString = newLicId.getCustomID();
updateAppStatus("Active","Originally Issued",newLicId);
editAppName(AInfo["Pet Name"],newLicId);
var ignore = lookup("EMSE:ASI Copy Exceptions","License/*/*/*");
var ignoreArr = new Array();
if(ignore != null) ignoreArr = ignore.split("|");
copyAppSpecific(newLicId,ignoreArr);
}
tmpNewDate = dateAddMonths(null, monthsToInitialExpire);
tmpNewDateTodateAdd=dateAdd(tmpNewDate,0);
dateAdds=aa.util.parseDate(tmpNewDateTodateAdd+"");
var temp = vaccinationExpirationDate.after(dateAdds)?dateAdds:vaccinationExpirationDate;
newTemp=aa.util.formatDate(temp, "MM/dd/YYYY");
if (newLicId) {
thisLic = new licenseObject(newLicIdString,newLicId);
thisLic.setExpiration(newTemp);
thisLic.setStatus("Active");
}
if (newLicId) {
changeCapContactTypes("Pet Owner","License Holder", newLicId);
}
if (newLicId) {
copyOwner(capId, newLicId);
}
if (newLicId) {
copyASITables(capId,newLicId);
}