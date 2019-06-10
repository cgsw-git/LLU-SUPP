

	/*------------------------------------------------------------------------------------------------------/
	| Program: inspectionActivityNotificationBatch.js  Trigger: Batch
	| Client: LLU

	| Version 1.0 - Base Version. 03/06/2019
	|
	/------------------------------------------------------------------------------------------------------*/
	/*------------------------------------------------------------------------------------------------------/
	|
	| START: USER CONFIGURABLE PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/


	emailText = "";
	message = "";
	br = "<br>";
	debug = "";
  showDebug = true;
  logDebug = true;
	/*------------------------------------------------------------------------------------------------------/
	| BEGIN Includes
	/------------------------------------------------------------------------------------------------------*/
	SCRIPT_VERSION = 3.0

	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
	eval(getScriptText("INCLUDES_BATCH"));
	eval(getScriptText("INCLUDES_CUSTOM"));


	function getScriptText(vScriptName){
		vScriptName = vScriptName.toUpperCase();
		var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
		var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
		return emseScript.getScriptText() + "";
	}

	/*------------------------------------------------------------------------------------------------------/
	|
	| END: USER CONFIGURABLE PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/


	sysDate = aa.date.getCurrentDate();
	batchJobResult = aa.batchJob.getJobID()
	batchJobName = "" + aa.env.getValue("BatchJobName");
	wfObjArray = null;

	batchJobID = 0;
	if (batchJobResult.getSuccess())
	  {
	  batchJobID = batchJobResult.getOutput();
	  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
	  }
	else 
	  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());

	/*----------------------------------------------------------------------------------------------------/
	|
	| Start: BATCH PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/
  

	/*----------------------------------------------------------------------------------------------------/
	|
	| End: BATCH PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/




	/*------------------------------------------------------------------------------------------------------/
	| <===========Main=Loop================>
	|
	/-----------------------------------------------------------------------------------------------------*/

	var systemUserObj = aa.person.getUser("ADMIN").getOutput();
  var currentUserID = "ADMIN";
  var startDate = new Date();
  var startTime = startDate.getTime();			// Start timer
  var skippedInspections = 0;
  var processedInspections = 0;
  var duplicateDepartments = 0;
  var emailsSent = 0;
  var numberOfInspections = 0;
  showDebug = true;
  var wfComment; // to accomodate customization that was done to getRecordParams4Notification() in INCLUDES_CUSTOM
  logDebug("Start of Job");
  
  // get the department records
  var myResult = aa.cap.getByAppType("EnvHealth","Department",null,null);
  if (myResult.getSuccess()) {
    var departments = myResult.getOutput();

    // set the date parameters (assumes this is run the day after the observered time period)
    // var begDate = aa.util.formatDate(aa.util.dateDiff(aa.util.now(),"day",-7),"yyyy-MM-dd");
    var begDate = aa.util.dateDiff(aa.util.now(),"day",-7);
    // var endDate = aa.util.formatDate(aa.util.dateDiff(aa.util.now(),"day",-1),"yyyy-MM-dd");
    var endDate = aa.util.dateDiff(aa.util.now(),"day",-1);
     
    // loop through all the departments
    for (var d in departments ) {
      capId = departments[d].getCapID();
      var myResult = aa.cap.getCap(capId);
      var cap = myResult.getOutput();
      var altId = cap.getCapModel().getAltID()
    
      // logDebug(inspections.length);
      if (altId == "FA0000868") {

        // get the inspections for the department
        myResult = aa.inspection.getInspections(capId);
        var inspections = myResult.getOutput();
        numberOfInspections+= inspections.length;

        // loop through the inspections
        for (var i in inspections ) {
          var inspectionStatus = inspections[i].getInspectionStatus();
          
          var inspectedDate = inspections[i].getInspectionDate();
          if (inspectedDate != null) {
            // convert inspectedDate from dateString type to date type
            var inspObj = inspections[i];
            var inspectedDateString = inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
            inspectedDate = aa.util.parseDate(inspectedDateString);
            // logDebugObject(inspections[i]);
            // logDebug("inspected Date: " + aa.util.formatDate(inspectedDate,"yyyy-MM-dd"));
            // logDebugObject(inspectedDate);
            // logDebug("beg Date: " + aa.util.formatDate(begDate,"yyyy-MM-dd"));
            // logDebugObject(begDate);
            // break;
            // logDebug("inspected date: " + aa.util.formatDate(inspectedDate,"yyyy-MM-dd")) ; 
            // logDebug("      beg date: " + aa.util.formatDate(begDate,"yyyy-MM-dd")) ;
          }
          
          // skip cancelled and scheduled inspections and inspections not withing date range
          if (inspectedDate != null && (inspectionStatus == "Failed to Meet Standards" || inspectionStatus == "Met Standards") && inspectedDate >= begDate && inspectedDate <= endDate ) {

            processedInspections++;

            // send the notification
            logDebug(altId);
            mySendInspectionActivityReport();
            break;
          }
        }
      }
    }
  }else{
    logDebug("no departments")
  }

  skippedInspections = numberOfInspections-processedInspections;
  logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
  logDebug("Number of Inspections : " + numberOfInspections);
  logDebug("Inspections processed:" + processedInspections);
  // logDebug("Inspections skipped: " + skippedInspections);
  // logDebug("Duplicate departments: " + duplicateDepartments);
  logDebug("Emails sent " + emailsSent);



	/*------------------------------------------------------------------------------------------------------/
	| <===========END=Main=Loop================>
	/-----------------------------------------------------------------------------------------------------*/

function mySendInspectionActivityReport(){
  

  // Provide the ACA URl - This should be set in INCLUDES_CUSTOM_GLOBALS
  //var acaURL = "aca.accela.com/LLU"
  // Provide the Agency Reply Email - This should be set in INCLUDES_CUSTOM_GLOBALS
  var agencyReplyEmail = "noreply@accela.com"
  // Provide the contact types to send this notification
  var contactTypesArray = new Array("Primary");
  contactTypesArray[0] = "Frontline Leadership";
  // Provide the Notification Template to use
  var notificationTemplate = "LLU WEEKLY INSPECTION ACTIVITY EMAIL";
  // Provide the name of the report from Report Manager
  var reportName = "CAP Weekly Activity";
  // Get an array of Contact Objects using Master Scripts 3.0
  var contactObjArray = getContactObjs(capId,contactTypesArray);
  // Set the report parameters. For Ad Hoc use p1Value, p2Value etc.
  var rptParams = aa.util.newHashMap();
  //rptParams.put("serviceProviderCode",servProvCode);
  rptParams.put("departmentID", capId.getCustomID());

  if(!matches(reportName,null,undefined,"")){
  // Call runReportAttach to attach the report to Documents Tab
  //var attachResults = runReportAttach(capId,reportName,rptParams);
  //logDebug("Run report attach results: " + attachResults);
  }

  for (iCon in contactObjArray) {
    var tContactObj = contactObjArray[iCon];
    logDebug("ContactName: " + tContactObj.people.getFirstName() + " " + tContactObj.people.getLastName());
    if (!matches(tContactObj.people.getEmail(),null,undefined,"")) {
      emailsSent++;
      // logDebug("Contact Email: " + tContactObj.people.getEmail());
      var eParams = aa.util.newHashtable();
      addParameter(eParams, "$$recordTypeAlias$$", cap.getCapType().getAlias());
      // addParameter(eParams, "$$recordTypeAlias$$", "Department");
      myGetRecordParams4Notification(eParams,capId);
      getACARecordParam4Notification(eParams,acaURL,capId);
      // logDebug(capId);
      tContactObj.getEmailTemplateParams(eParams);
      // not needed getWorkflowParams4Notification(eParams); 
      // not needed getInspectionResultParams4Notification(eParams);
      getPrimaryAddressLineParam4Notification(eParams,capId);
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

 
 function myGetRecordParams4Notification(params) {

	itemCapId = (arguments.length == 2) ? arguments[1] : capId;
	// pass in a hashtable and it will add the additional parameters to the table
  // logDebug("capId = " + capId);
  // logDebug("itemCapId = " + itemCapId);

	var itemCapIDString = itemCapId.getCustomID();
	var itemCap = aa.cap.getCap(itemCapId).getOutput();
	var itemCapName = itemCap.getSpecialText();
	var itemCapStatus = itemCap.getCapStatus();
	var itemFileDate = itemCap.getFileDate();
	var itemCapTypeAlias = itemCap.getCapType().getAlias();
	var itemHouseCount;
	var itemFeesInvoicedTotal;
	var itemBalanceDue;
	
  var itemCapDetailObjResult = aa.cap.getCapDetail(itemCapId);	
  logDebug("itemCapDetailObjResult = " + itemCapDetailObjResult.getSuccess() );
 	if (itemCapDetailObjResult.getSuccess())
	{
		itemCapDetail = itemCapDetailObjResult.getOutput();
		itemHouseCount = itemCapDetail.getHouseCount();
		itemFeesInvoicedTotal = itemCapDetail.getTotalFee();
		itemBalanceDue = itemCapDetail.getBalance();
	}
	
 	var workDesc = workDescGet(itemCapId);

	addParameter(params, "$$altID$$", itemCapIDString);
  // logDebug("$$altID$$ = " + itemCapIDString);
  
	addParameter(params, "$$capName$$", itemCapName);
  // logDebug("$$capName$$ = " +itemCapName );
	
	addParameter(params, "$$recordTypeAlias$$", itemCapTypeAlias);
  // logDebug("$$recordTypeAlias$$ = " + itemCapTypeAlias);

	addParameter(params, "$$capStatus$$", itemCapStatus);
  // logDebug("$$capStatus$$ = " + itemCapStatus);

	addParameter(params, "$$fileDate$$", itemFileDate);
  // logDebug("$$fileDate$$ = " + itemFileDate);

	addParameter(params, "$$balanceDue$$", "$" + parseFloat(itemBalanceDue).toFixed(2));
  // logDebug("$$balanceDue$$ = $" + parseFloat(itemBalanceDue).toFixed(2))
	
	addParameter(params, "$$workDesc$$", (workDesc) ? workDesc : "");
  // logDebug("$$workDesc$$ = " + (workDesc) ? workDesc : "" )

	return params;

  }

  function logDebugObject(myObject) {
/*
usage - logDebugObject(object)

author - Michael Zachry
created - 10/10/2018

updates
10/11/2018 - initial version

*/
  //list the methods
  try {
    logDebug("object is is a " + myObject.getClass());
    logDebug("object has the following methods:");
    for (x in myObject) {
      if (typeof(myObject[x]) == "function" ) {
        logDebug("  " + x);
      }
    }

    //list the properties and values    
    logDebug("object has the following properties and values:");
    for (x in myObject) {
      if (typeof(myObject[x]) != "function" ) {
        logDebug("  " + x + " = " + myObject[x]);
      }
    }
  } catch (err) {
    logDebug("A JavaScript Error occured: " + err.message);
  }
}


function myGetACARecordParam4Notification(params,acaUrl,itemCap) {

	// itemCap = (arguments.length == 3) ? arguments[2] : capId;

	addParameter(params, "$$acaRecordUrl$$", myGetACARecordURL(acaUrl,itemCap));

	return params;	

}

function myGetACARecordURL(acaUrl,itemCap) {
	// itemCap = (arguments.length == 2) ? arguments[1] : capId;
	var enableCustomWrapper = lookup("ACA_CONFIGS","ENABLE_CUSTOMIZATION_PER_PAGE");
	var acaRecordUrl = "";
	var id1 = itemCap.ID1;
 	var id2 = itemCap.ID2;
 	var id3 = itemCap.ID3;
 	var itemCapModel = aa.cap.getCap(itemCap).getOutput().getCapModel();

   	acaRecordUrl = acaUrl + "/urlrouting.ashx?type=1000";   
	acaRecordUrl += "&Module=" + itemCapModel.getModuleName();
	acaRecordUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
	acaRecordUrl += "&agencyCode=" + aa.getServiceProviderCode();
	if(matches(enableCustomWrapper,"Yes","YES")) acaRecordUrl += "&FromACA=Y";

   	return acaRecordUrl;

} 
 
