/*------------------------------------------------------------------------------------------------------/
| Program : LLU Update Department CAP ASIT - based on UniversalMasterScriptV3.0.js
| Event   : UniversalMasterScript
|
| Usage   : Designed to work with most events and generate a generic framework to expose standard master scirpt functionality
|         To utilize associate UniversalMasterScript to event and create a standard choice with same name as event
|         universal master script will execute and attempt to call standard choice with same name as associate event. 
|
| Client  : LLU
| Action# : Batch
|
| Notes   : This script is intended to run nightly and update the Corrective Action Plan (CAP) ASIT on the Department record type.
|           Future improvement would be to select only failed guidesheet items but was not able to successfully implement that function.
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

var bDate = new Date();
var eDate = new Date();
bDate.setDate(eDate.getDate() - 1); //uncomment this if running it after midnight for the previous day
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
// logDebug("begDate = " + begDate + " endDate = " + endDate);
var rowsAdded = 0;
var violationsFound = 0;
// get the caps
var getResult = aa.cap.getByAppType("EnvHealth","Department", null, null);
if (getResult.getSuccess()) {
  var list = getResult.getOutput();
  // logDebug(list.length + " applications loaded") ;

  //loop through the cap records
  for (var i in list) {
		sca = String(list[i].getCapID()).split("-");
		myResult = aa.cap.getCapID(sca[0],sca[1],sca[2]);
    if (myResult.getSuccess()) {
      capId = myResult.getOutput();
      cap = aa.cap.getCap(capId).getOutput();
      capName = cap.getSpecialText();
      customId = capId.getCustomID();
      //// logDebug(capId  + " " + customId + " " + capName);
      
      if ( list[i].getCapStatus() != "CAP Required" ) { continue; }

      // logDebug("remove the custom list");
      removeASITable("CAP", capId);
      
      // // logDebug("add empty custom list");
      // myResult = aa.appSpecificTableScript.getAppSpecificTableModel(cap,"CAP");
      // if (myResult.getSuccess()) {
        // tableModel = myResult.getOutput();
        // aa.appSpecificTableScript.addAppSpecificTableInfors(capId, tableModel);
      // }else{
        // // logDebug("unable to get table model for " + capName);
        // continue;
      // }
      
      // get the inspections for the given capId
      // logDebug("getting inspections");
      var r = aa.inspection.getInspections(capId);
      //var r = aa.inspection.getInspections(begDate,endDate);
      if (r.getSuccess()) {
        var inspections = r.getOutput();
        // logDebug(inspections.length + " inspections loaded");
        
        // loop through the inspections
        for (var inspCount in inspections)
        {
          var inspModel = inspections[inspCount];
          var inspResult = inspModel.getInspectionStatus();
          
          // processed the resulted inspections
          if (inspModel.getInspectionDate() != null && (inspResult == "Failed to Meet Standards" || inspResult == "Met Standards")) {
            var inspType = inspModel.getInspectionType();
            var inspId = inspModel.getIdNumber();
            var inspectedDateString = inspModel.getInspectionDate().getMonth() + "/" + inspModel.getInspectionDate().getDayOfMonth() + "/" + inspModel.getInspectionDate().getYear() ;
            // // logDebug(customId + " " + inspType);
            // // logDebug(inspectedDateString);
            //// logDebug( inspectedDateString + " : " +dateDiff(begDate,inspectedDateString).toString() );
            
            // if ( dateDiff(begDate,inspectedDateString) >= 0 ) {
              // logDebug("Inspection date:" + inspectedDateString);
              // logDebug(capId  + " " + customId + " " + capName);
              addCorrectiveActionPlanASIT(capId,inspId,capId);
            // }
          }
        }
      }else{
        // logDebug(r.getErrorMessage());
      }
    }else{
      // logDebug(myResult.getErrorMessage());
    }
  }
}


logDebug("violations found: " + violationsFound);
logDebug("rows added: " + rowsAdded);
} catch (err) {
  // logDebug("err = " + err);
}
endTime = new Date();
var minutes = 1000 * 60;
var hours = minutes * 60;
var days = hours * 24;
var years = days * 365;
logDebug("Elapsed minutes:" + (endTime.getTime() - startTime.getTime()) / minutes);
// var d = new Date();
// var t= d.getTime();
// var y = Math.round(t / minutes);



function addCorrectiveActionPlanASIT(capId,inspId,cap){
//// logDebug("made it to addCorrectiveActionPlanASIT");
//get failed inspection items
gsoArray = getGuideSheetObjects(inspId,capId);

//process the  inspection items
if (gsoArray.length > 0) {
  //set inspection globals
  // logDebug("Got " + gsoArray.length + " guidesheet items for inspection " + inspCount);
  inspType = inspections[inspCount].getInspectionType();
  inspObj = inspections[inspCount];  // current inspection object
  inspGroup = inspObj.getInspection().getInspectionGroup();
  inspResultComment = inspObj.getInspection().getResultComment();
  inspComment = inspResultComment; // consistency between events
  inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
  if (inspObj.getScheduledDate()) {
    inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
  }else{
    inspSchedDate = null;
  }
  inspTotalTime = inspObj.getTimeTotal();
  //done setting inspection globals
  
  for (x in gsoArray) {
    gsi = gsoArray[x];
    // generateCAPViolationsASIT(capId,inspId,gsi,cap);
    gsi.loadInfo();
    gsi.loadInfoTables();
    rowVals = new Array();
    // if (gsi.info["Item Was Processed"] != "CHECKED" && gsi.gsType.indexOf("Failed items for") < 0) {
      //// logDebug("Evaluating  guidesheet item " + x +" of " + gsoArray.length);
      if (gsi.status == "Out of Compliance" || gsi.status == "Major - Out of Compliance"  && gsi.validInfo) {
        updateAppStatus("CAP Required","Updated by EMSE Script",capId);
        // logDebug("Processing guidesheet item " + x + " with status of " + gsi.status);
        generateCAPViolationsASITRow(capId,inspId,gsi);
        violationsFound++;
      }else{
        //// logDebug("Skipping guidesheet item " + x + " with status of " + gsi.status);
      }
    // }else{
      //// logDebug("Skipping guidesheet item " + x + " as already been processed");
    // }
  }
}
}  
 
function generateCAPViolationsASIT(capId,inspId,gsi,cap) {
//// logDebug(" made it to generateCAPViolationASIT");
//GenerateCAPviolationsASIT^`
gsi.loadInfo();
gsi.loadInfoTables();
rowVals = new Array();
// if (gsi.info["Item Was Processed"] != "CHECKED" && gsi.gsType.indexOf("Failed items for") < 0) {
  //// logDebug("Evaluating  guidesheet item " + x +" of " + gsoArray.length);
  if (gsi.status == "Out of Compliance" || gsi.status == "Major - Out of Compliance"  && gsi.validInfo) {
    updateAppStatus("CAP Required","Updated by EMSE Script",capId);
    // logDebug("Processing guidesheet item " + x + " with status of " + gsi.status);
    generateCAPViolationsASITRow(capId,inspId,gsi);
  }else{
    //// logDebug("Skipping guidesheet item " + x + " with status of " + gsi.status);
  }
// }else{
  //// logDebug("Skipping guidesheet item " + x + " as already been processed");
// }
}

function generateCAPViolationsASITRow(capId,inspId,gsi) {
//// logDebug("    made it to GenerateCAPviolationsASITRow");
//inspObj = aa.inspection.getInspection(capId,inspId).getOutput();
//// logDebugObject(inspObj);

inspDate = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
rowVals["Inspection Date"] = new asiTableValObj("Inspection Date",inspDate,"N");

// add the inspector information
var thisInspector = inspObj.getInspector(); //returns SysUserModel
if ( typeof(thisInspector) != "undefined" ) {
  rowVals["Inspected By"] = new asiTableValObj("Inspected By",thisInspector.getFullName(),"N");
  rowVals["Inspector ID"] = new asiTableValObj("Inspector ID",thisInspector.getUserID(),"N");
}
rowVals["Department"] = new asiTableValObj("Department",capName,"N");
var vFA = capId.getCustomID();
rowVals["Department ID #"] = new asiTableValObj("Department ID #",vFA,"N");
rowVals["Description"] = new asiTableValObj("Description",gsi.text,"N");
rowVals["Deficiency"] = new asiTableValObj("Deficiency",gsi.comment,"N");
rowVals["Vio. Status"] = new asiTableValObj("Vio. Status",gsi.status,"N");
rowVals["Inspector Comment"] = new asiTableValObj("Inspector Comment", gsi.info["Inspector Comment"],"N");
rowVals["CAP Review Comment"] = new asiTableValObj("CAP Review Comment"," ","N");
rowVals["Corrective Action"] = new asiTableValObj("Corrective Action","Enter corrective action ","N");
rowVals["Repsonsible Party"] = new asiTableValObj("Responsible Party","Enter responsible party ","N");
rowVals["Actual/Planned Correction Date"] = new asiTableValObj("Actual/Planned Correction Date","01/01/2000","N");
rowVals["Inspection Type"] = new asiTableValObj("Program",inspType,"N");
rowVals["CAP Status"] = new asiTableValObj("CAP Status","Incomplete","N");
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
  rowVals["Address"] = new asiTableValObj("Address", vAddress,"N");
} else {
  rowVals["Address"] = new asiTableValObj("Address", "","N");
}

// logDebug("Updating ASIT");
addToASITable("CAP", rowVals);
rowsAdded++;
// // logDebug("Updating Item Was Processed checkbox");
// myUpdateGuidesheetASIField(inspId, gsi.gsType,gsi.text,"CKLST_CMNT","ADDITIONAL VIOLATION INFO", "Item Was Processed","CHECKED",capId);
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
															// logDebug("Change ASI value from:"+ ASIModel.getAttributeValue() +" to "+newValue);
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
								// logDebug("Successfully updated " + gName + " on inspection " + inspId + ".");
								return true;
							} else {
								// logDebug("Could not update guidesheet ID: " + updateResult.getErrorMessage());
								return false;
							}
						}
					}
				} else {
					// if there are guidesheets
					// logDebug("No guidesheets for this inspection");
					return false;
				}
			}
		}
	} else {
		// logDebug("No inspections on the record");
		return false;
	}
	// logDebug("No updates to the guidesheet made");
	return false;
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