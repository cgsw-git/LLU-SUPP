// Generate and attach the 5001 Inspection Report to the inspected record

// support for new 5001 inspection report with only inspection id parameter

addParameter(reportParams,"g6ActNum",inspId);
var myResult = runReportAttach(capId,"5001 Inspection Report",reportParams);

// End generate and attach the 5001 Inspection Report to the inspected record

