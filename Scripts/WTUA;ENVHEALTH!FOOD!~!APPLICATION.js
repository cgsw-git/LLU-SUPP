var existingFacilityIsYes = false;
var existingFacilityIsNo = false; 

permitString = appTypeArray[0]+"/"+appTypeArray[1]+"/"+appTypeArray[2]+"/Permit";

var fixedDate = aa.bizDomain.getBizDomainByValue("EH_Permit_Renew_Rule" ,"Fixed Date"); 
var doFixedDate = fixedDate.getSuccess() && fixedDate.getOutput().getAuditStatus() != "I";

var permitIssuedDate = aa.bizDomain.getBizDomainByValue("EH_Permit_Renew_Rule" ,"Permit Issued Date"); 
var doPermitIssuedDate = permitIssuedDate.getSuccess() && permitIssuedDate.getOutput().getAuditStatus() != "I";

if(wfTask == "Permit Issuance" && wfStatus == "Issued" && AInfo["Existing Facility"]=='Yes'){
    include("EH ESTABLISH LINKS TO REFERENCE CONTACTS"); 
    existingFacilityIsYes = true;
} 
if(wfTask == "Permit Issuance" && wfStatus == "Issued" && AInfo["Existing Facility"]=='No'){
    include("EH ESTABLISH LINKS TO REFERENCE CONTACTS"); 
    existingFacilityIsNo = true;
}
if(doFixedDate && doPermitIssuedDate){
	var fixedDates= lookup("EH_RENEWAL_FIXED_DATE", permitString); 
	if(fixedDates==undefined){
		doFixedDate = false;
	}else{
		doPermitIssuedDate=false;
	}
}
if(existingFacilityIsYes && doFixedDate){
    var fixedDates= lookup("EH_RENEWAL_FIXED_DATE", permitString);
    availableExpDate=getNextAvailableExpDate(fixedDates, wfDateMMDDYYYY); 
    include("EH FOOD EXISTING FACILITY IS YES");
} 
if(existingFacilityIsYes && doPermitIssuedDate){
    var monthsToInitialExpire = lookup("EH_RENEWAL_INTERVAL", permitString); 
    availableExpDate=dateAddMonths(wfDateMMDDYYYY, monthsToInitialExpire); 
    include("EH FOOD EXISTING FACILITY IS YES");
}
if(existingFacilityIsNo && doFixedDate){
    var fixedDates= lookup("EH_RENEWAL_FIXED_DATE", permitString);
    availableExpDate=getNextAvailableExpDate(fixedDates, wfDateMMDDYYYY); 
    include("EH FOOD EXISTING FACILITY IS NO");
}
if(existingFacilityIsNo && doPermitIssuedDate){
    var monthsToInitialExpire = lookup("EH_RENEWAL_INTERVAL", permitString); 
    availableExpDate=dateAddMonths(wfDateMMDDYYYY, monthsToInitialExpire); 
    include("EH FOOD EXISTING FACILITY IS NO");
}