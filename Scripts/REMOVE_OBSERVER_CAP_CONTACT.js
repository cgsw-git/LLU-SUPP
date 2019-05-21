/* 
The script will reomve the Observer contact from all Department record types

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

batchJobName = "Remove Observer CAP Contact";
showDebug = true;
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
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
logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
  var startDate = new Date();
  var startTime = startDate.getTime();			// Start timer
  var successfulRemoves = 0;
  var failedRemoves = 0;
  var recordCount = 0;
  var vCAPListResult = aa.cap.getByAppType("EnvHealth", "Department", null, null);
  var vCapList = null;
  if (vCAPListResult.getSuccess()) {
    var apsArray = vCAPListResult.getOutput();
  } else {
    logMessage("main: ERROR", "ERROR: Getting Records, reason is: " + vCAPListResult.getErrorType() + ":" + vCAPListResult.getErrorMessage());
  }
  for (thisApp in apsArray) // for each  each license app
  {
    var pCapId = null;
    thisCap = apsArray[thisApp];
    capId = thisCap.getCapID();
    capIDString = capId.getCustomID();
    capName = thisCap.getSpecialText();
    capStatus = thisCap.getCapStatus();
    
    thisCapModel = thisCap.getCapModel();
    var capContactResult = aa.people.getCapContactByCapID(capId);

    if (capContactResult.getSuccess()) capContactArray = capContactResult.getOutput();

    if (capContactArray.length > 0 && thisCapModel.getCapStatus()) 
    {
      recordCount ++;
      for (var i in capContactArray) 
      {
        // logDebug("main contact loop: contact " + aa.util.add(i,1) );
        var con = capContactArray[i];
        var thisContact = con.getCapContactModel();
        var searchFN = thisContact.getFirstName();
        var contactSeqNumber = thisContact.getContactSeqNumber();
        if (searchFN == "Observer") {
          var removeResult = aa.people.removeCapContact(capId, contactSeqNumber)
          if (removeResult.getSuccess()) 
          {
            aa.print("Successfully removed: " + searchFN + " number " + contactSeqNumber + " from " + capIDString );
            successfulRemoves++;
          }else{
            aa.print("Unable to remove: " + searchFN + " number " + contactSeqNumber + " from " + capIDString );
            failedRemoves++
          }
        }
      }
    }
  }
  aa.print("successfully removed " + successfulRemoves + " contacts from " + recordCount + " records");
  aa.print("failed to remove " + failedRemoves + " contacts");
}


