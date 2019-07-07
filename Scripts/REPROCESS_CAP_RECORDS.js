
	/*------------------------------------------------------------------------------------------------------/
	| Program: CAPViolationsNotificationBatch.js  Trigger: Batch
	| Client: LLU

	| Version 1.0 - Base Version. 12/27/2018
	|
	/------------------------------------------------------------------------------------------------------*/
	/*------------------------------------------------------------------------------------------------------/
	|
	| START: USER CONFIGURABLE PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/


	emailText = "";
	message = "";
	br = "<br>";
	debug = "";
	/*------------------------------------------------------------------------------------------------------/
	| BEGIN Includes
	/------------------------------------------------------------------------------------------------------*/
	SCRIPT_VERSION = 3.0

	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
	eval(getScriptText("INCLUDES_BATCH"));
	eval(getScriptText("INCLUDES_CUSTOM"));


	function getScriptText(vScriptName){
		vScriptName = vScriptName.toUpperCase();
		var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
		var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
		return emseScript.getScriptText() + "";
	}

	/*------------------------------------------------------------------------------------------------------/
	|
	| END: USER CONFIGURABLE PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/


  showDebug = true;
  showMessage = true;
	sysDate = aa.date.getCurrentDate();
	batchJobResult = aa.batchJob.getJobID()
	batchJobName = "" + aa.env.getValue("BatchJobName");
	wfObjArray = null;

	batchJobID = 0;
	if (batchJobResult.getSuccess())
	{
	  batchJobID = batchJobResult.getOutput();
	  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
	  } else {
	  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
  }

	/*----------------------------------------------------------------------------------------------------/
	|
	| Start: BATCH PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/
  

	/*----------------------------------------------------------------------------------------------------/
	|
	| End: BATCH PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/




	/*------------------------------------------------------------------------------------------------------/
	| <===========Main=Loop================>
	|
	/-----------------------------------------------------------------------------------------------------*/
try {

	var systemUserObj = aa.person.getUser("ADMIN").getOutput();
  var currentUserID = "ADMIN";
  var startDate = new Date();
  var startTime = startDate.getTime();			// Start timer
  var skippedDepartments = 0;
  var processedDepartments = 0;
  var noMatch = 0;
  var rowsProcessed = 0;
  var totalNoMatch = 0;
  var totalRowsProcessed = 0;
  var totalErrors = 0;
  
  var wfComment; // to accomodate customization that was done to getRecordParams4Notification() in INCLUDES_CUSTOM
  logDebug("Start of Job");
  
  //loop through Corrective Action Plan records with status of CAP required
  var getResult = aa.cap.getByAppType("EnvHealth","Corrective Action Plan", null, null);
  if (getResult.getSuccess()) {
    var list = getResult.getOutput();
    logDebug("Success! Records Equals = " + list.length) ;

    //loop through CAP table
      
    for (var i in list) {
      cap = list[i];
      capId = list[i].getCapID();
      capIdString = capId.getCustomID();
      applicationStatus = "Active"

      if (list[i].getCapStatus() != "Active") {
        // logDebug("skipping: " + capId.getCustomID());
        continue;
      }
      
      showDebug = true;
      parentCapId = getParentByCapId(capId);
      if (!parentCapId) {
        // logDebug("error: no parent for " + capIdString);
        totalErrors++;
        continue;
      }
      
      if (parentCapId.getCustomID() == "FA0000868") {continue;}

      logDebug("processing: " + capId.getCustomID());
      processedDepartments++;

      var tableName = "CAP";
      var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>
      
      childTable = loadASITable(tableName, capId);
      parentTable = loadASITable(tableName,parentCapId);
      
      
      // logDebug("loop through child rows");
      for (var c in childTable) {
        var matchFound = false;
        cRow = childTable[c];
        totalRowsProcessed++;
        // logDebug("loop through parent rows");
        for (var p in parentTable) {
          pRow = parentTable[p];
          
          // logDebug("check for inspection match"); // - CAP entries do not include Inspected By or Inspector ID and cannot be compared
          // department cap rows will be updated if a change in the 
          if ( !cRow["Inspection Date"].fieldValue.empty
              && aa.util.formatDate(aa.util.parseDate(cRow["Inspection Date"].fieldValue),"MM-dd-yyyy") == aa.util.formatDate(aa.util.parseDate(pRow["Inspection Date"].fieldValue),"MM-dd-yyyy")  
              && cRow["Inspection Type"].fieldValue == pRow["Inspection Type"].fieldValue 
              && cRow["Description"].fieldValue == pRow["Description"].fieldValue 
              && cRow["Deficiency"].fieldValue == pRow["Deficiency"].fieldValue ) {
            matchFound = true;
            // logDebug("check for CAP difference");
            if (
              (!cRow["Corrective Action"].fieldValue.empty && cRow["Corrective Action"].fieldValue != pRow["Corrective Action"].fieldValue)
              || (!cRow["Responsible Party"].fieldValue.empty && cRow["Responsible Party"].fieldValue != pRow["Responsible Party"].fieldValue )
              || ( !cRow["Actual/Planned Correction Date"].fieldValue.empty 
                  && aa.util.formatDate(aa.util.parseDate(cRow["Actual/Planned Correction Date"].fieldValue),"MM-dd-yyyy") != aa.util.formatDate(aa.util.parseDate(pRow["Actual/Planned Correction Date"].fieldValue),"MM-dd-yyyy")
                 )
              ) {
              // logDebug("push fields to update");
              setUpdateColumnValue(updateRowsMap, p, "Corrective Action", cRow["Corrective Action"].fieldValue );
              setUpdateColumnValue(updateRowsMap, p, "Responsible Party", cRow["Responsible Party"].fieldValue );
              setUpdateColumnValue(updateRowsMap, p, "Actual/Planned Correction Date", cRow["Actual/Planned Correction Date"].fieldValue );
              setUpdateColumnValue(updateRowsMap, p, "CAP Status", "Pending" );
            }else{
              logDebug("no changes to write");
              logDebug(cRow["CAP Status"].fieldValue);
              if (cRow["CAP Status"].fieldValue == "Incomplete" || cRow["CAP Status"].fieldValue == "Denied") {
                //set parent status to CAP Required
                applicationStatus = "CAP Required"
              }
            } 
            break; //exit parent loop
          }
        }
        if (!matchFound) {
          logDebug("no match found in parent " + parentCapId.getCustomID() + " for row " + c + " on record " + capIdString);
          totalNoMatch++;
          // cDate = cRow["Inspection Date"].fieldValue;
          // logDebug(cDate);
          // logDebug(aa.util.parseDate(cDate));
          // logDebugObject(cDate);
        }
      }
        
      //update custom list
      if (!updateRowsMap.empty) {
        
        // logDebug("array values: " + updateRowsMap.values());
        // logDebugObject(updateRowsMap);
        myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
        
        if (myResult.getSuccess()) {
          logDebug("Success");
        }else{
          logDebug("error updating records: " + myResult.getErrorMessage());
          totalErrors++;
        }
      } else {
        logDebug("no changes were pushed to array");
      }
      updateAppStatus(applicationStatus,"Updated by EMSE Script",parentCapId);
    }
  }
  logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
  logDebug("CAP records processed: " + processedDepartments);
  logDebug("Total rows processed: " + totalRowsProcessed);
  logDebug("Total errors: " + totalErrors);
} catch (err) {
  logDebug("A JavaScript Error occured: " + err.message);
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

	/*------------------------------------------------------------------------------------------------------/
	| <===========END=Main=Loop================>
	/-----------------------------------------------------------------------------------------------------*/


