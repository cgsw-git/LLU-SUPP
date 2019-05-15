if(parentCapId) 
{
	var capType = aa.cap.getCapTypeModelByCapID(parentCapId).getOutput(); 
	var parentTypeString  =	capType.toString();
	
}

if(isReadyRenew(parentCapId))
{
	var monthsToInitialExpire="";
	var renewBal = 0; 
	var fees = loadFees(capId); 
	var fixedDate = aa.bizDomain.getBizDomainByValue("EH_Permit_Renew_Rule" ,"Fixed Date"); 
	var doFixedDate = fixedDate.getSuccess() && fixedDate.getOutput().getAuditStatus() != "I";
	var permitIssuedDate = aa.bizDomain.getBizDomainByValue("EH_Permit_Renew_Rule" ,"Permit Issued Date"); 
	var doPermitIssuedDate = permitIssuedDate.getSuccess() && permitIssuedDate.getOutput().getAuditStatus() != "I";

	for(x in fees) 
	{
		if(fees[x].description == "Renewal Fee" && fees[x].status == "INVOICED" )
		{
			renewBal += fees[x].amount - fees[x].amountPaid;
		}		
	}
		
	if(doFixedDate && doPermitIssuedDate) 
	{
		var fixedDates= lookup("EH_RENEWAL_FIXED_DATE", parentTypeString); 
		if(fixedDates==undefined) 
			doFixedDate = false; 
		else 
			doPermitIssuedDate=false;	
	}




	if(renewBal <= 0) 
	{
		closeTask("Permit Status"," Renewed","Renewed on "+ sysDate +" via PRA ",null); 
			updateAppStatus("Complete");
		if(doPermitIssuedDate)
		{
			var expDate = aa.expiration.getLicensesByCapID(parentCapId).getOutput().getExpDateString().replaceAll('-','/');
			monthsToInitialExpire = lookup("EH_RENEWAL_INTERVAL", parentTypeString );
			if(!matches(monthsToInitialExpire,"null",undefined,"")) 
			{
				aa.debug("mic test",monthsToInitialExpire +"New Date="+dateAdd(dateAddMonths(expDate, monthsToInitialExpire),0));
				licEditExpInfoforRenewal("Active",dateAdd(dateAddMonths(expDate, monthsToInitialExpire),0),parentCapId );
			}
		}
		
		if(doFixedDate)
		{
				var expDate = aa.expiration.getLicensesByCapID(parentCapId).getOutput().getExpDateString().replaceAll('-','/');
				var fixedDates= lookup("EH_RENEWAL_FIXED_DATE", parentTypeString  ); 
				if(!matches(fixedDates,"null",undefined,""))  
				{
					licEditExpInfoforRenewal("Active", getNextAvailableExpDate(fixedDates, expDate),parentCapId ); 
				}
				else 
					logDebug("Warning: Failed to update the renewal info, please define the permit type in the Standard Choice EH_RENEWAL_FIXED_DATE.");
			
		}
	}
}