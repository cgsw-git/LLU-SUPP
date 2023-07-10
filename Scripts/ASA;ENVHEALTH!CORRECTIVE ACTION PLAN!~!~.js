/*
programmer: Mike Zachry - Civic Good Software - 559-905-0006

Loma Linda uses an amendment created by copying some components of the parent record for employees to submit a corrective action plan through ACA 
in response to a deficiency on an inspection. When a deficiency is indicated on a resulted inspction, an entry is
made in the CAP ASIT on the Department record.

When a Corrective Action record is submitted, this ASA event script loops through the child CAP ASIT rows and updates the parent CAP ASIT rows 
with any changed fields. It fires when submitting a Corrective Action Plan record through ACA as an amendment to
the Department record and it is expected the parent and child CAP custom lists have the same number of rows.


Revision log
01/22/2021	mz	updates were made to retire using loadASIT() and replacing it with getAppSpecificTableModel because loadASIT does not consider the 
				rowIndex and assumes the first row is 0 but the row indicies are sequential.
6/30/2023	mz	Fixed a bug resulting in incomplete iteration of all the parent record CAP ASIT which resulted in CAP Required tasks not being assigned
				Enhanced the script to set the record status to CAP Required when an Incomplete deficiency exists for which a CAP was not submitted
				Made multiple increases to code efficiency
7/6/2023	mz	Replaced aa.appSpecificTableScript.getAppSpecificTableModel() with loadASITable() to reduce looping when iterating fields for values
 
*/ 
// var myCapId = "CA0004152" // FA0000868 Fictitious Facility
var myCapId = "CA0003440"; //FA0002019
// var myCapId = "CA0003439";
// myCapId = "CA0002529"; // FA0000868 Fictitious Facility
// myCapId = "CA0002504"; // FA0001031 Center for Dentistry
var myUserId = "ADMIN";

// /* ASA  */  var eventName = "ApplicationSubmitAfter";
// /* WTUA */  var eventName = "WorkflowTaskUpdateAfter";  wfTask = "Application Submittal";	  wfStatus = "Admin Approved";  wfDateMMDDYYYY = "01/27/2015";
// /* IRSA */  var eventName = "InspectionResultSubmitAfter" ; inspResult = "Failed"; inspResultComment = "Comment";  inspType = "Roofing"
/* ISA  */  var eventName = "InspectionScheduleAfter" ; inspType = "Roofing"
// /* PRA  */  var eventName = "PaymentReceiveAfter";  

var useProductScript = false;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
var runEvent = false; // set to true to simulate the event and run all std choices/scripts for the record type.  

/* master script code don't touch */ 
aa.env.setValue("EventName",eventName); var vEventName = eventName;  var controlString = eventName;  var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA,useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA,useProductScript));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useProductScript));	}	eval(getScriptText("INCLUDES_CUSTOM",null,useProductScript));if (documentOnly) {	doStandardChoiceActions2(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName, servProvCode, useProductScripts) {	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();	vScriptName = vScriptName.toUpperCase();	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		if (useProductScripts) {			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);		} else {			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");		}		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}}logGlobals(AInfo); if (runEvent && typeof(doStandardChoiceActions) == "function" && doStdChoices) try {doStandardChoiceActions(controlString,true,0); } catch (err) { logDebug(err.message) } if (runEvent && typeof(doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z); 

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
	(showDebug) &&  logDebug("loaded ASIT tables");
	
	// logDebugObject(capId);
	// logDebugObject(parentCapId);
	// logDebugObject(aa.cap.getCapID(myCapId).getOutput())

	// get the ASIT table model
	// var childAppSpecificTableModel = aa.appSpecificTableScript.getAppSpecificTableModel(capId,"CAP");
	// var parentAppSpecificTableModel = aa.appSpecificTableScript.getAppSpecificTableModel(parentCapId,"CAP");
	
	// initialize the rows map used to update the table
	// var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>
	
	
	// if (childAppSpecificTableModel.getSuccess() && parentAppSpecificTableModel.getSuccess()) {
		// logDebug("get childAppSpecificTableModel success");

		// create the child and parent table models
		// childAppSpecificTableModel = childAppSpecificTableModel.getOutput();
		// parentAppSpecificTableModel = parentAppSpecificTableModel.getOutput();
		// childAppSpecificTableModel = childAppSpecificTableModel.getAppSpecificTableModel()
		// parentAppSpecificTableModel = parentAppSpecificTableModel.getAppSpecificTableModel()
		
		// get the child and parent table fields
		// var childTableFields = childAppSpecificTableModel.getTableFields(); // List<BaseField>
		// var parentTableFields = parentAppSpecificTableModel.getTableFields(); // List<BaseField>
		// var rowChanged = false;
		
		// since this is from and amendment, the tables should be the same size
		// if (childTableFields != null && childTableFields.size() > 0 && parentTableFields != null && childTableFields.size() == parentTableFields.size()){
		if (parentTable && childTable && parentTable.length == childTable.length){

			// initialize the rows map used to update the table
			var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>

			// loop through all the fields and rows
			// logDebugObject(parentTableFields);
			// logDebug("parent table size = " + parentTableFields.size());
			// logDebug("child  table size = " + parentTableFields.size());
			// logDebugObject(parentAppSpecificTableModel);

			// itterate through the parent and child, Department and Corrective Action, record CAP ASIT field by field
			for ( var i = 0; i < parentTable.length; i++) {
				var rowNumber = parseInt(i);
				var parentRowID = parentTable[i];
				var pInspectorID = parentRowID["Inspector ID"];
				pInspectorID = pInspectorID.fieldValue;
				var pResponsibleParty = parentRowID["Responsible Party"];
				pResponsibleParty = (!pResponsibleParty.fieldValue || pResponsibleParty.fieldValue.isEmpty()) ? '' : pResponsibleParty.fieldValue;
				var pCorrectionDate = parentRowID["Actual/Planned Correction Date"];
				pCorrectionDate = (!pCorrectionDate.fieldValue) ? '' : pCorrectionDate.fieldValue ;
				var pCorrectiveAction = parentRowID["Corrective Action"];
				pCorrectiveAction = (!pCorrectiveAction.fieldValue) ? '' : pCorrectiveAction.fieldValue ;
				var pCAPStatusBefore = parentRowID["CAP Status Before"]
				pCAPStatusBefore = (!pCAPStatusBefore.fieldValue) ? '' : pCAPStatusBefore.fieldValue ;
				var pFirstResponseDate = parentRowID["First Response Date"]
				pFirstResponseDate = (!pFirstResponseDate.fieldValue) ? '' : pFirstResponseDate.fieldValue ;
				var pCAPStatus = parentRowID["CAP Status"]
				pCAPStatus = (!pCAPStatus.fieldValue) ? '' : pCAPStatus.fieldValue ;

				var cCurrentRow = childTable[i];
				var cInspectorID = cCurrentRow["Inspector ID"];
				cInspectorID = cInspectorID.fieldValue;
				var cResponsibleParty = cCurrentRow["Responsible Party"];
				cResponsibleParty = (!cResponsibleParty.fieldValue) ? '' : cResponsibleParty.fieldValue;
				var cCorrectionDate = cCurrentRow["Actual/Planned Correction Date"];
				cCorrectionDate = (!cCorrectionDate.fieldValue) ? '' : cCorrectionDate.fieldValue ;
				var cCorrectiveAction = cCurrentRow["Corrective Action"];
				cCorrectiveAction = (!cCorrectiveAction.fieldValue) ? '' : cCorrectiveAction.fieldValue ;

				if (pResponsibleParty != cResponsibleParty || pCorrectionDate != cCorrectionDate || pCorrectiveAction != cCorrectiveAction) {
					// logDebug("Changed " + childColumnName + " " + childRowID + " " + parentRowID);
					(pResponsibleParty != cResponsibleParty) && setUpdateColumnValue(updateRowsMap, rowNumber, "Responsible Party", cResponsibleParty );
					(pCorrectionDate != cCorrectionDate) && setUpdateColumnValue(updateRowsMap, rowNumber, "Actual/Planned Correction Date", cCorrectionDate );
					(pCorrectiveAction != cCorrectiveAction) && setUpdateColumnValue(updateRowsMap, rowNumber, "Corrective Action", cCorrectiveAction );
					// rowChanged = true;
					// if a child column value was updated, update the CAP Status column if has not been updated
					// if a mapping for the row and values exists it will be replaced rather than creating another mapping 
					// logDebug("update the CAP Status to Pending on row " + parentRowID);
					setUpdateColumnValue(updateRowsMap, rowNumber, "CAP Status", "Pending");
					
					
					
					// loop through the columns to determine if column "CAP Status Before" = "n/a"
					// the "n/a" value is used to designate old CAP rows from new CAP rows for statistical purposes
					// for (var j = 0; j < childTableFields.size() ; j++) {
						// logDebug("child row: " + childTableFields.get(j).getRowIndex() + " parent row: " + parentRowID);
						// if (childTableFields.get(j).getRowIndex() == parentRowID) {
							// tmpFieldObject = childTableFields.get(j);
							// myFieldValue = tmpFieldObject.getInputValue();
							// logDebug("field: " + tmpFieldObject.getFieldLabel());
							// logDebugObject(myFieldValue);
							// if (tmpFieldObject.getFieldLabel() == "CAP Status Before" && myFieldValue == "n/a") {
							if (pCAPStatusBefore == "n/a" && pFirstResponseDate.isEmpty()) {
								// loop through the columns to determine if the First Response Date column is empty and if it is, populate
								// with the current date so that only the first time the CAP is updated the date is recorded
								// for (var k = 0; k < childTableFields.size() ; k++) {
									// logDebug("child row: " + childTableFields.get(j).getRowIndex() + " parent row: " + parentRowID);
									// if (childTableFields.get(j).getRowIndex() == parentRowID) {
										// tmpFieldObject = childTableFields.get(k);
										// myFieldValue = tmpFieldObject.getInputValue();
										// logDebug("field: " + tmpFieldObject.getFieldLabel());
										// logDebugObject(myFieldValue);
										// if (tmpFieldObject.getFieldLabel() == "First Response Date" && rowChanged && myFieldValue.isEmpty()) {
										// if (pFirstResponseDate.isEmpty()) {
											setUpdateColumnValue(updateRowsMap, rowNumber, "First Response Date", aa.util.formatDate(aa.util.now(),"MM/dd/yyyy"));
											(showDebug) && logDebug("Updated First Response Date");
										// }
									// }
								// }
							}
						// }
					// }
					// assign a task to the inspector for the parent department reecord if one had not already been assigned
					// if (arraySearch(inspectorsWithTasks, inspectorID) < 0) {
					if (pInspectorID && arraySearch(inspectorsWithTasks, pInspectorID) < 0) {
						// logDebug(inspectorID + " not found in list");
						// assign task to inspector and update list of inspectors who have been assigned a task
						addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,pInspectorID,parentCapId);
						(showDebug) &&  logDebug("add " + pInspectorID + " to list");
						var newIndexLength = inspectorsWithTasks.push(pInspectorID);
					}


				}else{
					// Set the record status to CAP Required if the CAP status is incomplete and is wasn't a CAP that was updated
					// if (childRowID == parentRowID && childColumnName == parentColumnName && parentColumnValue == "Incomplete" && parentColumnName == "CAP Status") {
					if (pCAPStatus == "Incomplete") {
						appStatus = "CAP Required"
						(showDebug) && logDebug("set appStatus to CAP Required due to Incomplete deficiency");
					}
				}
				
				// assign a task to the inspector for the parent department reecord if one had not already been assigned
				/*if (rowChanged) {
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
				}*/
			}
		}else{
			(showDebug) && logDebug("childTableFields is null or empty");
		}
	// }else{
		// logDebug("get childAppSpecificTableModel failed");
	// }

	// update record status
	logDebug("set parent status to " + appStatus);
	updateAppStatus(appStatus,"Updated by EMSE Script",parentCapId);


	// update the ASIT rows
	if (!updateRowsMap.empty) {
		logDebug(updateRowsMap);
		myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
		if (myResult.getSuccess()) {
			logDebug("updateAppSpecificTableInfors Success");
		}else{
		  logDebug("Error : " + myResult.getErrorMessage());
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
  

