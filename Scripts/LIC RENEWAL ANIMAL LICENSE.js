var licenseDuration= {License Duration};
var vaccExpirationDate= {Vaccination Expiration Date};
vaccinationExpirationDate=aa.util.parseDate(vaccExpirationDate);
monthsToInitialExpire = licenseDuration*12-12;
var ignore = lookup("EMSE:ASI Copy Exceptions","License/*/*/*");
var ignoreArr = new Array();
if(ignore != null)
ignoreArr = ignore.split("|");
copyAppSpecific(licCapId,ignoreArr);
expResult = aa.expiration.getLicensesByCapID(licCapId).getOutput().getExpDate();
expDate = expResult.getMonth() + "/" + expResult.getDayOfMonth() + "/" + expResult.getYear();
tmpNewDate = dateAddMonths(expDate, monthsToInitialExpire);
tmpNewDateTodateAdd=dateAdd(tmpNewDate,0);
dateAdds=aa.util.parseDate(tmpNewDateTodateAdd+"");
var temp = vaccinationExpirationDate.after(dateAdds)?dateAdds:vaccinationExpirationDate;
newTemp=aa.util.formatDate(temp, "MM/dd/YYYY");
if(licCapId){
thisLic = new licenseObject(licIDString,licCapId) ;
thisLic.setExpiration(newTemp) ;
thisLic.setStatus("Active");
)
if(licCapId){
changeCapContactTypes("Applicant","License Holder", licCapId);
}
if(licCapId)
copyOwner(capId, licCapId);
if(licCapId)
copyASITables(capId,licCapId);