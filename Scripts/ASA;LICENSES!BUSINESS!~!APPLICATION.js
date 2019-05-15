var marijuanaRecords = appMatch("Licenses/Business/Marijuana Medical Center/Application") ||
appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Application") ||
appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Application") ||
appMatch("Licenses/Business/Marijuana Retail Store/Application") || 
appMatch("Licenses/Business/Marijuana Ret Testing Facility/Application");
if(!marijuanaRecords)
updateFee("LIC_010","LIC_BUSINESS_GENERAL","FINAL",1,"Y");
if(!marijuanaRecords)
updateFee("LIC_020","LIC_BUSINESS_GENERAL","FINAL",1,"Y");