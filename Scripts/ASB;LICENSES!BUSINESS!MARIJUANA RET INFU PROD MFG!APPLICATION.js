showMessage = true;
var customFields = "";
var zoningUsePermit=false; rightOfPossessionDocuments= false; validID= false; floorPlan= false; areaMap=
false; securityPlan= false;
if(AInfo["Zoning Use Permit"] == "No") {
var zoningUsePermit=true;
customFields +="Zoning Use Permit;";
}
if(AInfo["Right of Possession Documents"] == "No") {
rightOfPossessionDocuments=true;
customFields+="Right of Possession Documents;";}
if(AInfo["Valid ID"] == "No") {
validID=true;
customFields+="Valid ID;";
}
if(AInfo["Floor Plan"] == "No") {
floorPlan=true;
customFields+="Floor Plan;";
}
if(AInfo["Area Map"] == "No") {
areaMap=true;
customFields+="Area Map;";}
if(AInfo["Security Plan"] == "No") {
securityPlan=true;
customFields+="Security Plan;";
}
if(zoningUsePermit || rightOfPossessionDocuments || validID || floorPlan || areaMap || securityPlan){
cancel = true;
customFields = customFields.substring(0, customFields.length - 1);
message = "<b>Custom fields ("+customFields+") cannot be 'NO' and all legal documents must be provided before moving forward.</b><br><br>";
debug=message;
}