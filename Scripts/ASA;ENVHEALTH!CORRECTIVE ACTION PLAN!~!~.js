/*
programmer: Mike Zachry - Civic Good Software - 559-905-0006

Loma Linda uses a Corrective Action Plan record amendment copied from the parent record for employees to submit a corrective action plan through ACA 
in response to a deficiency on an inspection. When a deficiency is indicated on a resulted inspction, an entry is made in the CAP ASIT on the Department record.
A CAP is submitted by a department employee in ACA by creating a Corrective Action Plan amendment record and updating the following fields:
	Responsible Party
	Actual/Planned Correction Date
	Corrective Action
Upon submital, the ASA event fires this script which loops through the childASIT rows and updates the parent ASIT with any changed fields.

It should be noted each item in getTableFields() is specific field. The child field from the CAP ASIT on the Corrective Action Plan record is compared to the
parent field from the CAP ASIT on the Department record. The following fields are used when processing the rows:
	Status
	Inspector ID
	Cap Status Before
	First Response Date
	Responsible Party
	Actual/Planned Correction Date
	Corrective Action
The loop must read all the getTableFields() items to ensure the above fields are collected.

Revision: 
2021.01.22 - Mike Zachry - updates were made to retire using loadASIT() and replacing it with getAppSpecificTableModel 
				because loadASIT does not consider the rowIndex and assumes the first row is 0 and the row indicies are sequential. 

6/30/2023	mz	Fixed a bug resulting in incomplete iteration of all the parent record CAP ASIT which resulted in CAP Required tasks not being assigned
				Enhanced the script to set the record status to CAP Required when an Incomplete deficiency exists for which a CAP was not submitted
				Made multiple increases to code efficiency
7/6/2023	mz	Replaced aa.appSpecificTableScript.getAppSpecificTableModel() with loadASITable() to reduce looping when iterating fields for values
8/23/2023	mz	Changed from using rowNumber to using i when calling setUpdateColumnValue() because Iterating through the table is 0 based, retrieving 
				the field information is one based and updating the column is 0 based
9/13/2023	mz	Went back to using rowNumber. Script was updating the prior row FA000366 from CA0004496, row 13 was being updated from CA row 14.
				Still not sure of the cause. It appears the update is 1 based but reading the table is 0 based.
				There is still the possibility that a deleted row exists in the FA table but is not copied to the CA table.
2023.10.10 - Mike Zachry - It appears that loadASITable rowNumber does not work with updateAppSpecificTableInfors(). going back 
				to aa.appSpecificTableScript.getAppSpecificTableModel() and using getRowIndex()
				Removed outer parent record loop that was causing fields to not be updated.
				Added record changed logic inside and after exiting the record loop.
				Added additional field variables

*/ 
 
// var myCapId = "CA0002529"; // FA0000868 Fictitious Facility
// myCapId = "CA0002504";	// FA0001031 Center for Dentistry
// myCapId = "CA0003444";	// testing in SUPP with FA0001641
// myCapId = "CA0004520";	// testing in PROD with FA0001641
// myCapId = "CA0004526";	// testing in PROD with FA0001863
// myCapId = "CA0004548";	// testing in PROD with FA0000501
// myCapId = "CA0004560";	// testing in PROD with FA0002063

var myUserId = "ADMIN";

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
	var capStatusBefore = '';
	var firstResponseDate = '';
	var rowStatus = '';
	var inspectorID = '';

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
		var aRowChanged = false;
		
		// since this is from and amendment, the tables should be the same size
		if (childTableFields != null && childTableFields.size() > 0 && parentTableFields != null && childTableFields.size() == parentTableFields.size()){
			logDebug("parent table size = " + parentTableFields.size());
			logDebug("child  table size = " + parentTableFields.size());
				
				// loop through the fields in the child and parent rows checking if the child field was changed.
				for (var i = 0; i < childTableFields.size()  ; i++) {  //&& childTableFields.get(i).getRowIndex() == parentRowID ; i++) {

					var childFieldObject = childTableFields.get(i);
					var childRowID = childFieldObject.getRowIndex();
					
					// check if this is a new row and process appropriately
					if (childRowID != parentRowID) {

						// update appStatus to "CAP Required" when an incomplete CAP row is found and a CAP was not submitted
						if (!rowChanged && rowStatus == "Incomplete") {
							appStatus = "CAP Required";
						}
						
						//assign a task to the inspector and update the CAP status when reaching a new row
						if (rowChanged) {

							// assign a task to the inspector for the parent department reecord if one had not already been assigned
							if (arraySearch(inspectorsWithTasks, inspectorID) < 0) {
							logDebug(inspectorID + " not found in list");
							// assign task to inspector and update list of inspectors who have been assigned a task
							addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,inspectorID,parentCapId);
							logDebug("add " + inspectorID + " to list");
							var newIndexLength = inspectorsWithTasks.push(inspectorID);
							}
							if (capStatusBefore == 'n/a' && firstResponseDate.isEmpty() ) {
								setUpdateColumnValue(updateRowsMap, parentRowID, "First Response Date", aa.util.formatDate(aa.util.now(),"MM/dd/yyyy"));
								logDebug("Updated First Response Date");
							}

							// if a child column value was updated, update the CAP Status
							// if a mapping for the row and values exists it will be replaced rather than creating another mapping 
							logDebug("update the CAP Status to Pending on row " + parentRowID);
							setUpdateColumnValue(updateRowsMap, parentRowID, "CAP Status", "Pending");
							logDebug(br);
						}
						rowChanged = false;
						capStatusBefore = '';
						firstResponseDate = '';
						rowStatus = '';
						inspectorID = '';
					}
					
					// get the parent row index
					var parentFieldObject = parentTableFields.get(i); 
					var parentRowID = parentFieldObject.getRowIndex();
					
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
						inspectorID = childColumnValue;
					}
					
					// get Status value
					if (childColumnName == "Status") {
						rowStatus = childColumnValue;
					}
					
					//get CAP status Before
					if (childColumnName == "CAP Status Before") {
						capStatusBefore = childColumnValue;
					}
					
					//get first response date
					if (childColumnName == "First Response Date") {
						firstResponseDate = childColumnValue;
					}
					
					// add to the updateRowsMap if one of the department editable fields changed
					// set rowChanged and aRowChanged to true so a task can be assigned to the inspector that recorded the deficiency and the status is updated above
					if (childRowID == parentRowID && childColumnName == parentColumnName && childColumnValue != parentColumnValue 
					&& (childColumnName == "Responsible Party" || childColumnName == "Actual/Planned Correction Date" || childColumnName == "Corrective Action")
					) {
						logDebug("parentRowID = " + parentRowID + "   Field: " + parentColumnName);
						logDebug("childRowID = " + childRowID + "   Field: " + childColumnName);
						logDebug('Updated from: "' + parentColumnValue + '"  To: "' + childColumnValue + '"'); 
						logDebug("appStatus = " + appStatus);

						logDebug("Changed " + childColumnName + " " + childRowID + " " + parentRowID);
						setUpdateColumnValue(updateRowsMap, parentRowID, parentColumnName, childColumnValue );
						aRowChanged = true;
						rowChanged = true
						
						
						// --- DEPRECATED ----
						// loop through the columns to determine if column "CAP Status Before" = "n/a"
						// the "n/a" value is used to designate old CAP rows from new CAP rows for statistical purposes
						/* for (var j = 0; j < childTableFields.size() ; j++) {
							// logDebug("child row: " + childTableFields.get(j).getRowIndex() + " parent row: " + parentRowID);
							if (childTableFields.get(j).getRowIndex() == parentRowID) {
								tmpFieldObject = childTableFields.get(j);
								myFieldValue = tmpFieldObject.getInputValue();
								// logDebug("field: " + tmpFieldObject.getFieldLabel());
								// logDebugObject(myFieldValue);
								if (tmpFieldObject.getFieldLabel() == "CAP Status Before" && myFieldValue == "n/a") {
									// loop through the columns to determine if the First Response Date column is empty and if it is, populate
									// with the current date so that only the first time the CAP is updated the date is recorded
									for (var k = 0; k < childTableFields.size() ; k++) {
										// logDebug("child row: " + childTableFields.get(j).getRowIndex() + " parent row: " + parentRowID);
										if (childTableFields.get(k).getRowIndex() == parentRowID) {
											tmpFieldObject = childTableFields.get(k);
											myFieldValue = tmpFieldObject.getInputValue();
											// logDebug("field: " + tmpFieldObject.getFieldLabel());
											// logDebugObject(myFieldValue);
											if (tmpFieldObject.getFieldLabel() == "First Response Date" && myFieldValue.isEmpty()) {
												setUpdateColumnValue(updateRowsMap, parentRowID, "First Response Date", aa.util.formatDate(aa.util.now(),"MM/dd/yyyy"));
												logDebug("Updated First Response Date");
												break;
											}
										}
									}
									break;
								}
							} 
						}
						*/

					// }else{
						// this is for debugging purposes
						// if (childColumnName == "Responsible Party" || childColumnName == "Actual/Planned Correction Date" ||
							// childColumnName == "Corrective Action" ) {
							// logDebug("No Difference " + childColumnName + " " + childRowID + " " + parentRowID);
							// logDebug("row id " + childRowID + " " + parentRowID);
							// logDebug("column name " + childColumnName + " " + parentColumnName);
							// logDebug("column value " + childColumnValue + " " + parentColumnValue);
						// }

					}
					
				}
			// }
				
				logDebug("Last Row");
				// update appStatus to "CAP Required" when an incomplete CAP is found and a CAP was not submitted
				if (!rowChanged && rowStatus == "Incomplete") {
					appStatus = "CAP Required";
				}

				//assign a task to the inspector and update the CAP status when the last row is reached and the row CAP row was changed
				if (rowChanged) {
					// assign a task to the inspector for the parent department reecord if one had not already been assigned
					if (arraySearch(inspectorsWithTasks, inspectorID) < 0) {
					// logDebug(inspectorID + " not found in list");
					// assign task to inspector and update list of inspectors who have been assigned a task
					addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,inspectorID,parentCapId);
					logDebug("add " + inspectorID + " to list");
					var newIndexLength = inspectorsWithTasks.push(inspectorID);
					}
					if (capStatusBefore == 'n/a' && firstResponseDate.isEmpty() ) {
						setUpdateColumnValue(updateRowsMap, parentRowID, "First Response Date", aa.util.formatDate(aa.util.now(),"MM/dd/yyyy"));
						logDebug("Updated First Response Date");
					}
					// if a child column value was updated, update the CAP Status column if has not been updated
					// if a mapping for the row and values exists it will be replaced rather than creating another mapping 
					logDebug("update the CAP Status to Pending on row " + parentRowID);
					setUpdateColumnValue(updateRowsMap, parentRowID, "CAP Status", "Pending");
				}
				rowChanged = false;
				capStatusBefore = '';
				firstResponseDate = '';
				rowStatus = '';
				inspectorID = '';
			// }
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
			// appStatus = "CAP Required"
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
// aa.env.setValue("ScriptReturnMessage", debug)
  
function arraySearch(arr,val) {
  for (var i=0; i<arr.length; i++) {
    if (arr[i] == val) return i;
  }
  return -1;
}
  

