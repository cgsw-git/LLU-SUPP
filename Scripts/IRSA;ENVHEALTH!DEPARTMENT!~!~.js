// Generate and attach the 5001 Inspection Report to the inspected record
inspObj = aa.inspection.getInspection(capId,inspId).getOutput();
var inspDate =  inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
var inspType = inspObj.getInspectionType();
var customID = capId.getCustomID();
var reportParams = aa.util.newHashMap();
addParameter(reportParams,"departmentID",customID);
addParameter(reportParams, "inspectionDate",inspDate);
addParameter(reportParams, "inspectionType",inspType);
var myResult = runReportAttach(capId,"5001 Inspection Report",reportParams);
// End generate and attach the 5001 Inspection Report to the inspected record

