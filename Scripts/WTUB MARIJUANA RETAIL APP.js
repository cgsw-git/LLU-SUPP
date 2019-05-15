if(wfTask == "State Application Intake" && wfStatus == "Complete" && balanceDue > 0){
showMessage = true ;
cancel = true ;
comment("The balance must be paid in full to move forward.");
}

if(wfTask == "City Application Intake" && wfStatus == "Complete" && balanceDue > 0){
showMessage = true ;
cancel = true ;
comment("The balance must be paid in full to move forward.");
}
if(wfTask == "City Application Intake" && (wfStatus == "Scheduled" || wfStatus == "Re-Scheduled") &&
(AInfo["Appointment Date"] == null || AInfo["Appointment Time"] == null)){
showMessage = true ;
cancel = true ;
comment("The Appointment Date and Time must be populated.");
}
if(wfTask == "State License" && wfStatus == "Complete" && (AInfo["State License Number"] == null ||
AInfo["State License Expiration Date"] == null)){
showMessage = true ;
cancel = true ;
comment("The License State Number and Expiration Date Need to be filled.");
}
if(wfTask == "Hearing Preparation" && (wfStatus == "Pre-Hearing Scheduled" || 
wfStatus == "Hearing Scheduled" || wfStatus == "Posting Scheduled") && (AInfo["Pre-Hearing Date"] == null || 
AInfo["Pre-Hearing Time"] == null)){
showMessage = true ;
cancel = true ;
comment("The Pre-Hearing Date and Time must be set before selecting this status.");
}
if(wfTask == "Posting" && wfStatus == "Complete"&& !getInspResultByInspType(capId, "Posting Inspection").equals("Not Found") && 
!getInspResultByInspType(capId, "Posting Inspection").equals("Passed")){
showMessage = true;
cancel = true ;
comment("The Posting Inspection must be Passed in order to move forward.");
}
if(wfTask == "Posting" && wfStatus == "Complete" && getInspResultByInspType(capId, "Posting Inspection").equals("Not Found")){
showMessage = true;
cancel = true;
comment("No Posting Inspection has been scheduled for this application.");
}