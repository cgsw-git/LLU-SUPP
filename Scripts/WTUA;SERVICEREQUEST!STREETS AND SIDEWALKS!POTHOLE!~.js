if(wfTask == "SR Intake" && wfStatus == "Assigned")
scheduleInspectDate("SR Investigation",dateAdd(null,1,true));
if(wfTask == "SR Investigation" && wfStatus == "Create Work Order"){
newAppL1 = "AMS";
newAppL2 = "Street";
newAppL3 = "Segment";
newAppL4 = "Repair";
newAppDesc = "Created by " + capId.getCustomID();
include("SR Create Child AMS Cases");
}