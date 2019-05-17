/* 
Batch Script
*/
//
//
/*------------------------------------------------------------------------------------------------------/
| Program: SE Date of Event passed.js  Trigger: Batch
| Client: ID 325
|
| Version 1.0 - Base Version. 07/22/2013 
| Note: 05-11-2013 dont check the Rain date.
| 06-13-2013 Amir Razavi, set the CAP status at the end
| 07-01-2013 Amir Razavi, CAP Status is set to Expired instead of Complete per Jason M.
| 07-22-2013 FA, All Night permit uses ASI instead of ASIT for event date
| 10-14-2013 FA, send email notification
| 08-15-2014 FA, NYELS-50863
| 03-26-2019 Michael Zachry, modified to only pull Department record types
| 03-26-2019 Michael Zachry, removed exteranious function method and attribute printing
| 03-26-2019 Michael Zachry, removed exteranious department record number printing
| 04-16-2019 Michael Zachry, completed modifications to use for fixing the reference contacts and adding missing public users
/------------------------------------------------------------------------------------------------------*/
/* 
The script will:

select all Department record types
  selects all the contacts on the Department record
  evaluates each contact for a referenceSeqNumber
  checks if a contact with a referenceSeqNumber with the email address already exists on the record
  adds a reference contact to the record when one does not exist
  deletes the original transactional contact if a contact with a refSeqNumber exists or was successfully added
checks for a public user and adds one if one does not exist
activates the public user
links the reference contact to the public user

*/

emailText = "";
maxSeconds = 4.5 * 60; // number of seconds allowed for batch processing, usually < 5*60
message = "";
br = "<br>";
var debug = ""; // Debug String
/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 3.0
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName) {
  vScriptName = vScriptName.toUpperCase();
  var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
  var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
  return emseScript.getScriptText() + "";
}

batchJobName = "Link xContact to RefContact";
showDebug = true;

//showDebug = aa.env.getValue("showDebug").substring(0, 1).toUpperCase().equals("Y");
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
//batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;

batchJobID = 0;
if (batchJobResult.getSuccess()) {
  batchJobID = batchJobResult.getOutput();
  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
} else
  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var currentDate = new Date();
var day = currentDate.getDate();
var month = currentDate.getMonth() + 1;
var year = currentDate.getFullYear();
var dTodaysDate = month + "/" + day + "/" + year;
logDebug("Today's Date:" + dTodaysDate);
var useAppSpecificGroupName = false;
var startDate = new Date();
var timeExpired = false;
var startTime = startDate.getTime(); // Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput(); //

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
logDebug("Start of Job");
mainProcess();
//logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
  var startDate = new Date();
  var startTime = startDate.getTime();			// Start timer

  logDebug("in MainProcess");
  var capFilterType = 0
  var capCount = 0;
  var capIDlst = "";
  //build empty cap list
  var emptyGISArray = new Array();
  var emptyCm = aa.cap.getCapModel().getOutput();
  var emptyCt = emptyCm.getCapType();
  var skippedContacts = 0;
  var noReferenceContactFound = 0;
  var addedReferenceContacts = 0;
  var nullRefPeopleOutput = 0;
  var errorAddingContact = 0;
  var contactsRemoved = 0;
  var publicUserFound = 0;
  var publicUserMissing = 0;
  var publicUsersCreated = 0;
  var preExistingReferenceContact = 0;
  var noEmail = 0;
  var inactiveRecords = 0;
  var publicUsersDisabled = 0;
  var errorsSettingAsPrimary = 0;
  var errorsRemovingTransactional = 0;
  var isObserver = false;
  var observersAdded = 0;
  emptyCt.setGroup("Planning");
  emptyCt.setType(null);
  emptyCt.setSubType(null);
  emptyCt.setCategory(null);
  emptyCm.setCapType(emptyCt);
  logDebug("main: emptyCt type: " + emptyCt.getClass());
  logDebug("main: emptyCM type: " + emptyCm.getClass());
  var vCAPListResult = aa.cap.getByAppType("EnvHealth", "Department", null, null);
  logDebug("main: vCapListResult: " + vCAPListResult.getSuccess());

  var vCapList = null;
  if (vCAPListResult.getSuccess()) {
    var apsArray = vCAPListResult.getOutput();
    logDebug("main: apsArray length: " + vCAPListResult.getOutput().length);
  } else {
    logMessage("main: ERROR", "ERROR: Getting Records, reason is: " + vCAPListResult.getErrorType() + ":" + vCAPListResult.getErrorMessage());
  }
  logDebug("main: apsArray class: " + apsArray.getClass());
  if (vCapList != null) {
    aa.print(vCapList.length);
  }
  for (thisApp in apsArray) // for each  each license app
  {
    var pCapId = null;
    thisCap = apsArray[thisApp];
    capId = thisCap.getCapID();
    // logDebugObject(capId);
    capIDString = capId.getCustomID();
    capName = thisCap.getSpecialText();
    capStatus = thisCap.getCapStatus();
    
    //exit or continue loop
    // if (capIDString != "FA0000041") continue;
    // if (thisApp < 400) continue;
    if (thisApp == 400) break;
    
    aa.print("************ START *****************");
    aa.print("capId:" + capId.getCustomID());
    thisCapModel = thisCap.getCapModel();
    logDebug("Record status: " + thisCapModel.getCapStatus() );
    if (thisCapModel.getCapStatus() == "Inactive" ) inactiveRecords++; 
    // logDebugObject(thisCapModel);
    // break;

    // get contacts on the record
    var capContactResult = aa.people.getCapContactByCapID(capId);
    if (capContactResult.getSuccess()) capContactArray = capContactResult.getOutput();

    // var capContactArray = getContactArray(capId);
    if (capContactArray.length > 0 ) 
    {
      aa.print("Department: " + capIDString + " has " + capContactArray.length + " contacts");
      
      //loop through the contacts checking if the contact has a refSeqNumber
      for (var i in capContactArray) 
      {
        logDebug("main contact loop: contact " + aa.util.add(i,1) );
        var con = capContactArray[i];
        // var thisContact = con;
        // var searchLN = thisContact.lastName;
        // var searchFN = thisContact.firstName;
        // var searchFullN = thisContact.fullName;
        // var refSeqNumber = thisContact.refSeqNumber;
        // var contactSeqNumber = thisContact.contactSeqNumber;
        // var email = thisContact.email;

        var thisContact = con.getCapContactModel();
        var searchLN = thisContact.getLastName();
        var searchFN = thisContact.getFirstName();
        if (searchFN == "Observer") isObserver = true ;
        var searchFullN = searchFN + " " + searchLN;
        var refSeqNumber = thisContact.getRefContactNumber();
        var contactSeqNumber = thisContact.getContactSeqNumber();
        var email = thisContact.getEmail();
        var primaryFlag = thisContact.getPrimaryFlag();
        // logDebugObject(thisContact);
        // break;
        
        //if the contact does not have a refSeqNumber, search for a contact by name
        if (refSeqNumber == null || refSeqNumber == "") 
        {
          aa.print("fullName: " + searchFullN + " with contact number " + contactSeqNumber + " does not have a reference number");

          //check if the person has a contact with a reference seq number on this record
          //if true, remove the contact without the reference seq number
          var referenceContactNumber = checkContactArrayForDuplicateWithReference(capContactArray, searchFN, searchLN);
          if (referenceContactNumber) 
          {
            // if the transactional contact is the primary contact, set the reference contact as the primary contact on the record
            if (primaryFlag == "Y") 
            {
              logDebug("found match with reference : transactional contact " + contactSeqNumber + " is primary");
              if (contactSetPrimary(referenceContactNumber)) {
                logDebug("found match with reference : set contact " + referenceContactNumber + " as primary");
                var removeResult = aa.people.removeCapContact(capId, contactSeqNumber)
                if (removeResult.getSuccess()) 
                {
                  contactsRemoved++;
                  logDebug("found match with reference : contact " + contactSeqNumber + " removed from record " + capId.getCustomID());
                }else{
                  logDebug("found match with reference : error removing contact from record " + contactSeqNumber + " : " + removeResult.getErrorMessage());
                }
              }else{
                logDebug("found match with reference : could not set contact " + referenceContactNumber + " as primary");
              }
            }else{
              logDebug("found match with reference : transactional contact " + contactSeqNumber + " is not primary");
              var removeResult = aa.people.removeCapContact(capId, contactSeqNumber)
              if (removeResult.getSuccess()) 
              {
                contactsRemoved++;
                logDebug("found match with reference : contact removed from record " + capId.getCustomID());
              }else{
                logDebug("found match with reference : error removing contact from record " + capId.getCustomID() + " : " + removeResult.getErrorMessage());
              }
            }
          }else{
            refPeople = aa.people.getPeopleByFMLName(searchFN, null, searchLN);
            if (refPeople.getSuccess()) 
            {
              refPeopleOutput = refPeople.getOutput();
              if (refPeopleOutput) 
              {
                //if more than one reference contacts were found, log it and move to the next contact on the record
                //if only one contact exist, add it to the record
                if (refPeopleOutput.length == 1) 
                {
                  // add new reference contact
                  // remove transactional contact
                  referenceContactNumber = myAddReferenceContactByName(searchFN, null, searchLN);
                  if (referenceContactNumber) 
                  {
                    //a bug was discovered in addReferenceContactByName where in some situations it returns the
                    //contactSeqNumber of a previously existing contact instead of the newly added contact
                    //find the correct referenceContactObject for the newly added reference contact
                    referenceContactNumber = checkContactArrayForDuplicateWithReference(capContactArray, searchFN, searchLN);
                    if (referenceContactNumber) {
                      logDebug("no match found with reference : the correct referenceContactNumber is: " +referenceContactNumber);
                    }else{
                      errorAddingContact++;
                      logDebug("no match found with reference : unable to resolve similar names");
                      continue;
                    }
                    addedReferenceContacts++;
                    // if the transactional contact is the primary contact, set the reference contact as the primary contact on the record
                    if (primaryFlag == "Y") 
                    {
                      logDebug("no match found with reference : transactional contact " + contactSeqNumber + " is primary");
                      if (contactSetPrimary(referenceContactNumber)) {
                        logDebug("no match found with reference : set contact " + referenceContactNumber + " as primary");
                        var removeResult = aa.people.removeCapContact(capId, contactSeqNumber)
                        if (removeResult.getSuccess()) 
                        {
                          contactsRemoved++;
                          logDebug("no match found with reference : contact " + contactSeqNumber + " removed from record " + capId.getCustomID());
                        }else{
                          logDebug("no match found with reference : error removing contact from record " + contactSeqNumber + " : " + removeResult.getErrorMessage());
                          errorsRemovingTransactional++;
                        }
                      }else{
                        logDebug("no match found with reference : could not set contact " + referenceContactNumber + " as primary");
                        errorsSettingAsPrimary++;
                      }
                    }else{
                      logDebug("no match found with reference : transactional contact " + contactSeqNumber + " is not primary");
                      var removeResult = aa.people.removeCapContact(capId, contactSeqNumber)
                      if (removeResult.getSuccess()) 
                      {
                        contactsRemoved++;
                        logDebug("no match found with reference : contact removed from record " + capId.getCustomID());
                      }else{
                        logDebug("no match found with reference : error removing contact from record " + capId.getCustomID() + " : " + removeResult.getErrorMessage());
                      }
                    }
                  } else {
                    errorAddingContact++;
                    logDebug("Error: unable to find reference contact exact match for " + searchFN + " " + searchLN);
                  }
                  
                } else {
                  logDebug("no match found with reference : Skipped " + searchFN + " " + searchLN + " for multiple or no reference contact matches");
                  skippedContacts++;
                }
              } else {
                logDebug("no match found with reference : No matching reference contact found");
                nullRefPeopleOutput++;
              }
            } else {
              logDebug("no match found with reference : Error getting reference contact for " + searchFN + " " + searchLN );
              noReferenceContactFound++;
            }
          }
        } else {
          //aa.print("fullName: " + searchFN + " " + searchLN + " is contact number: " + contactSeqNumber + " and reference contact: " + refSeqNumber ) ;
          // aa.print("fullName: " + searchFN + " " + searchLN + " has reference and cap contact numbers: " + refSeqNumber + " " + contactSeqNumber ) ;
          logDebug("pre-existing reference contact");
          preExistingReferenceContact++;
          referenceContactNumber = true;
        }
        
        //public user section
        if (email != null && referenceContactNumber) 
        {
          referenceContactNumber = false;
          // var pos = email.indexOf("TURNED_OFF");
          // if (pos > 0 ) 
          // {
            // var email = email.substring(0, pos);
          // }else{
            // var email = email;
          // }
          myResult = myCreatePublicUserFromContactEmail(email)
          if (myResult) 
          {
            if (myResult == "disabled") {
              publicUsersDisabled++ ;
            }else{
              if (myResult) publicUsersCreated++ ;
            }
          }else{
            publicUserMissing++;
          }
        }else{
          logDebug("public user section: No email or reference contact, cannot process public user");
          noEmail++;
        }
      }  //contact loop
    } else { // if (capContactResult.getSuccess())
      logDebug("No contacts on record " + capId.getCustomID());
    }
    if (!isObserver) {
      logDebug("Adding Observer as reference contact")
      referenceContactNumber = myAddReferenceContactByName("Observer", null, "Observer");
      (referenceContactNumber) ? logDebug("successfully added reference contact observer") : logDebug("unable to add reference contact observer")
      if(referenceContactNumber) {observersAdded++; }
    }else{
      logDebug("Reference contact Observer already exists");
      isObserver = false;
    }
    capCount++;
  }  // department loop

  logDebug("********************************");
  // logDebug("Ignored due to application type: " + capFilterType);
  logDebug("Records processed: " + capCount);
  logDebug("Inactive records: " + inactiveRecords);
  // logDebug("All CAPS processed list: " + capIDlst);
  logDebug("Pre-existing reference contacts: " + preExistingReferenceContact);
  logDebug("Reference contacts added: " + addedReferenceContacts);
  logDebug("Contacts skipped for multiple or no exact reference contact matches " + skippedContacts);
  logDebug("No matching reference contact " + nullRefPeopleOutput );
  logDebug("Errors adding reference contact: " + errorAddingContact);
  logDebug("Transactional contacts removed: " + contactsRemoved);
  logDebug("Error removing transactional contact: " + errorsRemovingTransactional);
  logDebug("Errors setting reference contact to primary: " + errorsSettingAsPrimary);
  logDebug("Error getting reference contacts: " + noReferenceContactFound);
  logDebug("Public users unable to create: " + publicUserMissing + "   No email: " + noEmail );
  logDebug("Public users found or created: " + publicUsersCreated);
  logDebug("Public users disabled: " + publicUsersDisabled );
  logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

}

function checkContactArrayForDuplicateWithReference(contactArray, firstname, lastname) {
  // var thisContactArray = contactArray;
  var capContactResult = aa.people.getCapContactByCapID(capId);
  if (capContactResult.getSuccess()) thisContactArray = capContactResult.getOutput();
  for (var h in thisContactArray) {
    // logDebug("checkContactArrayForDuplicateWithReference: firstname = " + thisContactArray[h].firstName + "  lastname = " + thisContactArray[h].lastName + "  refSeqNumber = " + thisContactArray[h].getCapContactModel().getContactSeqNumber() );
    if (firstname == thisContactArray[h].firstName && lastname == thisContactArray[h].lastName && thisContactArray[h].getCapContactModel().getRefContactNumber()) {
      logDebug("checkForMatchWithReference: Found match with refSeqNumber");
      return thisContactArray[h].getCapContactModel().getContactSeqNumber();
    } 
  }
  logDebug("checkForMatchWithReference: Did not find match with refSeqNumber");
  return false;
}

function logDebugObject(myObject) {
/*
usage - logDebugObject(object)

author - Michael Zachry
created - 10/10/2018

updates
10/11/2018 - initial version

*/
  //list the methods
  try {
    logDebug("object is is a " + myObject.getClass());
    logDebug("object has the following methods:");
    for (x in myObject) {
      if (typeof(myObject[x]) == "function" ) {
        logDebug("  " + x);
      }
    }
  } catch (err) {
    logDebug("A JavaScript Error occured: " + err.message);
  }
  try {
    //list the properties and values    
    logDebug("object has the following properties and values:");
    for (x in myObject) {
      if (typeof(myObject[x]) != "function" ) {
        logDebug("  " + x + " = " + myObject[x]);
      }
    }
  } catch (err) {
    logDebug("A JavaScript Error occured: " + err.message);
  }
}


function myCreatePublicUserFromContactEmail(contactEmail)   // optional: Contact Type, default Applicant
{
  // var contactType = "Applicant";

  var contact;
  var refContactNum;
  var userModel;
  // return false;
  // if (arguments.length > 0) contactType = arguments[0]; // use contact type specified
  var capContactResult = aa.people.getCapContactByCapID(capId);
  // var capContactResult = getContactObjsBySeqNbr(capId,capContactNumber)
  if (capContactResult.getSuccess()) 
  {
    var Contacts = capContactResult.getOutput();
    for (var yy in Contacts) 
    {
      // contactType = Contacts[yy].getCapContactModel().getPeople().getContactType();
      // logDebug(contactType);
      // return false;
      
      // logDebug("CreatePublicUserFromContact: " + Contacts[yy].getCapContactModel().refContactNumber);
      // logDebug("CreatePublicUserFromContact: " + contactEmail + " = " + Contacts[yy].getCapContactModel().getPeople().getEmail());
      // logDebug("CreatePublicUserFromContact: " +contactEmail == Contacts[yy].getCapContactModel().getPeople().getEmail());
      if (contactEmail.equals(Contacts[yy].getCapContactModel().getPeople().getEmail()) && Contacts[yy].getCapContactModel().refContactNumber != null )
      {
        // && Contacts[yy].getCapContactModel().refContactNumber != null))
        contact = Contacts[yy];
      

        // logDebug(contact.getPeople().getContactTypeFlag());
        // return false;
        if (contact.getPeople().getContactTypeFlag() != null && contact.getPeople().getContactTypeFlag().equals("organization"))
        {
          logDebug("CreatePublicUserFromContact: **Warning: couldn't create public user for " + contactEmail + ", the contact is an organization"); 
          // return false; 
        }else{
    
          // get the reference contact ID.   We will use to connect to the new public user
          refContactNum = contact.getCapContactModel().getRefContactNumber();

          // check to see if public user exists already based on email address
          var getUserResult = aa.publicUser.getPublicUserByEmail(contact.getEmail())
          if (getUserResult.getSuccess() && getUserResult.getOutput()) 
          {
            userModel = getUserResult.getOutput();
            logDebug("CreatePublicUserFromContact: Found an existing public user: " + userModel.getUserID() + " " + contact.getEmail());

            var myResult = aa.publicUser.checkPublicUserAccountInAgency(userModel).getOutput()
            // logDebug("myResult = " + myResult);
            if (myResult == true) {
              logDebug("public user has status of enabled");
            }else{
              logDebug("public user has status of disabled, attempting to enable");

              // activate account
              userModel.setAuditStatus("A"); //enable account
              userModel.setStatusOfV360User("ACTIVE"); //activate publicUser
              aa.publicUser.editPublicUser(userModel);

              // activate user
              logDebug("activate user: " + aa.publicUser.activatePublicUser(userModel.UUID).getOutput() );
              
              // activate for agency
              var userSeqNum = userModel.userSeqNum;
              logDebug("activateing userSeqNum " + userSeqNum + " for agency");
              var userPinBiz = aa.proxyInvoker.newInstance("com.accela.pa.pin.UserPINBusiness").getOutput()
              userPinBiz.updateActiveStatusAndLicenseIssueDate4PublicUser(servProvCode,userSeqNum,"ADMIN");
            
              var myResult = aa.publicUser.checkPublicUserAccountInAgency(userModel).getOutput()
              if (myResult == true) {
                logDebug("status was successfully changed to enabled");
              }else{
                logDebug("status was not changed to enabled");
              }

              if (refContactNum) 
              {
                logDebug("CreatePublicUserFromContact: Linking this public user with reference contact : " + refContactNum);
                aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refContactNum);
              }
              return "disabled";
            }

            //  Now that we have a public user let's connect to the reference contact		
            if (refContactNum) 
            {
              logDebug("CreatePublicUserFromContact: Linking this public user with reference contact : " + refContactNum);
              aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refContactNum);
              logDebug("activate user: " + aa.publicUser.activatePublicUser(userModel.UUID).getOutput() );
            }
            return userModel;
          }else{

            // if (!userModel && refContactNum) 
            // { // create one
            logDebug("CreatePublicUserFromContact: creating new user based on email address: " + contact.getEmail()); 
            var publicUser = aa.publicUser.getPublicUserModel();
            // logDebugObject(publicUser);
            publicUser.setFirstName(contact.getFirstName());
            publicUser.setLastName(contact.getLastName());
            publicUser.setEmail(contact.getEmail());
            // publicUser.setUserID(contact.getEmail());
            var myEmail = contact.getEmail();
            if (myEmail.indexOf("@") > 0) publicUser.setUserID(myEmail.substring(0,myEmail.indexOf("@")));
            // publicUser.setPassword("e8248cbe79a288ffec75d7300ad2e07172f487f6"); //password : 1111111111
            myResult = aa.publicUser.encryptPassword("password");
            if (myResult.getSuccess) {
              publicUser.setPassword(myResult.getOutput());
              logDebug("CreatePublicUserFromContact: Password successfully set");
            }else{
              logDebug("CreatePublicUserFromContact: **Warning: unable to set password");
            }
            publicUser.setAuditID("PublicUser");
            publicUser.setAuditStatus("A");
            publicUser.setCellPhone(contact.getCapContactModel().getPeople().getPhone2());
            publicUser.setAccountType("CITIZEN");
            publicUser.setNeedChangePassword("Y");
            publicUser.setPasswordRequestQuestion("lluh");
            publicUser.setPasswordRequestAnswer("lluh");

            var result = aa.publicUser.createPublicUser(publicUser);
            if (result.getSuccess()) 
            {

              logDebug("CreatePublicUserFromContact: Successfully created public user " + contact.getEmail() );
              var userSeqNum = result.getOutput();
              var userModel = aa.publicUser.getPublicUser(userSeqNum).getOutput()

              // create for agency
              aa.publicUser.createPublicUserForAgency(userModel);

              // activate for agency
              var userPinBiz = aa.proxyInvoker.newInstance("com.accela.pa.pin.UserPINBusiness").getOutput()
              userPinBiz.updateActiveStatusAndLicenseIssueDate4PublicUser(servProvCode,userSeqNum,"ADMIN");

              //  Now that we have a public user let's connect to the reference contact		
              if (refContactNum) 
              {
                logDebug("CreatePublicUserFromContact: Linking this public user with reference contact : " + refContactNum);
                aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refContactNum);
              }
              // logDebugObject(userModel);
              return userModel; // send back the new or existing public user
            }else{
              logDebug("CreatePublicUserFromContact: **Warning creating public user " + contact.getEmail() + "  failure: " + result.getErrorMessage()); 
              return false;
            }
          }
        } // contact type organization - skip
      }else{
        // logDebug("CreatePublicUserFromContact: email does not match or no reference number");
      }// if email matches
    } // contacts loop
  }else{
    logDebug("CreatePublicUserFromContact: unable to get contacts");
    return false;
  }//if get contacts
}


function myAddReferenceContactByName(vFirst, vMiddle, vLast)
{
	var userFirst = vFirst;
	var userMiddle = vMiddle;
	var userLast = vLast;

	//Find PeopleModel object for user
	var peopleResult = aa.people.getPeopleByFMLName(userFirst, userMiddle, userLast);
	if (peopleResult.getSuccess())
	{
		var peopleObj = peopleResult.getOutput();
		//logDebug("myAddReferencContactByName: peopleObj is "+peopleObj.getClass());
    if (peopleObj==null)
    {
      logDebug("myAddReferencContactByName: No reference user found.");
      return false;
    }else{
      logDebug("myAddReferencContactByName: Number of reference contacts found: "+peopleObj.length);
      // logDebugObject(peopleObj);
      if(peopleObj[0].firstName != vFirst || peopleObj[0].lastName != vLast)
      {
        // logDebugObject(peopleObj[0]);
        logDebug("peopleObj.firstName = " + peopleObj[0].firstName + "   vFirst = " + vFirst);
        logDebug("peopleObj.lastName = " + peopleObj[0].lastName + "   vLast = " + vLast);
        logDebug("myAddReferencContactByName: No exact name match found");
        return false;
      }
    }
	}else{
    logDebug("myAddReferencContactByName: **ERROR: Failed to get reference contact record: " + peopleResult.getErrorMessage());
    return false;
  }

	var capContactResult = aa.people.getCapContactByCapID(capId);
	if (capContactResult.getSuccess()) {
    var Contacts = capContactResult.getOutput();
    logDebug("myAddReferencContactByName: capContacts before " + Contacts.length);
  }else{
    logDebug("myAddReferencContactByName: did not get capContacts before");
  }

	//Add the reference contact record to the current CAP
	var contactAddResult = aa.people.createCapContactWithRefPeopleModel(capId, peopleObj[0]);
	if (contactAddResult.getSuccess())
		{
		logDebug("myAddReferencContactByName: Contact successfully added to CAP.");
		var capContactResult = aa.people.getCapContactByCapID(capId);
		if (capContactResult.getSuccess())
			{
			var Contacts = capContactResult.getOutput();
			var idx = Contacts.length;
      logDebug("myAddReferencContactByName: capContacts after " + Contacts.length);
			var contactNbr = Contacts[idx-1].getCapContactModel().getPeople().getContactSeqNumber();
			logDebug ("myAddReferencContactByName: Contact Nbr = "+contactNbr);
			return contactNbr;
			}
		else
			{
			logDebug("myAddReferencContactByName: **ERROR: Failed to get Contact Nbr: "+capContactResult.getErrorMessage());
			return false;
			}
		}
	else
		{
			logDebug("myAddReferencContactByName: **ERROR: Cannot add contact: " + contactAddResult.getErrorMessage());
			return false;
		}
}

