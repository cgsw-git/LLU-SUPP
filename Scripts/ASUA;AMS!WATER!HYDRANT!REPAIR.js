disableTokens = true;
holdCapId = capId;
parentArray = getParents("*/*/*/*");
if(appStatus == "Complete"){
if (parentArray && parentArray.length > 0) {
for (thisParent in parentArray)
if (parentArray[thisParent])
{
capId = parentArray[thisParent];
closeTask("Work Order","Work Complete","","");
capId = holdCapId;
}
}
}
disableTokens = false;