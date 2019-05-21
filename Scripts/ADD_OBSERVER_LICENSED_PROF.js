/* 
Batch Script
*/
//
//
/*------------------------------------------------------------------------------------------------------/
| 
| 
/------------------------------------------------------------------------------------------------------*/

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
  aa.print("Batch Job " + batchJobName + " Job ID is " + batchJobID);
} else
  aa.print("Batch job ID not found " + batchJobResult.getErrorMessage());
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
aa.print("Today's Date:" + dTodaysDate);
var useAppSpecificGroupName = false;
var startDate = new Date();
var timeExpired = false;
var startTime = startDate.getTime(); // Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput(); //

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
aa.print("Start of Job");
mainProcess();
aa.print("End of Job: Elapsed Time : " + elapsed() + " Seconds");
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
  var lpProcessed = 0;

  var queryResult = aa.cap.getByAppType("EnvHealth", "Department", null, null);
  if (queryResult.getSuccess()) {
    var apsArray = queryResult.getOutput();
  } else {
    logMessage("main: ERROR", "ERROR: Getting Records, reason is: " + queryResult.getErrorType() + ":" + queryResult.getErrorMessage());
    return false;
  }
      
  sca = String("09LLU-00000-0009I").split("-");
  sourceCapId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
  
  for (thisApp in apsArray) // for each  each license app
  {
    thisCap = apsArray[thisApp];
    capId = thisCap.getCapID();
    capIDString = capId.getCustomID();
    
    //skip FA0000868
    if (capIDString == "FA0000868" || capIDString.indexOf("FA") == -1 ) {continue;}
    copyLicensedProf(sourceCapId , capId);
    lpProcessed++
  }
  aa.print("Records processed: " + lpProcessed);
}



// function copyLicensedProf(sCapId, tCapId)
// {
	// // Function will copy all licensed professionals from source CapID to target CapID

	// var licProf = aa.licenseProfessional.getLicensedProfessionalsByCapID(sCapId).getOutput();
	// if (licProf != null)
		// for(x in licProf)
		// {
			// licProf[x].setCapID(tCapId);
			// aa.licenseProfessional.createLicensedProfessional(licProf[x]);
			// logDebug("Copied " + licProf[x].getLicenseNbr());
		// }
	// else
		// logDebug("No licensed professional on source");
// }

