// Generate and attach the 5001 Inspection Report to the inspected record

inspObj = aa.inspection.getInspection(capId,inspId).getOutput();
var inspDate =  inspObj.getInspectionDate().getMonth() + "/" + inspObj.getInspectionDate().getDayOfMonth() + "/" + inspObj.getInspectionDate().getYear();
var inspType = inspObj.getInspectionType();
var customID = capId.getCustomID();
var reportParams = aa.util.newHashMap();
addParameter(reportParams,"departmentID",customID);
addParameter(reportParams, "inspectionDate",inspDate);
addParameter(reportParams, "inspectionType",inspType);
addParameter(reportParams, "debug","N");

// support for new 5001 inspection report with only inspection id parameter
addParameter(reportParams,"g6ActNum",inspId.toString());

// generate report
var myResult = runReportAttach(capId,"5001 Inspection Report",reportParams);

// End generate and attach the 5001 Inspection Report to the inspected record

