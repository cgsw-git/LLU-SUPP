/* 

Developed by Mike Zachry on 5/14/2019 

This event script:
1) sets the Department parent record to "CAP Required" when a deficiency is found
2) adds a row to the Corrective Action Plan ASIT on the parent Department record for each deficiency on the Departmental Fire Drill record type amendment.
3) attaches a copy of the report to the parent record
4) sends an email notice with link to the report

9/3/2020 - Mike Zachry - Disable logging deficiencies to the CAP ASIT per Erik Navaette see Trello card https://trello.com/c/ff2sRp5d
5/19/2020 - corrected publicuser variable to publicUser


*/


 // var myCapId = "DF0000056";
 // var myUserId = "ADMIN";

/* ASA   */  //var eventName = "ApplicationSubmitAfter";
/* WTUA  */  //var eventName = "WorkflowTaskUpdateAfter";  wfTask = "Application Submittal";	  wfStatus = "Admin Approved";  wfDateMMDDYYYY = "01/27/2015";
/* IRSA  */  //var eventName = "InspectionResultSubmitAfter" ; inspResult = "Failed"; inspResultComment = "Comment";  inspType = "Roofing"
/* ISA   */  //var eventName = "InspectionScheduleAfter" ; inspType = "Roofing"
/* PRA   */  //var eventName = "PaymentReceiveAfter";  
/* CTRCA */  //var eventName = "ConvertToRealCAPAfter";

// var useProductScript = false;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
// var runEvent = false; // set to true to simulate the event and run all std choices/scripts for the record type.  

/* master script code don't touch */ 
// aa.env.setValue("EventName",eventName); var vEventName = eventName;  var controlString = eventName;  var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA,useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA,useProductScript));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useProductScript));	}	eval(getScriptText("INCLUDES_CUSTOM",null,useProductScript));if (documentOnly) {	doStandardChoiceActions2(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName, servProvCode, useProductScripts) {	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();	vScriptName = vScriptName.toUpperCase();	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		if (useProductScripts) {			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);		} else {			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");		}		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}}logGlobals(AInfo); if (runEvent && typeof(doStandardChoiceActions) == "function" && doStdChoices) try {doStandardChoiceActions(controlString,true,0); } catch (err) { logDebug(err.message) } if (runEvent && typeof(doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z); 

//
// User code goes here
//

try {
  if(publicUser) {
    showDebug = true;
    var outOfCompliance = false;
    copyContacts(parentCapId,capId);
    copyAddresses(parentCapId,capId);
    editAppName(aa.cap.getCap(parentCapId).getOutput().specialText, capId)
    var parentCapIDString = parentCapId.getCustomID();

/* Disable creating CAP entries per Erik Navaette. See Trello card https://trello.com/c/ff2sRp5d   
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
        if (!rowVals.empty) {
          options = {capId: parentCapId};
          myResult = addAsiTableRow("CAP", rowVals, options)
          if (myResult.getSuccess()) {
            logDebug("Success adding row");
          }else{
            logDebug("Error adding row: " + myResult.getErrorMessage());
          }
        }else{
          logDebug("nothing to push");
        }
      }
    }
    // set the parent record to "CAP Required"
    if (outOfCompliance) {
      updateAppStatus("CAP Required","Updated by EMSE Script",parentCapId);
    }
*/    
    // send email notification to contacts
    // Provide the ACA URl - This should be set in INCLUDES_CUSTOM_GLOBALS
    // var acaURL = "aca.supp.accela.com/LLU"
    // Provide the Agency Reply Email - This should be set in INCLUDES_CUSTOM_GLOBALS
    //var agencyReplyEmail = "noreply@accela.com"
    // Provide the contact types to send this notification
    var contactTypesArray = new Array("Primary"); 
    contactTypesArray[1] = "Frontline Leadership";
    contactTypesArray[2] = "Contact";
    // contactTypesArray[3] = "Executive Leadership";
    // Provide the Notification Template to use
    var notificationTemplate = "LLU FIRE DRILL NOTIFICATION";
    // establish the template parameter hashtable
    var eParams = aa.util.newHashtable();
    // Provide the name of the report from Report Manager
    var reportName = "5012 Fire Drill Observation";
    // Get an array of Contact Objects using Master Scripts 3.0
    var contactObjArray = getContactObjs(capId,contactTypesArray);

    var rptParams = aa.util.newHashMap();
    rptParams.put("recordID", capId.getCustomID());
    // rptParams.put("recordIDText", capId.getCustomID());
    logDebug("report recordID parameter: " + capId.getCustomID() );

    if(!matches(reportName,null,undefined,"")){
      // Call runReportAttach to attach the report to parent record Documents Tab
      var attachToRecord = parentCapId;
      logDebug("attach report to record: " + attachToRecord);
      var myResults = myRunReportAttach(attachToRecord,reportName,rptParams);
      logDebug("Run report attach results: " + myResults.getSuccess());
      if (myResults.getSuccess()) {
        var reportResults = myResults.getOutput();
        // logDebugObject(reportResults);
        var reportName = reportResults.name;
        logDebug("reportName: " + reportName);
        // var reportName = "5012FireDrillObservation_20190925_161330.pdf";
        reportModel = getRecordModelByDocumentName(attachToRecord, reportName)
        if (reportModel) {
          var eParams = getACADocDownloadParam4Notification(eParams,acaURL,reportModel);
          logDebug("getRecordModelByDocumentName reportURL: " + getACADocumentDownloadUrl(acaURL,reportModel));
        }else{
          logDebug("error getting report model");
        }
      }
    }

    for (iCon in contactObjArray) 
    {
      reportName = "";
      var tContactObj = contactObjArray[iCon];
      logDebug("ContactName: " + tContactObj.people.getFirstName() + " " + tContactObj.people.getLastName());
      if (!matches(tContactObj.people.getEmail(),null,undefined,"")) 
      { 
        // logDebug("Contact Email: " + tContactObj.people.getEmail());
        addParameter(eParams, "$$acaUrl$$", acaURL);
        getRecordParams4Notification(eParams);
        getACARecordParam4Notification(eParams,acaURL);
        addParameter(eParams, "$$parentAltID$$", parentCapIDString);
        tContactObj.getEmailTemplateParams(eParams);
        getPrimaryAddressLineParam4Notification(eParams);
        // logDebug(capId);
        // logDebug(getACARecordURL(acaURL));
        if(!matches(reportName,null,undefined,"")){
          // Call runReport4Email to generate the report and send the email
          runReport4Email(capId,reportName,tContactObj,rptParams,eParams,notificationTemplate,cap.getCapModel().getModuleName(),agencyReplyEmail);	
        }else{
          // Call sendNotification if you are not using a report
          sendNotification(agencyReplyEmail,tContactObj.people.getEmail(),"",notificationTemplate ,eParams,null);
        }
      }
    }
  }
} catch (err) {
	logDebug("A JavaScript Error occured: " + err.message);
}
// end user code

// aa.env.setValue("ScriptReturnCode", "1"); 	
// aa.env.setValue("ScriptReturnMessage", debug)

/**
 * Runs a report with any specified parameters and attaches it to the record
 * *** This special version returns the attach results instead of the reportInfoScript object 
 *     to enable the caller to have access to attachment properties to create a deep link to the attachment
 * @example
 *		runReportAttach(capId,"ReportName","altid",capId.getCustomID(),"months","12");
 *		runReportAttach(capId,"ReportName",paramHashtable);
 * @param capId
 *			itemCapId - capId object 
 * @param {report parameter pairs} or {hashtable}
 *			optional parameters are report parameter pairs or a parameters hashtable
 * @returns {result object}
 *			if the report was generated and attached return true
 *
 */
function myRunReportAttach(itemCapId,aaReportName)
	{

	var reportName = aaReportName;

	reportResult = aa.reportManager.getReportInfoModelByName(reportName);

	if (!reportResult.getSuccess())
		{ logDebug("**WARNING** couldn't load report " + reportName + " " + reportResult.getErrorMessage()); return false; }

	var report = reportResult.getOutput(); 

	var itemCap = aa.cap.getCap(itemCapId).getOutput();
	itemAppTypeResult = itemCap.getCapType();
	itemAppTypeString = itemAppTypeResult.toString(); 
	itemAppTypeArray = itemAppTypeString.split("/");

	report.setModule(itemAppTypeArray[0]); 
	report.setCapId(itemCapId.getID1() + "-" + itemCapId.getID2() + "-" + itemCapId.getID3()); 
	report.getEDMSEntityIdModel().setAltId(itemCapId.getCustomID());

	var parameters = aa.util.newHashMap(); 

	if(arguments.length > 2 && arguments[2].getClass().toString().equals("class java.lang.String")){
		// optional parameters are report parameter pairs
		// for example: runReportAttach(capId,"ReportName","altid",capId.getCustomID(),"months","12");
		for (var i = 2; i < arguments.length ; i = i+2)
		{
			parameters.put(arguments[i],arguments[i+1]);
			logDebug("Report parameter: " + arguments[i] + " = " + arguments[i+1]);
		}
	}
	else if(arguments.length > 2 && arguments[2].getClass().toString().equals("class java.util.HashMap")){
		// optional argument is a hashmap so assign it to parameters
		parameters = arguments[2]
	}

	report.setReportParameters(parameters);

	var permit = aa.reportManager.hasPermission(reportName,currentUserID); 
	if(permit.getOutput().booleanValue()) 
		{ 
			var reportResult = aa.reportManager.getReportResult(report);
      // logDebugObject(report);
      // logDebugObject(reportResult);
      // logDebugObject(reportResult.getOutput());
			if(reportResult){
				logDebug("Report " + aaReportName + " has been run for " + itemCapId.getCustomID());
				return reportResult;
			}
		}
	else{
		logDebug("No permission to report: "+ reportName + " for user: " + currentUserID);
		return false;
	}
} 

function getRecordModelByDocumentName(capId, documentName) {
  // Get a list of documents attached to this record
  var vDocListArray = getDocumentListByCapId(parentCapId);
  var vDocListString = "";
  for(iDoc in vDocListArray){
    var documentModel = vDocListArray[iDoc];
    // logDebug("document name: " + documentModel.getDocName());
    // logDebugObject(documentModel);
    // break;
    // vDocListString += vDocListString + documentModel.getDocName() + ": " + getACADocumentDownloadUrl(acaURL,documentModel) + br;
    // logDebug(documentName);
    // logDebug(documentModel.getDocName());
    if (documentModel.getDocName() == documentName) {
      return documentModel;
    }
  }
  return false;
}  

function getDocumentListByCapId(capId) {
	// Returns an array of documentmodels if any
	// returns an empty array if no documents

	var docListArray = new Array();

	docListResult = aa.document.getCapDocumentList(capId,currentUserID);

	if (docListResult.getSuccess()) {		
		docListArray = docListResult.getOutput();
	}
	return docListArray;
} 

