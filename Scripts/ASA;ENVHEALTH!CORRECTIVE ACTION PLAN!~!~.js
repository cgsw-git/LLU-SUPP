/*
programmer: Mike Zachry - Civic Good Software - 559-905-0006

Loma Linda uses an amendment copied from the parent record for employees to submit a corrective action plan through ACA 
in response to a deficiency on an inspection. When a deficiency is indicated on a resulted inspction, an entry is
made in the CAP ASIT on the Department record.

This script loops through the childASIT rows and updates the parent ASIT with any changed fields.
It fires when submitting a Corrective Action Plan record through ACA as an amendment to
the Department record and it is expected the parent and child CAP custom lists have the same number of rows

2021.01.22 - Mike Zachry - updates were made to retire using loadASIT() and replacing it with getAppSpecificTableModel 
because loadASIT does not consider the rowIndex and assumes the first row is 0 and the row indicies are sequential. 
*/ 
 
// var myCapId = "CA0002990";
 // myCapId = "CA0002529"; // FA0000868 Fictitious Facility
 // myCapId = "CA0002504"; // FA0001031 Center for Dentistry
// var myUserId = "ADMIN";

// /* ASA  */  var eventName = "ApplicationSubmitAfter";
// /* WTUA */  var eventName = "WorkflowTaskUpdateAfter";  wfTask = "Application Submittal";	  wfStatus = "Admin Approved";  wfDateMMDDYYYY = "01/27/2015";
// /* IRSA */  var eventName = "InspectionResultSubmitAfter" ; inspResult = "Failed"; inspResultComment = "Comment";  inspType = "Roofing"
// /* ISA  */  var eventName = "InspectionScheduleAfter" ; inspType = "Roofing"
// /* PRA  */  var eventName = "PaymentReceiveAfter";  

// var useProductScript = false;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
// var runEvent = false; // set to true to simulate the event and run all std choices/scripts for the record type.  

/* master script code don't touch */ 
// aa.env.setValue("EventName",eventName); var vEventName = eventName;  var controlString = eventName;  var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA,useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA,useProductScript));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useProductScript));	}	eval(getScriptText("INCLUDES_CUSTOM",null,useProductScript));if (documentOnly) {	doStandardChoiceActions2(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName, servProvCode, useProductScripts) {	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();	vScriptName = vScriptName.toUpperCase();	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		if (useProductScripts) {			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);		} else {			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");		}		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}}logGlobals(AInfo); if (runEvent && typeof(doStandardChoiceActions) == "function" && doStdChoices) try {doStandardChoiceActions(controlString,true,0); } catch (err) { logDebug(err.message) } if (runEvent && typeof(doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z); 

//
// User code goes here
//

try 
{
	showDebug = true;


	var tableName = "CAP";
	var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>
	var inspectorsWithTasks = new Array();
	var appStatus = "Active";

	childTable = loadASITable(tableName, capId);
	parentTable = loadASITable(tableName,parentCapId);
	
	// logDebugObject(capId);
	// logDebugObject(parentCapId);
	// logDebugObject(aa.cap.getCapID(myCapId).getOutput())

	// get the ASIT table model
	var childAppSpecificTableModel = aa.appSpecificTableScript.getAppSpecificTableModel(capId,"CAP");
	var parentAppSpecificTableModel = aa.appSpecificTableScript.getAppSpecificTableModel(parentCapId,"CAP");
	
	// initialize the rows map used to update the table
	var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>
	
	
	if (childAppSpecificTableModel.getSuccess() && parentAppSpecificTableModel.getSuccess()) {
		logDebug("get childAppSpecificTableModel success");

		// create the child and parent table models
		childAppSpecificTableModel = childAppSpecificTableModel.getOutput();
		parentAppSpecificTableModel = parentAppSpecificTableModel.getOutput();
		childAppSpecificTableModel = childAppSpecificTableModel.getAppSpecificTableModel()
		parentAppSpecificTableModel = parentAppSpecificTableModel.getAppSpecificTableModel()
		
		// get the child and parent table fields
		var childTableFields = childAppSpecificTableModel.getTableFields(); // List<BaseField>
		var parentTableFields = parentAppSpecificTableModel.getTableFields(); // List<BaseField>
		var rowChanged = false;
		
		// since this is from and amendment, the tables should be the same size
		if (childTableFields != null && childTableFields.size() > 0 && parentTableFields != null && childTableFields.size() == parentTableFields.size()){

			// loop through all the fields and rows
			// logDebugObject(parentTableFields);
			// logDebug("parent table size = " + parentTableFields.size());
			// logDebug("child  table size = " + parentTableFields.size());
			// logDebugObject(parentAppSpecificTableModel);

			// this is the outer loop of the parent ASIT
			for (var i = 0; i < parentTableFields.size(); i++) {
				// logDebug("loop counter i = " + i);

				var parentFieldObject = parentTableFields.get(i); // BaseField
				var parentRowID = parentFieldObject.getRowIndex();
				// logDebug("parentRowID = " + parentRowID);

				
				// loop through the fields in the row checking if the child field was changed.
				// this is the inner loop of the child ASIT
				for (i; i < childTableFields.size() && childTableFields.get(i).getRowIndex() == parentRowID ; i++) {

					parentFieldObject = parentTableFields.get(i); 
					childFieldObject = childTableFields.get(i);
					childRowID = childFieldObject.getRowIndex();
					// logDebug("childRowID = " + childRowID);
					
					// get the column name.
					var childColumnName = childFieldObject.getFieldLabel();
					var parentColumnName = parentFieldObject.getFieldLabel();

					// get the value of column
					var childColumnValue = childFieldObject.getInputValue();
					var parentColumnValue = parentFieldObject.getInputValue();
					
					// get the row ID 
					var childRowID = childFieldObject.getRowIndex();
					var parentRowID = parentFieldObject.getRowIndex();
					
					
					// record the inspector's ID so a task can be assigned if the row was updated
					if (childColumnName == "Inspector ID") {
						var inspectorID = childColumnValue;
					}

					// add to the updateRowsMap if one of the department editable fields changed and
					// set rowChanged to true so a task can be assigned to the inspector that recorded
					// the deficiency
					
					
					if (childRowID == parentRowID && childColumnName == parentColumnName && childColumnValue != parentColumnValue 
					&& (childColumnName == "Responsible Party" || childColumnName == "Actual/Planned Correction Date" || childColumnName == "Corrective Action")
					) {
						// logDebug("Changed " + childColumnName + " " + childRowID + " " + parentRowID);
						setUpdateColumnValue(updateRowsMap, parentRowID, parentColumnName, childColumnValue );
						rowChanged = true;
						// if a child column value was updated, update the CAP Status column if has not been updated
						// if a mapping for the row and values exists it will be replaced rather than creating another mapping 
						// logDebug("update the CAP Status to Pending on row " + parentRowID);
						setUpdateColumnValue(updateRowsMap, parentRowID, "CAP Status", "Pending");

						// loop through the columns to determine if the First Response Date column is empty and if it is, populate
						// with the current date so that only the first time the CAP is updated the date is recorded
						for (var j = 0; j < childTableFields.size() && childTableFields.get(j).getRowIndex() == parentRowID ; j++) {
							tmpFieldObject = childTableFields.get(j);
							myFieldValue = tmpFieldObject.getInputValue();
							logDebugObject(myFieldValue);
							if (tmpFieldObject.getFieldLabel() == "First Response Date" && rowChanged && myFieldValue.isEmpty()) {
								setUpdateColumnValue(updateRowsMap, parentRowID, "First Response Date", aa.util.formatDate(aa.util.now(),"MM/dd/yyyy"));
								logDebug("Updated First Response Date");
							}
						}
					}else{
						// this is for debugging purposes
						if (childColumnName == "Responsible Party" || childColumnName == "Actual/Planned Correction Date" ||
							childColumnName == "Corrective Action" ) {
							// logDebug("No Difference " + childColumnName + " " + childRowID + " " + parentRowID);
							// logDebug("row id " + childRowID + " " + parentRowID);
							// logDebug("column name " + childColumnName + " " + parentColumnName);
							// logDebug("column value " + childColumnValue + " " + parentColumnValue);
						}
					}
					
				}
				// assign a task to the inspector for the parent department reecord if one had not already been assigned
				if (rowChanged) {
					// reset the rowChanged flag
					rowChanged = false;
					// check if a task was already assigned for this department record
					if (arraySearch(inspectorsWithTasks, inspectorID) < 0) {
						// logDebug(inspectorID + " not found in list");
						// assign task to inspector and update list of inspectors who have been assigned a task
						addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,inspectorID,parentCapId);
						// logDebug("add " + inspectorID + " to list");
						var newIndexLength = inspectorsWithTasks.push(inspectorID);
					}
				}
			}
		}else{
			logDebug("childTableFields is null or empty");
		}
	}else{
		logDebug("get childAppSpecificTableModel failed");
	}
	if (!updateRowsMap.empty) {
		myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
		if (myResult.getSuccess()) {
			logDebug("updateAppSpecificTableInfors Success");
			// logDebug("set parent status to CAP Required");
			appStatus = "CAP Required"
			updateAppStatus(appStatus,"Updated by EMSE Script",parentCapId);
		}else{
		  logDebug(myResult.getErrorMessage());
		}
	}else{
		logDebug("updateRowsMap was empty");
	}
}

catch (err) {
	logDebug("A JavaScript Error occured: " + err.message);
}
// end user code
// aa.env.setValue("ScriptReturnCode", "1"); 	
aa.env.setValue("ScriptReturnMessage", debug)
  
function arraySearch(arr,val) {
  for (var i=0; i<arr.length; i++) {
    if (arr[i] == val) return i;
  }
  return -1;
}
  

