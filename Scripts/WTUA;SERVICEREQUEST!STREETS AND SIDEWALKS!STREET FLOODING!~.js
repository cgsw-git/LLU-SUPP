if (wfTask == "SR Intake" && wfStatus == "Assigned") {
scheduleInspectDate("SR Investigation", dateAdd(null, 1, true));
}
if (wfTask == "SR Investigation" && wfStatus == "Create Work Order") {
newAppL1 = "AMS";
newAppL2 = "Storm";
newAppL3 = "Drain";
newAppL4 = "Cleaning";
newAppDesc = "Created by " + capId.getCustomID();
include("SR Create Child AMS Cases");
}