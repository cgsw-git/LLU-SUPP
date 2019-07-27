// var myCapId = "CA0000018";
// var myUserId = "ADMIN";

/* ASA  */  //var eventName = "ApplicationSubmitAfter";
/* WTUA */  //var eventName = "WorkflowTaskUpdateAfter";  wfTask = "Application Submittal";	  wfStatus = "Admin Approved";  wfDateMMDDYYYY = "01/27/2015";
/* IRSA */  //var eventName = "InspectionResultSubmitAfter" ; inspResult = "Failed"; inspResultComment = "Comment";  inspType = "Roofing"
/* ISA  */  //var eventName = "InspectionScheduleAfter" ; inspType = "Roofing"
/* PRA  */  //var eventName = "PaymentReceiveAfter";  

// var useProductScript = false;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
// var runEvent = true; // set to true to simulate the event and run all std choices/scripts for the record type.  

/* master script code don't touch */ 
// aa.env.setValue("EventName",eventName); var vEventName = eventName;  var controlString = eventName;  var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA,useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA,useProductScript));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useProductScript));	}	eval(getScriptText("INCLUDES_CUSTOM",null,useProductScript));if (documentOnly) {	doStandardChoiceActions2(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName, servProvCode, useProductScripts) {	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();	vScriptName = vScriptName.toUpperCase();	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		if (useProductScripts) {			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);		} else {			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");		}		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}}logGlobals(AInfo); if (runEvent && typeof(doStandardChoiceActions) == "function" && doStdChoices) try {doStandardChoiceActions(controlString,true,0); } catch (err) { logDebug(err.message) } if (runEvent && typeof(doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z); 

//
// User code goes here
//

try 
{
	showDebug = true;
  // loop through the childASIT rows and update the parent ASIT with new entries
  // this script fires when submitting a Corrective Action Plan record as an amendment to
  // the Department record and it is expected the parent and child CAP custom lists have 
  // the same number of rows

  var tableName = "CAP";
  var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>
  var inspectorsWithTasks = [];
  var appStatus = "Active";

  childTable = loadASITable(tableName, capId);
  parentTable = loadASITable(tableName,parentCapId);
  
  logDebug("loop through the rows");
  for (var c in childTable) {
    cRow = childTable[c];
    pRow = parentTable[c];
      
    if ( cRow["Corrective Action"].fieldValue != pRow["Corrective Action"].fieldValue
      || cRow["Responsible Party"].fieldValue != pRow["Responsible Party"].fieldValue
      || (cRow["Actual/Planned Correction Date"].fieldValue != null && pRow["Actual/Planned Correction Date"].fieldValue != null
        && aa.util.formatDate(aa.util.parseDate(cRow["Actual/Planned Correction Date"].fieldValue),"MM-dd-yyyy") != aa.util.formatDate(aa.util.parseDate(pRow["Actual/Planned Correction Date"].fieldValue),"MM-dd-yyyy")
        ) 
      || cRow["Actual/Planned Correction Date"].fieldValue != null && pRow["Actual/Planned Correction Date"].fieldValue == null
      ) {
      logDebug("push fields to update");
      setUpdateColumnValue(updateRowsMap, c, "Corrective Action", cRow["Corrective Action"].fieldValue );
      setUpdateColumnValue(updateRowsMap, c, "Responsible Party", cRow["Responsible Party"].fieldValue );
      setUpdateColumnValue(updateRowsMap, c, "Actual/Planned Correction Date", cRow["Actual/Planned Correction Date"].fieldValue );
      setUpdateColumnValue(updateRowsMap, c, "CAP Status", "Pending" );
      
      // check if insepector has been assigned a task and assign an ad=hoc task if one hasn't been assigned
      if (!arraySearch(inspectorsWithTasks,cRow["Inspector ID"].fieldValue)) {
        addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,cRow["Inspector ID"].fieldValue,parentCapId);
        logDebug("add inspector to list");
        inspectorsWithTasks.push(cRow["Inspector ID"].fieldValue);
      }
    }else{
      logDebug("no differences");
      if (cRow["CAP Status"].fieldValue == "Incomplete" || cRow["CAP Status"].fieldValue == "Denied") {
        logDebug("set parent status to CAP Required");
        appStatus = "CAP Required"
      }
    } 
  }
  updateAppStatus(appStatus,"Updated by EMSE Script",parentCapId);
  logDebug("updateRowsMap is empty: " + updateRowsMap.empty);
  if (!updateRowsMap.empty) {
    myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
    if (myResult.getSuccess()) {
      logDebug("Success");
    }else{
      logDebug(myResult.getErrorMessage());
    }
  }
}
catch (err) {
	logDebug("A JavaScript Error occured: " + err.message);
}
// end user code
// aa.env.setValue("ScriptReturnCode", "1"); 	
// aa.env.setValue("ScriptReturnMessage", debug)
  
  
function arraySearch(arr,val) {
  for (var i=0; i<arr.length; i++) {
    if (arr[i] == val) return true;
  }
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
