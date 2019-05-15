var marijuanaRecords = appMatch("Licenses/Business/Marijuana Medical Center/Renewal") ||
appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Renewal") ||
appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Renewal");
var marijuanaRetailRecords = appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Renewal") ||
appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Renewal") ||
appMatch("Licenses/Business/Marijuana Retail Store/Renewal") || appMatch("Licenses/Business/Marijuana Ret Testing Facility/Renewal");

if(marijuanaRecords && wfTask == "Renewal Review" && wfStatus == "Complete" && balanceDue > 0){
showMessage = true ;
cancel = true ;
comment("WARNING: The balance must be paid in full to move forward.");
}
if(marijuanaRecords && wfTask == "Renewal Review" && wfStatus == "Ready to Pay" && (AInfo["State License Number"]==null || AInfo["State License Expiration Date"]==null)){
showMessage = true ;
cancel = true ;
comment("WARNING: The State License Number or State License Expiration Date need to be filled in order to select this status.");
}
if(marijuanaRetailRecords)
include("WTUB Marijuana Retail Ren");