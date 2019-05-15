/*------------------------------------------------------------------------------------------------------/
| Program : Uncheck "Item Was Processed" Guidesheet Item ASI - based on UniversalMasterScriptV3.0.js
| Event   : UniversalMasterScript
|
| Usage   :Must be run BEFORE the LLUCORRECTIVEACTIONPLANASITUPDATE script. Run nightly to clear inadvertently checked checkboxe 
|
| Client  : LLU
| Action# : Batch
|
| Notes   : This script is intended to run nightly and uncheck any inadvertenly checked checkboxes
|           mike zachry, Civic Good Software
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START Configurable Parameters
|   The following script code will attempt to read the assocaite event and invoker the proper standard choices
|    
/------------------------------------------------------------------------------------------------------*/
/* ASA  */  //var eventName = "ApplicationSubmitAfter";
var triggerEvent = aa.env.getValue("EventName");
var controlString = null;
var documentOnly = false;                  // Document Only -- displays hierarchy of std choice steps
var myUserId = "ADMIN";
var capId = null;

var bDate = new Date();
var eDate = new Date();
//bDate.setDate(eDate.getDate() - 1); //uncomment this if running it after midnight for the previous day
//var begDate = bDate.toISOString().substr(0 , 10);
//var endDate = eDate.toISOString().substr(0 , 10);
var begDate = (bDate.getMonth() + 1) + "/" + bDate.getDate() + "/" + bDate.getFullYear();
var endDate = (eDate.getMonth() + 1) + "/" + eDate.getDate() + "/" + eDate.getFullYear();


var preExecute = "PreExecuteForAfterEvents";        //Assume after event unless before decected
var eventType = "After";            //Assume after event
if (triggerEvent != ""){
   controlString = triggerEvent;         // Standard choice for control
   if(triggerEvent.indexOf("Before") > 0){
      preExecute = "PreExecuteForBeforeEvents";
      eventType = "Before";
   }
}

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 3.0;
var useCustomScriptFile = false;  // if true, use Events->Custom Script, else use Events->Scripts->INCLUDES_CUSTOM
var useSA = false;
var SA = null;
var SAScript = null;
aa.env.setValue("CurrentUserID",myUserId); 
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
   useSA = true;
   SA = bzr.getOutput().getDescription();
   bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT");
   if (bzr.getSuccess()) {
      SAScript = bzr.getOutput().getDescription();
   }
}

if (SA) {
   eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA));
   eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA));
   eval(getScriptText(SAScript, SA));
} else {
   eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
   eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
}
eval(getScriptText("INCLUDES_CUSTOM",null,useCustomScriptFile));

if (documentOnly) {
   doStandardChoiceActions(controlString, false, 0);
   aa.env.setValue("ScriptReturnCode", "0");
   aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
   aa.abortScript();
}

var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX", vEventName);

var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";
var doStdChoices = true; // compatibility default
var doScripts = false;
var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice).getOutput().size() > 0;
if (bzr) {
   var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "STD_CHOICE");
   doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
   var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "SCRIPT");
   doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
}

function getScriptText(vScriptName, servProvCode, useProductScripts) {
   if (!servProvCode)  servProvCode = aa.getServiceProviderCode();
   vScriptName = vScriptName.toUpperCase();
   var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
   try {
      if (useProductScripts) {
         var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
      } else {
         var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
      }
      return emseScript.getScriptText() + "";
   } catch (err) {
      return "";
   }
}

function logDebugObject(o) {
 logDebug(' *** logDebugObject: ');
  for (var p in o) {
  logDebug(': ' + o[p]);
 } 
}

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
//Log All Environmental Variables as  globals
var params = aa.env.getParamValues();
var keys =  params.keys();
var key = null;
while(keys.hasMoreElements())
{
 key = keys.nextElement();
 eval("var " + key + " = aa.env.getValue(\"" + key + "\");");
 logDebug("Loaded Env Variable: " + key + " = " + aa.env.getValue(key));
}

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

//if (preExecute.length) doStandardChoiceActions(preExecute,true,0);    // run Pre-execution code

//logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//
//  Get the Standard choices entry we'll use for this App type
//  Then, get the action/criteria pairs for this app
//

//if (doStdChoices) doStandardChoiceActions(controlString,true,0);


//
//  Next, execute and scripts that are associated to the record type
//

//if (doScripts) doScriptActions();

// Custom script
startTime = new Date();
try{
exit: {
logDebug("begDate = " + begDate + " endDate = " + endDate);
var getResult = aa.cap.getByAppType("EnvHealth","Department", null, null);
if (getResult.getSuccess()) {
  var list = getResult.getOutput();
  logDebug(list.length + " applications loaded") ;
  for (var i in list) {
		sca = String(list[i].getCapID()).split("-");
		myResult = aa.cap.getCapID(sca[0],sca[1],sca[2]);
    if (myResult.getSuccess()) {
      capId = myResult.getOutput();
      cap = aa.cap.getCap(capId).getOutput();
      capName = cap.getSpecialText();
      customId = capId.getCustomID();
      //logDebug(capId  + " " + customId + " " + capName);
      var r = aa.inspection.getInspections(capId);
      //var r = aa.inspection.getInspections(begDate,endDate);
      if (r.getSuccess()) {
        var inspections = r.getOutput();
        for (var inspCount in inspections)
        {
          // old way
          // var inspModel = inspections[inspCount].getInspection();
          // var inspId = inspModel.getIdNumber();
          // var inspObj = aa.inspection.getInspection(capId,inspId).getOutput();
          // var inspResult = inspModel.getInspectionStatus();
          
          // new way
          var inspObj = inspections[inspCount];
          var inspModel = inspObj.getInspection();
          var inspId = inspObj.getIdNumber();
          var inspResult = inspObj.getInspectionStatus();
          
          if (inspObj.getInspectionDate() != null && (inspResult == "Failed to Meet Standards" || inspResult == "Met Standards")) 
          {
            var inspType = inspObj.getInspectionType();
            var inspectionDate = inspObj.getInspectionDate();
            var inspectionDateString = inspectionDate.getMonth() + "/" + inspectionDate.getDayOfMonth() + "/" + inspectionDate.getYear() ;
            logDebug(inspections.length + " inspections loaded " + customId);
            
            if ( dateDiff(begDate,inspectionDateString) >= 0 ) {
              logDebug("capId = " + capId + " inspId = " + inspId + " customId = " + customId);
              // myResult = myUpdateGuidesheetASIField(inspId, null,null,"CKLST_CMNT","ADDITIONAL VIOLATION INFO", "Item Was Processed","UNCHECKED",capId);
              //myResult = myUpdateGuidesheetASIField(inspId, gso.gsType,gso.text,"CKLST_CMNT","ADDITIONAL VIOLATION INFO", "Item Was Processed","UNCHECKED",capId);

              gName = null;
              gItem = null;
              asiGroup = "CKLST_CMNT";
              asiSubGroup = "ADDITIONAL VIOLATION INFO";
              asiLabel = "Item Was Processed";
              newValue = "UNCHECKED";
              var gs = inspModel.getGuideSheets();
              if (gs) {
                logDebug(gs.size() + " guidesheets loaded");
                for(var i=0;i< gs.size();i++) {
                  var guideSheetObj = gs.get(i);
                  gname = guideSheetObj.getGuideType();
                  if (guideSheetObj ) { // && gname.indexOf("Failed items for") == -1 && gName.toUpperCase() == guideSheetObj.getGuideType().toUpperCase())
                    // logDebug("guideSheetObj")
                    var guidesheetItem = guideSheetObj.getItems();
                    if (guidesheetItem.size() > 0) {
                      logDebug(guidesheetItem.size() + "guidesheet items loaded");
                    for(var j=0;j< guidesheetItem.size();j++) {
                      var item = guidesheetItem.get(j);
                      //1. Filter Guide Sheet items by Guide sheet item name && ASI group code
                      if(item && asiGroup == item.getGuideItemASIGroupName()) {  //&& gItem == item.getGuideItemText() 
                        // logDebug("item && asiGroup == item.getGuideItemASIGroupName()");
                        var ASISubGroups = item.getItemASISubgroupList();
                        if(ASISubGroups) {
                          // logDebug("ASISubGroups");
                          //2. Filter ASI sub group by ASI Sub Group name
                          for(var k=0;k< ASISubGroups.size();k++) {
                            var ASISubGroup = ASISubGroups.get(k);
                            if(ASISubGroup && ASISubGroup.getSubgroupCode() == asiSubGroup) {
                              // logDebug("ASISubGroup && ASISubGroup.getSubgroupCode() == asiSubGroup");
                              var ASIModels =  ASISubGroup.getAsiList();
                              if(ASIModels) {
                                // logDebug("ASIModels");
                                //3. Filter ASI by ASI name
                                for( var m = 0; m< ASIModels.size();m++) {
                                  var ASIModel = ASIModels.get(m);
                                  if(ASIModel && ASIModel.getAsiName() == asiLabel) {
                                    // logDebug("ASIModel && ASIModel.getAsiName() == asiLabel")
                                    if (ASIModel.getAttributeValue() != newValue) {
                                      logDebug("Change ASI value from:"+ ASIModel.getAttributeValue() +" to "+newValue);
                                      //4. Reset ASI value
                                      ASIModel.setAttributeValue(newValue);
                                      //Update the guidesheet
                                      if (ASIModel != null) {
                                        // logDebug("ASIModel != null");
                                        try
                                        {
                                         var updateResult = aa.guidesheet.updateGGuidesheet(guideSheetObj,guideSheetObj.getAuditID());
                                        }
                                        catch(err) {
                                          logDebug("Error message:" + err);
                                          logDebug("CapId:" + itemCap);
                                          logDebug("Inspection date:" + inspModel.completeDate);
                                          logDebug("Guide type:" + guideSheetObj.getGuideType());
                                          logDebug("Guide item:" + item.getGuideItemText());
                                          logDebug("ASI group name:" + item.getGuideItemASIGroupName());
                                          logDebug("ASI subgroup name:" + ASISubGroup.getSubgroupCode());
                                          logDebug("ASI model name:" + ASIModel.getAsiName());
                                          // return false;
                                        }
                                        if (updateResult) {
                                          // logDebug("updateResult");
                                          if (updateResult.getSuccess()) {
                                           logDebug("Successfully updated " + gName + " on inspection " + inspId + ".");
                                           // return true;
                                          } else {
                                           logDebug("Could not update guidesheet ID: " + updateResult.getErrorMessage());
                                           // return false;
                                          }
                                        }else{
                                          logDebug("updateResult was returned null");
                                          // return false;
                                          logDebug("Guide type:" + guideSheetObj.getGuideType());
                                          logDebug("Guide item:" + item.getGuideItemText());
                                          logDebug("ASI group name:" + item.getGuideItemASIGroupName());
                                          logDebug("ASI subgroup name:" + ASISubGroup.getSubgroupCode());
                                          logDebug("ASI model name:" + ASIModel.getAsiName());
                                        }
                                      }else{
                                        // logDebug("ASIModel is null");
                                      }
                                    }else{
                                      // logDebug("Comparison failed - ASIModel.getAttributeValue() != newValue" + ASIModel.getAttributeValue() + " != " + newValue);
                                    }
                                  }else{
                                    // logDebug("Error- asiLabel");
                                    //return false;
                                  }
                                }
                                }else{
                                  // logDebug("Error - if ASIModels");
                                  //return false;
                                }
                              }else{
                                // logDebug("Error - asiSubGroup");
                                //return false;
                              }
                            }
                          }else{
                            // logDebug("Error - if ASIsubgroups");
                            //return false;
                          }
                        }else{
                          // logDebug("Error - groupname");
                          //return false;
                        }
                      }
                    }else{
                      // logDebug("Error - no guidesheet items");
                      // return false;
                    }
                    }else{
                      // logDebug("Error - guidesheet name");
                      // return false;
                    }							
                  }
              } else {
                logDebug("No guidesheets for this inspection");
                // return false;
              }
            }
          }
        } //for loop on initial inspections
      } //getSuccess for initial inspections 
      //logDebug("Attempted " + z + " updates");
    } //getting capID
  }
} //getting apps
}
} catch (err) {
  logDebug(err); 
}



endTime = new Date();
var minutes = 1000 * 60;
var hours = minutes * 60;
var days = hours * 24;
var years = days * 365;
logDebug("Elapsed minutes:" + (endTime.getTime() - startTime.getTime()) / minutes);

//}


function myUpdateGuidesheetASIField(inspId,gName,gItem,asiGroup,asiSubGroup,asiLabel,newValue,capId) {

  var r = aa.inspection.getInspections(capId);
  // var r = aa.inspection.getInspection(capId, inspId);

	if (r.getSuccess()) {
		var inspArray = r.getOutput();
    logDebug(inspArray.length + " inspections loaded");
		for (i in inspArray) {
      if (inspArray[i].getIdNumber() == inspId) {
        var inspModel = inspArray[i].getInspection();

        // var myResult = r.getOutput();
        // var inspModel = myResult.getInspection();

        // logDebug("myResult.getClass() = " + myResult.getClass());
        logDebug("inspModel.getClass() = " + inspModel.getClass());
        //logDebugObject(inspModel);

				var gs = inspModel.getGuideSheets();

				if (gs) {
          // logDebug(gs.size() + " guidesheets loaded");
					for(var i=0;i< gs.size();i++) {
						var guideSheetObj = gs.get(i);
						if (guideSheetObj) { //&& gName.toUpperCase() == guideSheetObj.getGuideType().toUpperCase())
              // logDebug("guideSheetObj")
              gname = guideSheetObj.getGuideType();
              if (gname.indexOf("Failed") > -1 ) logDebug(gname);
							var guidesheetItem = guideSheetObj.getItems();
              if (guidesheetItem.size() > 0) {
                // logDebug(guidesheetItem.size() + "guidesheet items loaded");
							for(var j=0;j< guidesheetItem.size();j++) {
								var item = guidesheetItem.get(j);
								//1. Filter Guide Sheet items by Guide sheet item name && ASI group code
								if(item && asiGroup == item.getGuideItemASIGroupName()) {  //&& gItem == item.getGuideItemText() 
                  // logDebug("item && asiGroup == item.getGuideItemASIGroupName()");
									var ASISubGroups = item.getItemASISubgroupList();
									if(ASISubGroups) {
                    // logDebug("ASISubGroups");
										//2. Filter ASI sub group by ASI Sub Group name
										for(var k=0;k< ASISubGroups.size();k++) {
											var ASISubGroup = ASISubGroups.get(k);
											if(ASISubGroup && ASISubGroup.getSubgroupCode() == asiSubGroup) {
                        // logDebug("ASISubGroup && ASISubGroup.getSubgroupCode() == asiSubGroup");
												var ASIModels =  ASISubGroup.getAsiList();
												if(ASIModels) {
                          // logDebug("ASIModels");
													//3. Filter ASI by ASI name
													for( var m = 0; m< ASIModels.size();m++) {
														var ASIModel = ASIModels.get(m);
														if(ASIModel && ASIModel.getAsiName() == asiLabel) {
                              // logDebug("ASIModel && ASIModel.getAsiName() == asiLabel")
                              if (ASIModel.getAttributeValue() != newValue) {
                                logDebug("Change ASI value from:"+ ASIModel.getAttributeValue() +" to "+newValue);
                                //4. Reset ASI value
                                ASIModel.setAttributeValue(newValue);
                                //Update the guidesheet
                                if (ASIModel != null) {
                                  // logDebug("ASIModel != null");
                                  try
                                  {
                                   var updateResult = aa.guidesheet.updateGGuidesheet(guideSheetObj,guideSheetObj.getAuditID());
                                  }
                                  catch(err) {
                                    logDebug("Error message:" + err);
                                    logDebug("CapId:" + itemCap);
                                    logDebug("Inspection date:" + inspModel.completeDate);
                                    logDebug("Guide type:" + guideSheetObj.getGuideType());
                                    logDebug("Guide item:" + item.getGuideItemText());
                                    logDebug("ASI group name:" + item.getGuideItemASIGroupName());
                                    logDebug("ASI subgroup name:" + ASISubGroup.getSubgroupCode());
                                    logDebug("ASI model name:" + ASIModel.getAsiName());
                                    // return false;
                                  }
                                  if (updateResult) {
                                    // logDebug("updateResult");
                                    if (updateResult.getSuccess()) {
                                     logDebug("Successfully updated " + gName + " on inspection " + inspId + ".");
                                     return true;
                                    } else {
                                     logDebug("Could not update guidesheet ID: " + updateResult.getErrorMessage());
                                     return false;
                                    }
                                  }else{
                                    logDebug("updateResult was returned null");
                                    // return false;
                                    logDebug("Guide type:" + guideSheetObj.getGuideType());
                                    logDebug("Guide item:" + item.getGuideItemText());
                                    logDebug("ASI group name:" + item.getGuideItemASIGroupName());
                                    logDebug("ASI subgroup name:" + ASISubGroup.getSubgroupCode());
                                    logDebug("ASI model name:" + ASIModel.getAsiName());
                                  }
                                }else{
                                  // logDebug("ASIModel is null");
                                }
                              }else{
                                // logDebug("Comparison failed - ASIModel.getAttributeValue() != newValue" + ASIModel.getAttributeValue() + " != " + newValue);
                              }
														}else{
                              // logDebug("Error- asiLabel");
                              //return false;
                            }
													}
                          }else{
                            // logDebug("Error - if ASIModels");
                            //return false;
                          }
												}else{
                          // logDebug("Error - asiSubGroup");
                          //return false;
                        }
											}
										}else{
                      // logDebug("Error - if ASIsubgroups");
                      //return false;
                    }
									}else{
                    // logDebug("Error - groupname");
                    //return false;
                  }
								}
              }else{
                // logDebug("Error - no guidesheet items");
                // return false;
              }
							}else{
                // logDebug("Error - guidesheet name");
                // return false;
              }							
						}
				} else {
					logDebug("No guidesheets for this inspection");
					return false;
				}
			}else{
        logDebug("Comparison failed inspArray[i].getIdNumber() == inspId" + inspArray[i].getIdNumber() + " == " + inspId);
      }
		} // inspection for loop
    return true;
	} else {
		logDebug("No inspections on the record");
		return false;
	}
  
	logDebug("No updates to the guidesheet made");
  logDebug("capId = " + arguments[7] + " itemCap = " + itemCap + " inspId = " + inspId);
	return false;
}  


function reloadGlobals(capID) {
/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_ACCELA_GLOBALS.js
| Event   : N/A
|
| Usage   : Accela Global Includes.  Required for all master scripts.
|
| Notes   : 
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
/* var showMessage = false;		// Set to true to see results in popup window
var showDebug = false;			// Set to true to see debug messages in popup window
var disableTokens = false;		// turn off tokenizing of std choices (enables use of "{} and []")
var useAppSpecificGroupName = false;	// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;	// Use Group name when populating Task Specific Info Values
var enableVariableBranching = true;	// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;			// Maximum number of std choice entries.  Entries must be Left Zero Padded */
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
/* var GLOBAL_VERSION = 3.0;

var cancel = false;

var vScriptName = aa.env.getValue("ScriptCode");
var vEventName = aa.env.getValue("EventName");

var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";									// Message String
if (typeof debug === 'undefined') {
	var debug = "";										// Debug String, do not re-define if calling multiple
	}
var br = "<BR>";									// Break Tag
var feeSeqList = new Array();						// invoicing fee list
var paymentPeriodList = new Array();				// invoicing pay periods

var currentUserID = aa.env.getValue("CurrentUserID"); // Current User
var systemUserObj = null;  							// Current User Object
var currentUserGroup = null;						// Current User Group
var publicUserID = null;
var publicUser = false;

if (currentUserID.indexOf("PUBLICUSER") == 0){
	publicUserID = currentUserID; 
	currentUserID = "ADMIN"; 
	publicUser = true;
}
if(currentUserID != null) {
	systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
}

var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"");
 */
var servProvCode = aa.getServiceProviderCode();

logDebug("EMSE Script Framework Versions");
logDebug("EVENT TRIGGERED: " + vEventName);
logDebug("SCRIPT EXECUTED: " + vScriptName);
logDebug("INCLUDE VERSION: " + INCLUDE_VERSION);
logDebug("SCRIPT VERSION : " + SCRIPT_VERSION);
logDebug("GLOBAL VERSION : " + GLOBAL_VERSION);


var capId = capID,
	cap = null,
	capIDString = "",
	appTypeResult = null,
	appTypeString = "",
	appTypeArray = new Array(),
	capName = null,
	capStatus = null,
	fileDateObj = null,
	fileDate = null,
	fileDateYYYYMMDD = null,
	parcelArea = 0,
	estValue = 0,
	calcValue = 0,
	houseCount = 0,
	feesInvoicedTotal = 0,
	balanceDue = 0,
	houseCount = 0,
	feesInvoicedTotal = 0,
	capDetail = "",
	AInfo = new Array(),
	partialCap = false,
	feeFactor = "",
	parentCapId = null;


//if (typeof(getCapId) != "undefined")
//	capId = getCapId();
 
if(capId == null){
	if(aa.env.getValue("CapId") != ""){
		sca = String(aa.env.getValue("CapId")).split("-");
		capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
	}else if(aa.env.getValue("CapID") != ""){
		sca = String(aa.env.getValue("CapID")).split("-");
		capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
	}
}
if(capId != null){
	servProvCode = capId.getServiceProviderCode();
	capIDString = capId.getCustomID();
	cap = aa.cap.getCap(capId).getOutput();
	appTypeResult = cap.getCapType();
	appTypeString = appTypeResult.toString();
	appTypeArray = appTypeString.split("/");
	if(appTypeArray[0].substr(0,1) !="_") 
	{
		var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
		if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
	}
	capName = cap.getSpecialText();
	capStatus = cap.getCapStatus();
	partialCap = !cap.isCompleteCap();
	fileDateObj = cap.getFileDate();
	fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
	fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
	var valobj = aa.finance.getContractorSuppliedValuation(capId,null).getOutput();	
	if (valobj.length) {
		estValue = valobj[0].getEstimatedValue();
		calcValue = valobj[0].getCalculatedValue();
		feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
	}
	
	var capDetailObjResult = aa.cap.getCapDetail(capId);		
	if (capDetailObjResult.getSuccess())
	{
		capDetail = capDetailObjResult.getOutput();
		var houseCount = capDetail.getHouseCount();
		var feesInvoicedTotal = capDetail.getTotalFee();
		var balanceDue = capDetail.getBalance();
	}
	//loadAppSpecific(AInfo); 						
	//loadTaskSpecific(AInfo);						
	//loadParcelAttributes(AInfo);					
	//loadASITables();

	var parentCapString = "" + aa.env.getValue("ParentCapID");
	if (parentCapString.length > 0) { parentArray = parentCapString.split("-"); parentCapId = aa.cap.getCapID(parentArray[0], parentArray[1], parentArray[2]).getOutput(); }
	if (!parentCapId) { parentCapId = getParent(); }
	if (!parentCapId) { parentCapId = getParentLicenseCapID(capId); }
	
	logDebug("<B>EMSE Script Results for " + capIDString + "</B>");
	logDebug("capId = " + capId.getClass());
	logDebug("cap = " + cap.getClass());
	logDebug("currentUserID = " + currentUserID);
	logDebug("currentUserGroup = " + currentUserGroup);
	logDebug("systemUserObj = " + systemUserObj.getClass());
	logDebug("appTypeString = " + appTypeString);
	logDebug("capName = " + capName);
	logDebug("capStatus = " + capStatus);
	logDebug("fileDate = " + fileDate);
	logDebug("fileDateYYYYMMDD = " + fileDateYYYYMMDD);
	logDebug("sysDate = " + sysDate.getClass());
	logDebug("parcelArea = " + parcelArea);
	logDebug("estValue = " + estValue);
	logDebug("calcValue = " + calcValue);
	logDebug("feeFactor = " + feeFactor);
	
	logDebug("houseCount = " + houseCount);
	logDebug("feesInvoicedTotal = " + feesInvoicedTotal);
	logDebug("balanceDue = " + balanceDue);
	if (parentCapId) logDebug("parentCapId = " + parentCapId.getCustomID());
}

//eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));
  
  
}
  
  
// Check for invoicing of fees
//
if (feeSeqList.length)
   {
   invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
   if (invoiceResult.getSuccess())
      logMessage("Invoicing assessed fee items is successful.");
   else
      logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
   }

   

   
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/
if(eventType == "After"){
   if (debug.indexOf("**ERROR") > 0)
      {
      aa.env.setValue("ScriptReturnCode", "1");
      aa.env.setValue("ScriptReturnMessage", debug);
      }
   else
      {
      aa.env.setValue("ScriptReturnCode", "0");
      if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
      if (showDebug)    aa.env.setValue("ScriptReturnMessage", debug);
      }
}
else{ //Process Before Event with cancel check
   if (debug.indexOf("**ERROR") > 0)
      {
      aa.env.setValue("ScriptReturnCode", "1");
      aa.env.setValue("ScriptReturnMessage", debug);
      }
   else
      {
      if (cancel)
         {
         aa.env.setValue("ScriptReturnCode", "1");
         if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
         if (showDebug)    aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
         }
      else
         {
         aa.env.setValue("ScriptReturnCode", "0");
         if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
         if (showDebug)    aa.env.setValue("ScriptReturnMessage", debug);
         }
      }
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/