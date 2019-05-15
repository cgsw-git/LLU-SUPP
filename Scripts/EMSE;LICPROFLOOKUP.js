include("EMSE:GlobalFlags");
logDebug("Using LICENSESTATE = " + LICENSESTATE + " from EMSE:GlobalFlags");
//Issue State;
LICENSETYPE = "";
//License Type to be populated;
licCapId = null;
isNewLic = false;
licIDString = null;
licObj = null;
licCap = null;
include("EMSE:LicProfLookup:getLicenses");
//Get License CAP;
if (licCapId !=null) {
include("EMSE:LicProfLookup:getLicenseType");
stateLicense = getAppSpecific("State License Number",licCapId);
}
licObj = licenseProfObject(stateLicense ,LICENSETYPE);
//Get LicArray;
if (!licObj.valid && lookup("LICENSED PROFESSIONAL TYPE",LICENSETYPE) != null) {
include("EMSE:LicProfLookup:CreateLP");
licObj = licenseProfObject(stateLicense ,LICENSETYPE );
}
if (licObj.valid) {
include("EMSE:LicProfLookup:UpdateLP");
} else {
logDebug("LP Not found to update");
}