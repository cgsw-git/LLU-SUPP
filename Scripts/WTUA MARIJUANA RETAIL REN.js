var RIP = appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Renewal");
ROP = appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Renewal");
RS = appMatch("Licenses/Business/Marijuana Retail Store/Renewal");
RTF = appMatch("Licenses/Business/Marijuana Ret Testing Facility/Renewal");
parentID = getParentLicenseCapID(capId);
var diff = dateDiff(aa.expiration.getLicensesByCapID(parentID).getOutput().getExpDate(), new Date());
if(RIP && wfTask == "Renewal Review" && wfStatus == "Ready to Pay")
updateFee("LIC_110","LIC_MJ_GEN","FINAL",1,"Y");
if(RIP && wfTask == "Renewal Review" && wfStatus == "Ready to Pay" && diff >0 && diff <=90)
updateFee("LIC_120","LIC_MJ_GEN","FINAL",1,"Y");
if(ROP && wfTask == "Renewal Review" && wfStatus == "Ready to Pay")
updateFee("LIC_200","LIC_MJ_GEN","FINAL",1,"Y");
if(ROP && wfTask == "Renewal Review" && wfStatus == "Ready to Pay" && diff >0 && diff <=90)
updateFee("LIC_210","LIC_MJ_GEN","FINAL",1,"Y");
if(RS && wfTask == "Renewal Review" && wfStatus == "Ready to Pay")
updateFee("LIC_170","LIC_MJ_GEN","FINAL",1,"Y");
if(RS && wfTask == "Renewal Review" && wfStatus == "Ready to Pay" && diff >0 && diff <=90)
updateFee("LIC_180","LIC_MJ_GEN","FINAL",1,"Y");
if(RTF && wfTask == "Renewal Review" && wfStatus == "Ready to Pay")
updateFee("LIC_140","LIC_MJ_GEN","FINAL",1,"Y");
if(RTF && wfTask == "Renewal Review" && wfStatus == "Ready to Pay" && diff >0 && diff <=90)
updateFee("LIC_150","LIC_MJ_GEN","FINAL",1,"Y");
if(wfTask == "Renewal Review" && wfStatus == "Withdrawn"){
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
editAppName("",parentID);
updateAppStatus("Inactive","Withdrawn",parentID);
var lic = new licenseObject(null,parentID);
lic.setStatus("Inactive");
}
if(wfTask == "Renewal Review" && wfStatus == "Complete")
updateTask("State License", "Pending", "", "Updated by Workflow Task update after event");
if(wfTask == "Renewal Review" && wfStatus == "Denied"){
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
editAppName("",parentID);
updateAppStatus("Inactive","Denied",parentID);
var lic = new licenseObject(null,parentID);
lic.setStatus("Inactive");
}
if(wfTask == "State License" && wfStatus == "Withdrawn"){
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
editAppName("",parentID);
updateAppStatus("Inactive","Withdrawn",parentID);
var lic = new licenseObject(null,parentID);
lic.setStatus("Inactive");
}
if(wfTask == "State License" && wfStatus == "Complete"){
updateTask("License Renewal", "Pending", "", "Updated by Workflow Task update after event");
}
if(wfTask == "State License" && wfStatus == "Denied"){
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
editAppName("",parentID);
updateAppStatus("Inactive","Denied",parentID);
var lic = new licenseObject(null,parentID);
lic.setStatus("Inactive");
}
if(wfTask == "License Renewal" && wfStatus == "Renewed"){
aa.runScriptInNewTransaction("WorkflowTaskUpdateAfter4Renew");
editAppName("",parentID);
updateAppStatus("Active","Renewed",parentID);
var lic = new licenseObject(null,parentID);
lic.setStatus("Active");
lic.setExpiration(dateAdd(dateAddMonths(null, 12),0));
}