include("EMSE:LicProfLookup:UpdateLP:BaseFields");
include("EMSE:LicProfLookup:UpdateLP:ApplicationStatus");
if (licObj.updateRecord()) {
logDebug("LP Updated Successfully");
} else {
logDebug("LP Update Failed");
}