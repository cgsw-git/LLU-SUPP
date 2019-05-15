showMessage = true;
showDebug = true;
//aa.runScriptInNewTransaction("PaymentReceiveAfter4Renew");
include("PaymentReceiveAfter4Renew");
include("EMSE:LicProfLookup");
var licenseDuration = AInfo["License Duration"];
var vaccExpirationDate = AInfo["Vaccination Expiration Date"];
vaccinationExpirationDate = aa.util.parseDate(vaccExpirationDate);
monthsToInitialExpire = licenseDuration * 12 - 12;
var ignore = lookup("EMSE:ASI Copy Exceptions", "License/*/*/*");
var ignoreArr = new Array();
if (ignore != null)
ignoreArr = ignore.split("|");
copyAppSpecific(licCapId, ignoreArr);
editAppName(AInfo["Pet Name"],licCapId);
expResult = aa.expiration.getLicensesByCapID(licCapId).getOutput().getB1Expiration().getExpDate();
tmpNewDate = dateAddMonths(expResult, monthsToInitialExpire);
tmpNewDateTodateAdd = dateAdd(tmpNewDate, 0);
dateAdds = aa.util.parseDate(tmpNewDateTodateAdd + "");
var temp = vaccinationExpirationDate.after(dateAdds) ? dateAdds : vaccinationExpirationDate;
newTemp = aa.util.formatDate(temp, "MM/dd/YYYY");
if (licCapId != null) {
licIDString = licCapId.getCustomID();
}
if (licCapId) {
logDebug("*************updating license status and expiration date************");
thisLic = new licenseObject(licIDString, licCapId);
thisLic.setExpiration(newTemp);
thisLic.setStatus("Active");
}
if (licCapId) {
changeCapContactTypes("Applicant", "License Holder", licCapId);
}
if (licCapId) {
copyOwner(capId, licCapId);
}
if (licCapId) {
copyASITables(capId, licCapId);
}