var marijuanaRecords = appMatch("Licenses/Business/Marijuana Medical Center/Renewal") ||
appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Renewal") ||
appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Renewal") ||
appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Renewal") ||
appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Renewal") ||
appMatch("Licenses/Business/Marijuana Retail Store/Renewal") || 
appMatch("Licenses/Business/Marijuana Ret Testing Facility/Renewal");
if(!marijuanaRecords){
updateFee("LIC_030", "LIC_BUSINESS_GENERAL", "FINAL", 1, "Y");
include("EMSE:LicProfLookup:getLicenses");
expDate = aa.expiration.getLicensesByCapID(licCapId).getOutput().getB1Expiration().getExpDate();
now = aa.util.now();
tempDate = aa.util.formatDate(now, "MM/dd/YYYY");
today = aa.util.parseDate(tempDate);
today.after(expDate) ? updateFee("LIC_040", "LIC_BUSINESS_GENERAL", "FINAL", 1, "Y") : now;
}