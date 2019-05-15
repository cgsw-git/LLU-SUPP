iArr = new Array();
// attributes to ignore;
contactTypeArray = new Array("Applicant","Business Owner",
"Corporate Officer","Director","Manager","Officer","Partner","President","Respondent","Shareholder");
if (!feeEstimate) {
createRefContactsFromCapContactsAndLink(capId,contactTypeArray,iArr,false,false,
comparePeopleGeneric);
}