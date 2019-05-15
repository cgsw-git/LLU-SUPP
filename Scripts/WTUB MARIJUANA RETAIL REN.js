if(wfTask == "Renewal Review" && wfStatus == "Complete" && balanceDue > 0){
showMessage = true ;
cancel = true ;
comment("WARNING: The balance must be paid in full to move forward.");
}
if(wfTask == "State License" && wfStatus == "Complete" && (AInfo["State License Number"]==null ||
AInfo["State License Expiration Date"]==null)){
showMessage = true ;
cancel = true ;
comment("WARNING: The State License Number or State License Expiration Date need to be filled in order to select this status.");
}
if(wfTask == "State License" && wfStatus == "Complete" && (AInfo["State License Expiration Date"]!=null)&&
(dateDiff(AInfo["State License Expiration Date"],aa.date.getCurrentDate())>0)){
showMessage = true ;
cancel = true ;
comment("WARNING: The State License Expiration Date needs to be current in order to select this status.");
}