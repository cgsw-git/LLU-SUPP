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
8/23/2023	mz	Changed from using rowNumber to using i when calling setUpdateColumnValue() because Iterating through the table is 0 based, retrieving 
				the field information is one based and updating the column is 0 based
9/13/2023	mz	Went back to using rowNumber. Script was updating the prior row FA000366 from CA0004496, row 13 was being updated from CA row 14.
				Still not sure of the cause. It appears the update is 1 based but reading the table is 0 based.
				There is still the possibility that a deleted row exists in the FA table but is not copied to the CA table.
 
*/ 
// var myCapId = "CA0004152" // FA0000868 Fictitious Facility
// var myCapId = "CA0003440"; //FA0002019 SUPP
// myCapId = "CA0003442"; // FA0000868 Fictitious Facility SUPP
// myCapId = "CA0002504"; // FA0001031 Center for Dentistry
// var myCapId = "CA0004496";
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
	// showDebug = true;
	br = "<br>";


	var tableName = "CAP";
	var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>
	var inspectorsWithTasks = new Array();
	var appStatus = "Active";

	(showDebug) && logDebug(capId);
	(showDebug) && logDebug(parentCapId);

	// load the Corrective Action Plan record CAP ASIT
	childTable = loadASITable(tableName, capId);
	// load the Department record CAP ASIT
	parentTable = loadASITable(tableName,parentCapId);
	(showDebug) &&  logDebug("loaded ASIT tables");
	(showDebug) &&  logDebug("parentTable.length: " + parentTable.length);
	(showDebug) &&  logDebug("childTable.length: " + childTable.length);

	// since the Corrective Action is from an amendment/copy of the Department record, the CAP ASIT tables should be the same size
	if (parentTable && childTable && parentTable.length == childTable.length){

		// initialize the rows map used to update the table
		var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>

		// itterate through the Department and Corrective Action CAP ASIT rows
		for ( var i = 0; i < parentTable.length; i++) {

			//Iterating through the table is 0 based, retrieving the field information is one based and updating the column is 0 based
			var rowNumber = i + 1; 
			var rowToUpdate = rowNumber;
			logDebug("rowNumber: " + rowNumber)
			
			// get the Department record row
			var parentRowID = parentTable[i];
			
			// load the Department record fields
			var pInspectionDate = parentRowID["Inspection Date"];
			pInspectionDate = pInspectionDate.fieldValue;
			var pInspectorID = parentRowID["Inspector ID"];
			pInspectorID = pInspectorID.fieldValue;
			var pDescription = parentRowID["Description"];
			pDescription = pDescription.fieldValue;
			var pInspectorComment = parentRowID["Inspector Comment"];
			pInspectorComment = pInspectorComment.fieldValue;
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

			// get the Corrective Action record row 
			var cCurrentRow = childTable[i];
			
			// load the Corrective Action record fields 
			var cInspectionDate = cCurrentRow["Inspection Date"];
			cInspectionDate = cInspectionDate.fieldValue;
			var cInspectorID = cCurrentRow["Inspector ID"];
			cInspectorID = cInspectorID.fieldValue;
			var cDescription = cCurrentRow["Description"];
			cDescription = cDescription.fieldValue;
			var cInspectorComment = cCurrentRow["Inspector Comment"];
			cInspectorComment = cInspectorComment.fieldValue;
			var cResponsibleParty = cCurrentRow["Responsible Party"];
			cResponsibleParty = (!cResponsibleParty.fieldValue) ? '' : cResponsibleParty.fieldValue;
			var cCorrectionDate = cCurrentRow["Actual/Planned Correction Date"];
			cCorrectionDate = (!cCorrectionDate.fieldValue) ? '' : cCorrectionDate.fieldValue ;
			var cCorrectiveAction = cCurrentRow["Corrective Action"];
			cCorrectiveAction = (!cCorrectiveAction.fieldValue) ? '' : cCorrectiveAction.fieldValue ;
			
			// (showDebug) && logDebug(rowNumber + ": " 
				// + pInspectorID + ":" + cInspectorID + "--" 
				// + pInspectionDate + ":" + cInspectionDate + "--" 
				// + pResponsibleParty +":"+ cResponsibleParty +"--"
				// + pCorrectionDate +":"+ cCorrectionDate +"--"
				// + pCorrectiveAction +":"+ cCorrectiveAction);

			// update the row column if the following fields/columns has changed
			if ((pResponsibleParty != cResponsibleParty || pCorrectionDate != cCorrectionDate || pCorrectiveAction != cCorrectiveAction)
				&& (pInspectionDate == cInspectionDate && pInspectorID == cInspectorID && pInspectorComment == cInspectorComment) // && pDescription == cDescription )
				&& pCAPStatus != 'Approved') {

				// update the Department record columns from the Corrective Action record columns
				(showDebug) && logDebug("Updating Row: " + rowNumber) + br;
				(showDebug) && logDebug(rowToUpdate + " - " + pInspectionDate + " - " + cInspectionDate + br);
				(showDebug) && logDebug("pInspectorComment: " + pInspectorComment);
				(showDebug) && logDebug("cInspectorComment: " + cInspectorComment + br);
				(showDebug) && logDebug("pDescription: "+pDescription);
				(showDebug) && logDebug("cDescription: "+cDescription + br);
				(showDebug) && logDebug("cCorrectiveAction: "+cCorrectiveAction + br);
				(pResponsibleParty != cResponsibleParty) && setUpdateColumnValue(updateRowsMap, rowToUpdate, "Responsible Party", cResponsibleParty );
				(pCorrectionDate != cCorrectionDate) && setUpdateColumnValue(updateRowsMap, rowToUpdate, "Actual/Planned Correction Date", cCorrectionDate );
				(pCorrectiveAction != cCorrectiveAction) && setUpdateColumnValue(updateRowsMap, rowToUpdate, "Corrective Action", cCorrectiveAction );
				setUpdateColumnValue(updateRowsMap, rowToUpdate, "CAP Status", "Pending");
				
				// update the First Response Date
				if (pCAPStatusBefore == "n/a" && matches(pFirstResponseDate,null,undefined,"")) {
					setUpdateColumnValue(updateRowsMap, rowToUpdate, "First Response Date", aa.util.formatDate(aa.util.now(),"MM/dd/yyyy"));
					(showDebug) && logDebug("Updated First Response Date");
				}

				// assign a task to the inspector for the parent department reecord if one had not already been assigned
				// if (arraySearch(inspectorsWithTasks, inspectorID) < 0) {
				if (pInspectorID && arraySearch(inspectorsWithTasks, pInspectorID) < 0) {
					// logDebug(inspectorID + " not found in list");
					// assign task to inspector and update list of inspectors who have been assigned a task
					addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,pInspectorID,parentCapId);
					(showDebug) &&  logDebug("add " + pInspectorID + " to list" + br);
					var newIndexLength = inspectorsWithTasks.push(pInspectorID);
				}


			}else{
				// Set the record status to CAP Required if the CAP status is incomplete and it wasn't a CAP that was updated
				if (pCAPStatus == "Incomplete" || pCAPStatus == "Denied") {
					appStatus = "CAP Required";
					(showDebug) && logDebug("set appStatus to CAP Required due to Incomplete deficiency");
				}
			}
		}
	}else{
		(showDebug) && logDebug("The Department and Corrective Action Plan CAP ASIT tables do not match. CAP submission was not completed");
	}

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
  

