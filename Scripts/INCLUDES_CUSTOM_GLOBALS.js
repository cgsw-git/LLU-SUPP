/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM_GLOBALS.js
| Event   : N/A
|
| Usage   : Accela Custom Includes.  Required for all Custom Parameters
|
| Notes   : 
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| Custom Parameters
|	Ifchanges are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
feeEstimate=false;
acaURL = "aca.supp.accela.com/LLU"
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