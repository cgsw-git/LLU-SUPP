if (wfTask == "SR Intake" && wfStatus == "Assigned") {
newAppL1 = "Enforcement";
newAppL2 = "Incident";
newAppL3 = "Abatement";
newAppL4 = "Noise Nuisance";
newAppDesc = "Created by " + capId.getCustomID();
include("SR Create Child Cases");
}