if(wfTask == "License Issuance" && wfStatus == "Renewed"){
aa.runScriptInNewTransaction("WorkflowTaskUpdateAfter4Renew");
}
var marijuanaRecords = appMatch("Licenses/Business/Marijuana Medical Center/Renewal") ||
appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Renewal") ||
appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Renewal");parentID =
getParentLicenseCapID(capId); var diff =
dateDiff(aa.expiration.getLicensesByCapID(parentID).getOutput().getExpDate(), new Date());
var marijuanaRetailRecords = appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Renewal") ||
appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Renewal") ||
appMatch("Licenses/Business/Marijuana Retail Store/Renewal") || appMatch("Licenses/Business/Marijuana Ret Testing Facility/Renewal");
if(marijuanaRecords && wfTask == "Renewal Review" && wfStatus == "Void"){
taskCloseAllExcept("Void", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "Renewal Review" && wfStatus == "Withdrawn"){
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "Renewal Review" && wfStatus == "Denied"){
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "License Issuance" && wfStatus == "Withdrawn"){
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "License Issuance" && wfStatus == "Denied" ){
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "License Issuance" && wfStatus == "Void"){
taskCloseAllExcept("Void", "Updated by Workflow Task update after event");
}
if(marijuanaRecords && wfTask == "Renewal Review" && wfStatus == "Complete"){
closeTask("License Issuance","Renewed","Updated by workflow task update", "Note");
}
if(marijuanaRecords && wfTask == "Renewal Review" && wfStatus == "Complete" && parentID){
editAppName("",parentID);
updateAppStatus("Active","Renewed",parentID);
var lic = new licenseObject(null,parentID);
lic.setStatus("Active");
lic.setExpiration(dateAdd(dateAddMonths(null, 12),0));
}
if(appMatch("Licenses/Business/Marijuana Medical Center/Renewal") && wfTask == "Renewal Review" &&
wfStatus == "Ready to Pay" && AInfo["State License Number"]!=null && AInfo["State License Expiration Date"]!=null){
updateFee("LIC_020","LIC_MJ_GEN","FINAL",1,"Y");
}
if(appMatch("Licenses/Business/Marijuana Medical Center/Renewal") && wfTask == "Renewal Review" &&
wfStatus == "Ready to Pay" && diff>0 && diff<=90 ){
updateFee("LIC_030","LIC_MJ_GEN","FINAL",1,"Y");
}
if(appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Renewal") && wfTask == "Renewal Review"
&& wfStatus == "Ready to Pay" && AInfo["State License Number"]!=null && AInfo["State License Expiration Date"]!=null ){
updateFee("LIC_050","LIC_MJ_GEN","FINAL",1,"Y");
}
if(appMatch("Licenses/Business/Marijuana Med Infu Prod Mfg/Renewal") && wfTask == "Renewal Review"
&& wfStatus == "Ready to Pay" && diff>0 && diff<=90 ){
updateFee("LIC_060","LIC_MJ_GEN","FINAL",1,"Y");
}
if(appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Renewal") && wfTask == "Renewal Review"
&& wfStatus == "Ready to Pay" && AInfo["State License Number"]!=null && AInfo["State License Expiration Date"]!=null){
updateFee("LIC_080","LIC_MJ_GEN","FINAL",1,"Y");
}
if(appMatch("Licenses/Business/Marijuana Med Opt Prem Culti/Renewal") && wfTask == "Renewal Review"
&& wfStatus == "Ready to Pay" && diff>0 && diff<=90 ){
updateFee("LIC_090","LIC_MJ_GEN","FINAL",1,"Y");
}
if(marijuanaRetailRecords)
include("WTUA Marijuana Retail Ren");