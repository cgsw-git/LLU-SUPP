if (wfTask == "SR Intake" && wfStatus == "Assigned") {
scheduleInspectDate("SR Investigation", dateAdd(null, 1, true));
}
if (wfTask == "SR Investigation" && wfStatus == "Create Work Order") {
newAppL1 = "AMS";
newAppL2 = "Water";
newAppL3 = "Hydrant";
newAppL4 = "Repair";
newAppDesc = "Created by " + capId.getCustomID();
include("SR Create Child AMS Cases");
}