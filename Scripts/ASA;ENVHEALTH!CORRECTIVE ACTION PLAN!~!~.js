// var myCapId = "CA0000010";
var myUserId = "ADMIN";

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
  //loop through the childASIT rows and update the parent ASIT with new entries
  // aa.print("childASIT.length = " + childASIT.length)
  //if it is a fire drill, assign the task to user ENAVARRETTE
  parentCapId = getParentByCapId(capId);

  var tableName = "CAP";
  var isFireDrill = false;
  var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>

  var myResult = aa.appSpecificTableScript.getAppSpecificTableModel(capId, tableName);
  if (myResult.getSuccess()) 
  {
    childAppSpecificTableScriptModel = myResult.getOutput();
    childAppSpecificTableModel = childAppSpecificTableScriptModel.getAppSpecificTableModel();
    var childASIT = childAppSpecificTableModel.getTableFields(); // List<BaseField>
    if (childASIT != null && childASIT.size() > 0)
    {
      var myResult = aa.appSpecificTableScript.getAppSpecificTableModel(parentCapId, tableName);
      if (myResult.getSuccess()) 
      {
        parentAppSpecificTableScriptModel = myResult.getOutput();
        parentAppSpecificTableModel = parentAppSpecificTableScriptModel.getAppSpecificTableModel();
        var parentASIT = parentAppSpecificTableModel.getTableFields(); // List<BaseField>
        if (parentASIT != null && parentASIT.size() > 0)
        {
          // var fieldsToUpdate = "Corrective Action, Responsible Party, Actual/Planned Correction Date";
          var childFieldObject = childASIT.get(0);
          var rowTracker = childFieldObject.getRowIndex();
          var addTask = false;
          var inspectorsWithTasks = [];
          var rowsWithChanges = [];
          for (var i=0; i < childASIT.size(); i++) // child and parent tables should be exactly the same so only one row counter is needed
          {
            var childFieldObject = childASIT.get(i); // BaseField
            //get the column name.
            var childColumnName = childFieldObject.getFieldLabel();
            //get the value of column
            var childColumnValue = childFieldObject.getInputValue();
            //get the row ID 
            var childRowID = childFieldObject.getRowIndex();

            var parentFieldObject = parentASIT.get(i); // BaseField
            //get the column name.
            var parentColumnName = parentFieldObject.getFieldLabel();
            //get the value of column
            var parentColumnValue = parentFieldObject.getInputValue();
            // get the row ID 
            var parentRowID = parentFieldObject.getRowIndex();
            
            if (childColumnValue != "" && childColumnValue != null && parentColumnName == childColumnName && childColumnValue != parentColumnValue /*&& childRowID == parentRowID */ )
            {
              if ( childColumnName == "Corrective Action" || childColumnName == "Responsible Party" || childColumnName == "Actual/Planned Correction Date" ) {
                logDebug("Child value and row: " + childColumnName + ": " + childColumnValue + "   RowID: " + childRowID);
                logDebug("Parent value and row: " + parentColumnName + ": " + parentColumnValue + "   RowID: " + parentRowID);
                // logDebugObject(parentFieldObject);
                setUpdateColumnValue(updateRowsMap, childRowID, childColumnName, childColumnValue);
                rowsWithChanges.push(childRowID);
              }
            }
          }
          
          //end comparison loop
          //update all changes at one time
          
          // testing updating after all changes are submitted to address BAppspectableValueDuplicatedException error
          // myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
          // if (myResult.getSuccess()) {
            // logDebug("Success");
          // }else{
            // logDebug(myResult.getErrorMessage());
          // }
          
          //create ad hoc tasks for the inspectors and set the cap status
          // updateRowsMap = aa.util.newHashMap();
          for (var i=0; i < childASIT.size(); i++)
          {
            var childFieldObject = childASIT.get(i); // BaseField
            //get the column name.
            var childColumnName = childFieldObject.getFieldLabel();
            //get the value of column
            var childColumnValue = childFieldObject.getInputValue();
            //get the row ID 
            var childRowID = childFieldObject.getRowIndex();
            
            if (childColumnName == "Inspector ID" && (!childColumnValue || childColumnValue=="") ) {childColumnValue = "ENAVARRETTE";}
            if (childColumnName == "Inspector ID" && arraySearch(rowsWithChanges,childRowID) && !arraySearch(inspectorsWithTasks, childColumnValue)) {
              inspectorsWithTasks.push(childColumnValue);
              logDebug("Adding a task for " + childColumnValue);
              addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,childColumnValue,parentCapId);
            }
            
            // if the current column is "CAP Status" and current row is found in array rowsWithChanges, set the status to ""Pending"
            if (childColumnName == "CAP Status" && arraySearch(rowsWithChanges,childRowID)) {
              setUpdateColumnValue(updateRowsMap, childRowID, childColumnName, "Pending");
            }
          }
          
          myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
          if (myResult.getSuccess()) {
            logDebug("Success");
          }else{
            logDebug(myResult.getErrorMessage());
          }
        }
      }
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

