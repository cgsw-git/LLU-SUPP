showDebug = false;
showMessage = false;
if(inspType == "SR Investigation" && inspResult == "Create Work Order"){
closeTask("SR Investigation","Create Work Order","Updated by Inspection Result","Note");
newAppL1 = "AMS"; newAppL2 = "Storm"; newAppL3 = "Drain";
newAppL4 = "Cleaning"; newAppDesc = "Created by " + capId.getCustomID();
include("SR Create Child AMS Cases");
}
if(inspType == "SR Investigation" && inspResult == "No Work Order")
closeTask("SR Investigation","No Work Order","Updated by Inspection Result","Note");