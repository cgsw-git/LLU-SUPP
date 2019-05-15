var marijuanaRecords = appMatch("Licenses/Business/Marijuana Medical Center/Application") ||
appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Application");
var marijuanaRetailRecords = appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Application") ||
appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Application") ||
appMatch("Licenses/Business/Marijuana Retail Store/Application") || 
appMatch("Licenses/Business/Marijuana Ret Testing Facility/Application");
if(!marijuanaRecords && !marijuanaRetailRecords && wfTask == "License Issuance" && wfStatus ==
"Issued"){
include("LIC Establish Links to Reference Contacts");
}
if(!marijuanaRecords && !marijuanaRetailRecords && wfTask == "License Issuance" && wfStatus ==
"Issued"){
include("LIC Issue Business License");
}
if(marijuanaRecords && wfTask == "Application Intake" && wfStatus == "Void"){
taskCloseAllExcept("Void", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "Application Intake" && wfStatus == "Withdrawn"){
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "Application Intake" && wfStatus == "Denied"){
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "Application Intake" && wfStatus == "Complete" ){
scheduleInspection("Excise and Licenses Inspection", 0, currentUserID);
}
if(appMatch("Licenses/Business/Marijuana Medical Center/Application") && wfTask == "Application Intake"
&& wfStatus == "Ready to Pay"){
updateFee("LIC_010","LIC_MJ_GEN","FINAL",1,"Y");
updateFee("LIC_020","LIC_MJ_GEN","FINAL",1,"Y");
}
if(appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Application") && wfTask == "Application Intake"
&& wfStatus == "Ready to Pay"){
updateFee("LIC_040","LIC_MJ_GEN","FINAL",1,"Y");
updateFee("LIC_050","LIC_MJ_GEN","FINAL",1,"Y");
}
if(appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Application") && wfTask == "Application Intake" 
&& wfStatus == "Ready to Pay" ){
updateFee("LIC_070","LIC_MJ_GEN","FINAL",1,"Y");
updateFee("LIC_080","LIC_MJ_GEN","FINAL",1,"Y");
}
if(marijuanaRecords && wfTask == "Inspections" && wfStatus == "Withdrawn" ){
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "Inspections" && wfStatus == "Denied" ){
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "License Issuance" && wfStatus == "Withdrawn"){
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "License Issuance" && wfStatus == "Denied" ){
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "License Issuance" && wfStatus == "Void" ){
taskCloseAllExcept("Void", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "License Issuance" && wfStatus == "Issued"){
branch("LIC Establish Links to Reference Contacts");
branch("LIC Issue Marijuana License");
}
if (marijuanaRetailRecords)
include("WTUA Marijuana Retail App");