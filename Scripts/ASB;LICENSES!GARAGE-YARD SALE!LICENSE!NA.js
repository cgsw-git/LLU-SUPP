contFirstName = ApplicantFirstName;
contLastName = ApplicantLastName;
if (CurrentUserID.substr(0, 10) == "PUBLICUSER") {
contactList = aa.env.getValue("ContactList");
contactArray = contactList.toArray();
contFirstName = contactArray[0].getFirstName();
contLastName = contactArray[0].getLastName();
}
var cnv = 0;
message = "";
cnt = cntAssocGarageSales(AddressHouseNumber, AddressStreetName, AddressCity, AddressState,
AddressZip, contFirstName, contLastName);
if (cnt >= 3) {
showMessage = true;
cancel = true;
}