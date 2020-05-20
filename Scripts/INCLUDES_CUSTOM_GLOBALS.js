/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM_GLOBALS.js
| Event   : N/A
|
| Usage   : Accela Custom Includes.  Required for all Custom Parameters
|
| Notes   : wfComment was added to support a custom getRecordParams4Notification
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| Custom Parameters
|	Ifchanges are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var feeEstimate=false;
var acaURL = "aca-supp.accela.com/LLU";
var agencyReplyEmail = "LLU.EHS@accela.com"
var wfComment; 
if(vEventName.equals("FeeEstimateAfter4ACA")) 
	feeEstimate=true;
debugLevel = 2;
if (currentUserID == "ADMIN") {
   showDebug = true;
   showMessage = true;
   debugLevel = 3;
}


/*------------------------------------------------------------------------------------------------------/
| END Custom Parameters
/------------------------------------------------------------------------------------------------------*/