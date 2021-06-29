// var myCapId = "FA0000868";
// var myUserId = "ADMIN";
// var inspId = 17681228;

/* ASA  */  //var eventName = "ApplicationSubmitAfter";
/* WTUA */  //var eventName = "WorkflowTaskUpdateAfter";  wfTask = "Application Submittal";	  wfStatus = "Admin Approved";  wfDateMMDDYYYY = "01/27/2015";
/* IRSA */  //var eventName = "InspectionResultSubmitAfter" ; inspResult = "Failed"; inspResultComment = "Comment";  inspType = "Roofing"
/* ISA  */  //var eventName = "InspectionScheduleAfter" ; inspType = "Roofing"
/* PRA  */  //var eventName = "PaymentReceiveAfter";  

// var useProductScript = false;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
// var runEvent = false; // set to true to simulate the event and run all std choices/scripts for the record type.  

// /* master script code don't touch */ aa.env.setValue("EventName",eventName); var vEventName = eventName;  var controlString = eventName;  var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA,useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA,useProductScript));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useProductScript));	}	eval(getScriptText("INCLUDES_CUSTOM",null,useProductScript));if (documentOnly) {	doStandardChoiceActions2(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName, servProvCode, useProductScripts) {	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();	vScriptName = vScriptName.toUpperCase();	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		if (useProductScripts) {			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);		} else {			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");		}		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}}logGlobals(AInfo); if (runEvent && typeof(doStandardChoiceActions) == "function" && doStdChoices) try {doStandardChoiceActions(controlString,true,0); } catch (err) { logDebug(err.message) } if (runEvent && typeof(doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z); 

//
// User code goes here
//

try {
	showDebug = true;

	// Post failed inspection items to the CAP ASIT
	// Generate and attach the 5001 Inspection Report to the inspected record

	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();

	// Create CAP ASIT rows from out of compliance inspection items
	addCorrectiveActionPlanASIT();

	// Attach Report to Department record
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();
	var inspDate =  inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	var inspType = inspObj.getInspectionType();
	var customID = capId.getCustomID();
	var reportParams = aa.util.newHashMap();
	addParameter(reportParams,"departmentID",customID);
	addParameter(reportParams, "inspectionDate",inspDate);
	addParameter(reportParams, "inspectionType",inspType);
	addParameter(reportParams, "debug","N");

	// support for new 5001 inspection report with only inspection id parameter
	addParameter(reportParams,"g6ActNum",inspId.toString());

	// generate report
	var myResult = runReportAttach(capId,"5001 Inspection Report",reportParams);

	// End generate and attach the 5001 Inspection Report to the inspected record
}
catch (err) {
	logDebug("A JavaScript Error occured: " + err.message);
}

// end user code
// aa.env.setValue("ScriptReturnCode", "1"); 	
// aa.env.setValue("ScriptReturnMessage", debug)


//Custom functions

function addCorrectiveActionPlanASIT(){
	//logDebug("made it to addCorrectiveActionPlanASIT");
	//get failed inspection items
	gsoArray = getGuideSheetObjects(inspId,capId);

	//process the  inspection items
	if (gsoArray.length > 0) {
	  //set inspection globals
	  logDebug("Got " + gsoArray.length + " guidesheet items for inspection " );
	  // inspType = inspections[inspCount].getInspectionType();
	  // inspObj = inspections[inspCount];  // current inspection object
	  inspType = inspObj.getInspectionType();
	  // inspGroup = inspObj.getInspection().getInspectionGroup();
	  // inspResultComment = inspObj.getInspection().getResultComment();
	  // inspComment = inspResultComment; // consistency between events
	  // inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	  // if (inspObj.getScheduledDate()) {
		// inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	  // }else{
		// inspSchedDate = null;
	  // }
	  // inspTotalTime = inspObj.getTimeTotal();
	  //done setting inspection globals
	  
	  for (x in gsoArray) {
		gsi = gsoArray[x];
		gsi.loadInfo();
		gsi.loadInfoTables();
		rowVals = new Array();
		if (gsi.info["Item Was Processed"] != "CHECKED" && gsi.gsType.indexOf("Failed items for") < 0) {
		  //logDebug("Evaluating  guidesheet item " + x +" of " + gsoArray.length);
		  if (gsi.status == "Out of Compliance" || gsi.status == "Major - Out of Compliance"  && gsi.validInfo) {
			updateAppStatus("CAP Required","Updated by EMSE Script",capId);
			logDebug("Processing guidesheet item " + x + " with status of " + gsi.status);
			generateCAPViolationsASITRow(gsi);
		  }else{
			logDebug("Skipping guidesheet item " + x + " with status of " + gsi.status);
		  }
		}else{
		  logDebug("Skipping guidesheet item " + x + " as already been processed");
		}
	  }
	}
}  
 

function generateCAPViolationsASITRow(gsi) {
	//logDebug("    made it to GenerateCAPviolationsASITRow");
	//inspObj = aa.inspection.getInspection(capId,inspId).getOutput();
	//logDebugObject(inspObj);

	inspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
	rowVals.push({colName: 'Inspection Date', colValue: inspDate});

	// add the inspector information
	var thisInspector = inspObj.getInspector(); //returns SysUserModel
	if ( typeof(thisInspector) != "undefined" ) {
	  rowVals.push({colName: 'Inspected By', colValue: thisInspector.getFullName()});
	  rowVals.push({colName: 'Inspector ID', colValue: thisInspector.getUserID()});
	}
	rowVals.push({colName: 'Department', colValue: capName});
	var vFA = capId.getCustomID();
	rowVals.push({colName: 'Department ID #', colValue: vFA});
	rowVals.push({colName: 'Description', colValue: gsi.text});
	rowVals.push({colName: 'Deficiency', colValue: gsi.comment});
	rowVals.push({colName: 'Vio. Status', colValue: gsi.status});
	rowVals.push({colName: 'Inspector Comment', colValue: gsi.info["Inspector Comment"]});
	rowVals.push({colName: 'Inspection Type', colValue: inspType});
	rowVals.push({colName: 'CAP Status', colValue: "Incomplete"});
	var addrResult = aa.address.getAddressByCapId(capId);
	if (addrResult) {
	  var addrArray = new Array();
	  var addrArray = addrResult.getOutput();
	  var streetName = addrArray[0].getStreetName();
	  var hseNum = addrArray[0].getHouseNumberStart();
	  var streetSuffix = addrArray[0].getStreetSuffix();
	  var streetDir = addrArray[0].getStreetDirection();
	  var unitType = addrArray[0].getUnitType();
	  var unitNbr = addrArray[0].getUnitStart();
	}

	if (addrResult && streetDir != null) {
	  var vAddress = hseNum + " "  + streetDir  + " "   + streetName;
	} else {
	  var vAddress = hseNum + " "   + streetName;
	}

	if (addrResult && streetSuffix != null) {
	  vAddress = vAddress + " " + streetSuffix;
	}

	if (addrResult && unitType != null) {
	  vAddress = vAddress + " " + unitType;
	}

	if (addrResult && unitNbr != null) {
	  vAddress = vAddress + " " + unitNbr;
	}

	if (vAddress) {
	  rowVals.push({colName: 'Address', colValue: vAddress});
	}
	rowVals.push({colName: 'CAP Status Before', colValue: "n/a"});

	logDebug("Updating ASIT");
	options = [
	{capId: capId}
	];
	addAsiTableRow("CAP", rowVals, options)
	logDebug("Updating Item Was Processed checkbox");
	myUpdateGuidesheetASIField(inspId, gsi.gsType,gsi.text,"CKLST_CMNT","ADDITIONAL VIOLATION INFO", "Item Was Processed","CHECKED",capId);
}

function myUpdateGuidesheetASIField(inspId,gName,gItem,asiGroup,asiSubGroup, asiLabel,newValue,capId) {
	//updates the guidesheet ID to nGuideSheetID if not currently populated
	//optional capId

	var itemCap = capId;
  var r = aa.inspection.getInspections(itemCap);

	if (r.getSuccess()) {
		var inspArray = r.getOutput();

		for (i in inspArray) {
			if (inspArray[i].getIdNumber() == inspId) {
				var inspModel = inspArray[i].getInspection();

				var gs = inspModel.getGuideSheets();

				if (gs) {
					for(var i=0;i< gs.size();i++) {
						var guideSheetObj = gs.get(i);
						if (guideSheetObj && gName.toUpperCase() == guideSheetObj.getGuideType().toUpperCase()) {

							var guidesheetItem = guideSheetObj.getItems();
							for(var j=0;j< guidesheetItem.size();j++) {
								var item = guidesheetItem.get(j);
								//1. Filter Guide Sheet items by Guide sheet item name && ASI group code
								if(item && gItem == item.getGuideItemText() && asiGroup == item.getGuideItemASIGroupName()) {
									var ASISubGroups = item.getItemASISubgroupList();
									if(ASISubGroups) {
										//2. Filter ASI sub group by ASI Sub Group name
										for(var k=0;k< ASISubGroups.size();k++) {
											var ASISubGroup = ASISubGroups.get(k);
											if(ASISubGroup && ASISubGroup.getSubgroupCode() == asiSubGroup) {
												var ASIModels =  ASISubGroup.getAsiList();
												if(ASIModels) {
													//3. Filter ASI by ASI name
													for( var m = 0; m< ASIModels.size();m++) {
														var ASIModel = ASIModels.get(m);
														if(ASIModel && ASIModel.getAsiName() == asiLabel) {
															logDebug("Change ASI value from:"+ ASIModel.getAttributeValue() +" to "+newValue);
															//4. Reset ASI value
															ASIModel.setAttributeValue(newValue);		
														}
													}
												}
											}
										}
									}
								}
							}							

							//Update the guidesheet
							var updateResult = aa.guidesheet.updateGGuidesheet(guideSheetObj,guideSheetObj.getAuditID());
							if (updateResult.getSuccess()) {
								logDebug("Successfully updated " + gName + " on inspection " + inspId + ".");
								return true;
							} else {
								logDebug("Could not update guidesheet ID: " + updateResult.getErrorMessage());
								return false;
							}
						}
					}
				} else {
					// if there are guidesheets
					logDebug("No guidesheets for this inspection");
					return false;
				}
			}
		}
	} else {
		logDebug("No inspections on the record");
		return false;
	}
	logDebug("No updates to the guidesheet made");
	return false;
} 

