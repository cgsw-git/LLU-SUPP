var RIP = appMatch("Licenses/Business/Marijuana Ret Infu Prod Mfg/Application");
var ROP = appMatch("Licenses/Business/Marijuana Ret Opt Prem Culti/Application");
var RS = appMatch("Licenses/Business/Marijuana Retail Store/Application");
var RTF = appMatch("Licenses/Business/Marijuana Ret Testing Facility/Application");
if(RIP && wfTask == "State Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_100","LIC_MJ_GEN","FINAL",1,"Y");
if(RIP && wfTask == "City Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_110","LIC_MJ_GEN","FINAL",1,"Y");
if(ROP && wfTask == "State Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_190","LIC_MJ_GEN","FINAL",1,"Y");
if(ROP && wfTask == "City Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_200","LIC_MJ_GEN","FINAL",1,"Y");
if(RS && wfTask == "State Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_160","LIC_MJ_GEN","FINAL",1,"Y");
if(RS && wfTask == "City Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_170","LIC_MJ_GEN","FINAL",1,"Y");
if(RTF && wfTask == "State Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_130","LIC_MJ_GEN","FINAL",1,"Y");
if(RTF && wfTask == "City Application Intake" && wfStatus == "Ready to Pay")
updateFee("LIC_140","LIC_MJ_GEN","FINAL",1,"Y");
if(wfTask == "City Application Intake" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(wfTask == "City Application Intake" && wfStatus == "Void")
taskCloseAllExcept("Void", "Updated by Workflow Task update after event");
if(wfTask == "City Application Intake" && wfStatus == "Denied")
taskCloseAllExcept("Denied ", "Updated by Workflow Task update after event");
if(wfTask == "Quality Control" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(!RS && wfTask == "Quality Control" && wfStatus == "Complete")
scheduleInspection("Excise and Licenses Inspection", 0, currentUserID);
if(RS && wfTask == "Hearing Preparation" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(RS && wfTask == "Posting" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(RS && wfTask == "Hearing" && wfStatus == "Approved")
scheduleInspection("Excise and Licenses Inspection", 0, currentUserID);
if(RS && wfTask == "Hearing" && wfStatus == "Approved with Condition")
scheduleInspection("Excise and Licenses Inspection", 0, currentUserID);
if(RS && wfTask == "Hearing" && wfStatus == "Opposed")
editTaskDueDate(wfTask, dateAdd(false, 10));
if(RS && wfTask == "Hearing" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(RS && wfTask == "Appeal" && wfStatus == "Denial Overturned")
scheduleInspection("Excise and Licenses Inspection", 0, currentUserID);
if(RS && wfTask == "Appeal" && wfStatus == "Denial Upheld")
taskCloseAllExcept("Closed-Denied", "Updated by Workflow Task update after event");
if(wfTask == "Inspection" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(wfTask == "State License" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(wfTask == "State License" && wfStatus == "Denied")
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");
if(wfTask == "License Issuance" && wfStatus == "Issued"){
include("LIC Establish Links to Reference Contacts");
include("LIC Issue Marijuana License");
}
if(wfTask == "License Issuance" && wfStatus == "Withdrawn")
taskCloseAllExcept("Withdrawn", "Updated by Workflow Task update after event");
if(wfTask == "License Issuance" && wfStatus == "Denied")
taskCloseAllExcept("Denied", "Updated by Workflow Task update after event");