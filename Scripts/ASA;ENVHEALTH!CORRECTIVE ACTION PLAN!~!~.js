parentCapId = getParentByCapId(capId);

//loop through the childASIT rows and update the parent ASIT with new entries
// aa.print("childASIT.length = " + childASIT.length)

tableName = "CAP";
var updateRowsMap = aa.util.newHashMap(); // Map<rowID, Map<columnName, columnValue>>

var myResult = aa.appSpecificTableScript.getAppSpecificTableModel(capId, tableName);
if (myResult.getSuccess()) 
{
  childAppSpecificTableScriptModel = myResult.getOutput();
  childAppSpecificTableModel = childAppSpecificTableScriptModel.getAppSpecificTableModel();
  var childASIT = childAppSpecificTableModel.getTableFields(); // List<BaseField>
  if (childASIT != null && childASIT.size() > 0)
  {
    var myResult = aa.appSpecificTableScript.getAppSpecificTableModel(parentCapId, tableName);
    if (myResult.getSuccess()) 
    {
      parentAppSpecificTableScriptModel = myResult.getOutput();
      parentAppSpecificTableModel = parentAppSpecificTableScriptModel.getAppSpecificTableModel();
      var parentASIT = parentAppSpecificTableModel.getTableFields(); // List<BaseField>
      if (parentASIT != null && parentASIT.size() > 0)
      {
        // var fieldsToUpdate = "Corrective Action, Responsible Party, Actual/Planned Correction Date";
        var childFieldObject = childASIT.get(0);
        var rowTracker = childFieldObject.getRowIndex();
        var addTask = false;
        var inspectorsWithTasks = [];
        var rowsWithChanges = [];
        for (var i=0; i < childASIT.size(); i++) // child and parent tables should be exactly the same so only one row counter is needed
        {
          var childFieldObject = childASIT.get(i); // BaseField
          //get the column name.
          var childColumnName = childFieldObject.getFieldLabel();
          //get the value of column
          var childColumnValue = childFieldObject.getInputValue();
          //get the row ID 
          var childRowID = childFieldObject.getRowIndex();

          var parentFieldObject = parentASIT.get(i); // BaseField
          //get the column name.
          var parentColumnName = parentFieldObject.getFieldLabel();
          //get the value of column
          var parentColumnValue = parentFieldObject.getInputValue();
          // get the row ID 
          var parentRowID = parentFieldObject.getRowIndex();
          
          if (childColumnName == "Inspector ID" ) { var inspectorId = childColumnValue;}

          if (childColumnValue != "" && childColumnValue != null && parentColumnName == childColumnName && childColumnValue != parentColumnValue /*&& childRowID == parentRowID */ )
          {
            if ( childColumnName == "Corrective Action" || childColumnName == "Responsible Party" || childColumnName == "Actual/Planned Correction Date" ) {
              aa.print("Child value and row: " + childColumnName + ": " + childColumnValue + "   RowID: " + childRowID);
              aa.print("Parent value and row: " + parentColumnName + ": " + parentColumnValue + "   RowID: " + parentRowID);
              setUpdateColumnValue(updateRowsMap, childRowID, childColumnName, childColumnValue);
              rowsWithChanges.push(childRowID);
            }
          }
        }
        //end comparison loop
        //update all changes at one time
        myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
        if (myResult.getSuccess()) {
          aa.print("Success");
        }else{
          aa.print(myResult.getErrorMessage());
        }
        
        //create ad hoc tasks for the inspectors and set the cap status
        updateRowsMap = aa.util.newHashMap();
        for (var i=0; i < childASIT.size(); i++)
        {
          var childFieldObject = childASIT.get(i); // BaseField
          //get the column name.
          var childColumnName = childFieldObject.getFieldLabel();
          //get the value of column
          var childColumnValue = childFieldObject.getInputValue();
          //get the row ID 
          var childRowID = childFieldObject.getRowIndex();
          
          if (childColumnName == "Inspector ID" && arraySearch(rowsWithChanges,childRowID) && !arraySearch(inspectorsWithTasks, childColumnValue)) {
            inspectorsWithTasks.push(childColumnValue);
            logDebug("Adding a task for " + childColumnValue);
            addAdHocTask("ADHOC_WORKFLOW", "Review CAP", null,childColumnValue,parentCapId);
          }
          if (childColumnName == "CAP Status" && arraySearch(rowsWithChanges,childRowID)) {
            setUpdateColumnValue(updateRowsMap, childRowID, childColumnName, "Pending");
          }
        }
        myResult = updateAppSpecificTableInfors(tableName, parentCapId, updateRowsMap);
        aa.print(myResult);
        if (myResult.getSuccess()) {
          aa.print("Success");
        }else{
          aa.print(myResult.getErrorMessage());
        }
      }
    }
  }
}

function arraySearch(arr,val) {
  for (var i=0; i<arr.length; i++) {
    if (arr[i] == val) return true;
  }
  return false;
}
