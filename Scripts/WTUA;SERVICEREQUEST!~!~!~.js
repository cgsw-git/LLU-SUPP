//if(wfTask == "SR Intake" && wfStatus == "Assigned")
// include("EMSE:ServiceRequestSendEmail");
if(wfTask == "SR Intake" && wfStatus == "Duplicate"){
closeTask("Final Notification","Notification Sent"), include("EMSE:ServiceRequestCloseCase");
}
if(wfTask == "SR Intake" && wfStatus == "Referred"){
closeTask("Final Notification","Notification Sent"), include("EMSE:ServiceRequestCloseCase");
}
if(wfTask == "Final Notification" && wfStatus == "Send Email")
include("EMSE:ServiceRequestCloseCase");
if(wfTask == "Final Notification" && wfStatus == "No Notification Sent")
include("EMSE:ServiceRequestCloseCase");