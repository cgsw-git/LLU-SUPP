showDebug = true;
showMessage = true;
var marijuanaRecords = appMatch("Licenses/Business/Marijuana Medical Center/Application") ||
appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Application");
if(marijuanaRecords && inspType == "Excise and Licenses Inspection" && inspResult == "Passed"){
branchTask("Inspections","Complete","Updated by Inspection Result","Note");
}
if(marijuanaRecords && inspType == "Excise and Licenses Inspection" && inspResult == "Failed"){
message="WARNING: All Inspections must be passed before completing the Inspection Workflow Task <br> <br>";
debug=message;
}
var marijuanaRetailRecords = appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Application") ||
appMatch("Licenses/Business/Marijuana Retail Store/Application") || 
appMatch("Licenses/Business/Marijuana Ret Testing Facility/Application");
if(marijuanaRetailRecords && inspType == "Excise and Licenses Inspection" && inspResult == "Passed"){
branchTask("Inspection","Complete","Updated by Inspection Result","Note");
}
if(marijuanaRetailRecords && inspType == "Excise and Licenses Inspection" && inspResult == "Failed"){
message="WARNING: All Inspections must be passed before completing the Inspection Workflow Task<br><br>";
debug=message;
}