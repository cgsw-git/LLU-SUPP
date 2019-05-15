if (wfTask == "SR Intake" && wfStatus == "Assigned") {
newAppL1 = "Enforcement";
newAppL2 = "Incident";
newAppL3 = "Health and Safety";
newAppL4 = "Vacant Building";
newAppDesc = "Created by " + capId.getCustomID();
include("SR Create Child Cases");
}