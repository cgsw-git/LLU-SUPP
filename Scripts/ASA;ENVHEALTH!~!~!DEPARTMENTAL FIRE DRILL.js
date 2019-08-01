/* 

Developed by Mike Zachry on 5/14/2019 

This event script:
1) sets the Department parent record to "CAP Required" when a deficiency is found
2) adds a row to the Corrective Action Plan ASIT on the parent Department record for each deficiency on the Departmental Fire Drill record type amendment.


*/


 // var myCapId = "DF0000066";
 //var myUserId = "ADMIN";

/* ASA   */  //var eventName = "ApplicationSubmitAfter";
/* WTUA  */  //var eventName = "WorkflowTaskUpdateAfter";  wfTask = "Application Submittal";	  wfStatus = "Admin Approved";  wfDateMMDDYYYY = "01/27/2015";
/* IRSA  */  //var eventName = "InspectionResultSubmitAfter" ; inspResult = "Failed"; inspResultComment = "Comment";  inspType = "Roofing"
/* ISA   */  //var eventName = "InspectionScheduleAfter" ; inspType = "Roofing"
/* PRA   */  //var eventName = "PaymentReceiveAfter";  
/* CTRCA */  //var eventName = "ConvertToRealCAPAfter";

// var useProductScript = false;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
// var runEvent = true; // set to true to simulate the event and run all std choices/scripts for the record type.  

/* master script code don't touch */ 
// aa.env.setValue("EventName",eventName); var vEventName = eventName;  var controlString = eventName;  var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA,useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA,useProductScript));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useProductScript));	}	eval(getScriptText("INCLUDES_CUSTOM",null,useProductScript));if (documentOnly) {	doStandardChoiceActions2(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName, servProvCode, useProductScripts) {	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();	vScriptName = vScriptName.toUpperCase();	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		if (useProductScripts) {			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);		} else {			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");		}		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}}logGlobals(AInfo); if (runEvent && typeof(doStandardChoiceActions) == "function" && doStdChoices) try {doStandardChoiceActions(controlString,true,0); } catch (err) { logDebug(err.message) } if (runEvent && typeof(doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z); 

//
// User code goes here
//

try {
	showDebug = true;
  var outOfCompliance = false;
  copyContacts(parentCapId,capId);
  copyAddresses(parentCapId,capId);
  editAppName(aa.cap.getCap(parentCapId).getOutput().specialText, capId)
  
  // read through the ASI fields looking for value of "Out of Compliance" 
  for (var x in AInfo) {
    
    // if out of compliance
    if (AInfo[x] == "Out of Compliance") {
      outOfCompliance = true;
      
      // add row to Corrective Action Plan ASIT on parent
      rowVals = new Array();
      // rowVals["Inspection Date"] = new asiTableValObj("Inspection Date",AInfo["Drill Date"],"N");
      rowVals.push({colName: 'Inspection Date', colValue: AInfo["Drill Date"]});
      // rowVals["Inspected By"] = new asiTableValObj("Inspected By",AInfo["Person Observing"],"N");
      rowVals.push({colName: 'Inspected By', colValue: AInfo["Person Observing"]});
      // rowVals["Inspector ID"] = new asiTableValObj("Inspector ID","ENAVARRETTE","N");
      rowVals.push({colName: 'Inspector ID', colValue: "ENAVARRETTE"});
      parentCap = aa.cap.getCap(parentCapId).getOutput();
      // rowVals["Department"] = new asiTableValObj("Department",parentCap.specialText,"N");
      rowVals.push({colName: 'Department', colValue: parentCap.specialText});
      // rowVals["Department ID #"] = new asiTableValObj("Department ID #",parentCapId.customID,"N");
      rowVals.push({colName: 'Department ID #', colValue: parentCapId.customID});
      // rowVals["Description"] = new asiTableValObj("Description","Fire Drill","N");
      rowVals.push({colName: 'Description', colValue: "Fire Drill"});
      // rowVals["Deficiency"] = new asiTableValObj("Deficiency",x,"N");
      rowVals.push({colName: 'Deficiency', colValue: x});
      // rowVals["Vio. Status"] = new asiTableValObj("Vio. Status",AInfo[x],"N");
      rowVals.push({colName: 'Vio. Status', colValue: AInfo[x]});
      // rowVals["Inspection Type"] = new asiTableValObj("Program","Fire Drill","N");
      rowVals.push({colName: 'Inspection Type', colValue: "Fire Drill"});
      // rowVals["CAP Status"] = new asiTableValObj("CAP Status","Incomplete","N");
      rowVals.push({colName: 'CAP Status', colValue: "Incomplete"});
      var addrResult = aa.address.getAddressByCapId(parentCapId);
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

      logDebug("Updating ASIT");
      // addToASITable("CAP", rowVals, parentCapId);
      options = [{capId: parentCapId}];
      addAsiTableRow("CAP", rowVals, options)
    }
  }
  // set the parent record to "CAP Required"
  if (outOfCompliance) {
    updateAppStatus("CAP Required","Updated by EMSE Script",parentCapId);
  }
  
  
  // send email notification to contacts
  // Provide the ACA URl - This should be set in INCLUDES_CUSTOM_GLOBALS
  // var acaURL = "aca.supp.accela.com/LLU"
  // Provide the Agency Reply Email - This should be set in INCLUDES_CUSTOM_GLOBALS
  var agencyReplyEmail = "noreply@accela.com"
  // Provide the contact types to send this notification
  var contactTypesArray = new Array("Primary");
  contactTypesArray[1] = "Frontline Leadership";
  contactTypesArray[2] = "Contact";
  // contactTypesArray[3] = "Executive Leadership";
  // Provide the Notification Template to use
  var notificationTemplate = "LLU FIRE DRILL NOTIFICATION";
  // Get an array of Contact Objects using Master Scripts 3.0
  var contactObjArray = getContactObjs(capId,contactTypesArray);


  for (iCon in contactObjArray) 
  {
    var tContactObj = contactObjArray[iCon];
    logDebug("ContactName: " + tContactObj.people.getFirstName() + " " + tContactObj.people.getLastName());
    if (!matches(tContactObj.people.getEmail(),null,undefined,"")) 
    { 
      // logDebug("Contact Email: " + tContactObj.people.getEmail());
      var eParams = aa.util.newHashtable();
      addParameter(eParams, "$$recordTypeAlias$$", cap.getCapType().getAlias());
      addParameter(eParams, "$$acaUrl$$", acaURL);
      // addParameter(eParams, "$$recordTypeAlias$$", "Department");
      // myGetRecordParams4Notification(eParams,capId);
      getRecordParams4Notification(eParams);
      // myGetACARecordParam4Notification(eParams,acaURL,capId);
      getACARecordParam4Notification(eParams,acaURL);
      // logDebug(capId);
      tContactObj.getEmailTemplateParams(eParams);
      // not needed getWorkflowParams4Notification(eParams); 
      // not needed getInspectionResultParams4Notification(eParams);
      getPrimaryAddressLineParam4Notification(eParams);
      // Call sendNotification if you are not using a report
      logDebug(capId);
      logDebug(getACARecordURL(acaURL));
      sendNotification(agencyReplyEmail,tContactObj.people.getEmail(),"",notificationTemplate ,eParams,null);
    }
  }
} catch (err) {
	logDebug("A JavaScript Error occured: " + err.message);
}
// end user code

// aa.env.setValue("ScriptReturnCode", "1"); 	
// aa.env.setValue("ScriptReturnMessage", debug)

