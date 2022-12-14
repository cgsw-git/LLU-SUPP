
	/*------------------------------------------------------------------------------------------------------/
	| Program: CAPViolationsNotificationBatch.js  Trigger: Batch
	| Client: LLU

	| Version 1.0 - Base Version. 12/27/2018
	| Version 1.1 02/16/2021 - Modified to correct record status if no CAP items have a status of Incomplete or Denied
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

  const SECOND = 1000;
  const MINUTE = 1000 * 60;
  const HOUR = 1000 * 60 * 60;
  const DAY = 1000 * 60 * 60 * 24;
  const MONTH = 1000 * 60 * 60 * 24 * 30;
  const YEAR = 1000 * 60 * 60 * 24 * 30 * 12;  
  var systemUserObj = aa.person.getUser("ADMIN").getOutput();
  var currentUserID = "ADMIN";
  var startDate = new Date();
  var startTime = startDate.getTime();			// Start timer
  var skippedDepartments = 0;
  var processedDepartments = 0;
  var emailedDepartments = 0;
  var emailsSent = 0;
  var statusCorrected = 0;
  showDebug = true;
  daysDelinquent = "30";
  var wfComment; // to accomodate customization that was done to getRecordParams4Notification() in INCLUDES_CUSTOM
  logDebug("Start of Job");
  
  //loop through Department records with status of CAP required
  var getResult = aa.cap.getByAppType("EnvHealth","Department", null, null);
  if (getResult.getSuccess()) {
    var list = getResult.getOutput();
    // logDebug("Success! Records Equals = " + list.length) ;
    for (var i in list) {
      processedDepartments = list.length;
      if (list[i].getCapStatus() == "CAP Required" ) {
		  // check CAP entries and update the record status appropriately
		capId = list[i].getCapID();
		if (capId.getCustomID() == "FA0000868") {
			myTable = loadASITable("CAP",capId)
			// logDebug("capId = " + capId);
			for(r in myTable) {
				currentRow = myTable[r];
				if (currentRow["First Response Date"] == "" 
					&& currentRow["Inspection date"] != "" 
					&& ((startDate - convertDate(aa.util.parseDate(currentRow["Inspection Date"])))/DAY) > daysDelinquent) {
					emailedDepartments = ++emailedDepartments;
					cap = list[i];
					capIDString = capId.getCustomID();
					sendOutstandingCAPItemsReport();
					break;
				}else{
					// set record status to Active
					// logDebug("updating status for " + capId.getCustomID());
					// appStatus = "Active"
					// updateAppStatus(appStatus,"Updated by EMSE Script",capId);
					// statusCorrected = ++statusCorrected;
				}
			}
		}else{
			skippedDepartments = ++skippedDepartments;
		}
	  } else {
		skippedDepartments = ++skippedDepartments;
	  }
    } //for (var i in list)
  }else{
     logDebug("Error getting records");
  } //if (getResult.getSuccess())

  logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
  logDebug("Departments processed:" + processedDepartments);
  logDebug("Departments skipped: " + skippedDepartments);
  logDebug("Notified departments: " + emailedDepartments);
  logDebug("Emails sent " + emailsSent);
  logDebug("Department Status values corrected " + statusCorrected);

	/*------------------------------------------------------------------------------------------------------/
	| <===========END=Main=Loop================>
	/-----------------------------------------------------------------------------------------------------*/

function sendOutstandingCAPItemsReport(){

  // Provide the ACA URl - This should be set in INCLUDES_CUSTOM_GLOBALS
  //var acaURL = "aca.accela.com/LLU"
  // Provide the Agency Reply Email - This should be set in INCLUDES_CUSTOM_GLOBALS
  //var agencyReplyEmail = "noreply@accela.com"
  // Provide the contact types to send this notification
  var contactTypesArray = new Array("Primary");
  contactTypesArray[1] = "Executive Leadership";
  // contactTypesArray[2] = "Contact";
  // Provide the Notification Template to use
  var notificationTemplate = "CAP ESCALATION NOTIFICATION";
  // Provide the name of the report from Report Manager
  var reportName = "Overdue CAP Report";
  // Get an array of Contact Objects using Master Scripts 3.0
  var contactObjArray = getContactObjs(capId,contactTypesArray);
  // Set the report parameters. For Ad Hoc use p1Value, p2Value etc.
  var rptParams = aa.util.newHashMap();
  //rptParams.put("serviceProviderCode",servProvCode);
  rptParams.put("department_name", capId.getCustomID());
  rptParams.put("daysDelinquent", daysDelinquent);

  if(!matches(reportName,null,undefined,"")){
  // Call runReportAttach to attach the report to Documents Tab
  //var attachResults = runReportAttach(capId,reportName,rptParams);
  //logDebug("Run report attach results: " + attachResults);
  }

  for (iCon in contactObjArray) {
    var tContactObj = contactObjArray[iCon];
    logDebug("ContactName: " + tContactObj.people.getFirstName() + " " + tContactObj.people.getLastName());
    if (!matches(tContactObj.people.getEmail(),null,undefined,"")) {
      emailsSent = ++emailsSent;
      // logDebug("Contact Email: " + tContactObj.people.getEmail());
      var eParams = aa.util.newHashtable();
      addParameter(eParams, "$$recordTypeAlias$$", cap.getCapType().getAlias());
      // addParameter(eParams, "$$recordTypeAlias$$", "Department");
      myGetRecordParams4Notification(eParams,capId);
      getACARecordParam4Notification(eParams,acaURL);
      tContactObj.getEmailTemplateParams(eParams);
      // not needed getWorkflowParams4Notification(eParams); 
      // not needed getInspectionResultParams4Notification(eParams);
      getPrimaryAddressLineParam4Notification(eParams);
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
  // logDebug("itemCapDetailObjResult = " + itemCapDetailObjResult.getSuccess() );
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

function findValueInASITable(finding, inColumn, inTable, capId) {
	if (matches(capId,null,undefined,"")) {
		myTable = loadASITable(inTable);
	}else{
		myTable = loadASITable(inTable,capId);
	}
		
	
	for(r in myTable) {
		currentRow = myTable[r];
		if (currentRow[inColumn] == finding) {
			return true;
		}
	}
	return false;
}
