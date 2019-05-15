if (wfTask == "License Issuance" && wfStatus == "Issued" && balanceDue > 0) {
showMessage = true;
cancel = true;
comment("Cannot issue this license with a balance greater than zero");
}
var marijuanaRecords = appMatch("Licenses/Business/Marijuana Medical Center/Application") ||
appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Application"); var marijuanaRetailRecords =
appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Application") ||
appMatch("Licenses/Business/Marijuana Retail Store/Application") || 
appMatch("Licenses/Business/Marijuana Ret Testing Facility/Application");

if(marijuanaRecords && wfTask == "Application Intake" && wfStatus == "Complete" && balanceDue > 0){
showMessage = true ;
cancel = true ;
comment("The balance must be paid in full at the Cashier to move forward");
}
if(marijuanaRetailRecords)
include("WTUB Marijuana Retail App");