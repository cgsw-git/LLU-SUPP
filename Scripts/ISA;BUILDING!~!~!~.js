latestScheduledDate = getLatestScheduledDate();
expirationdate = aa.util.dateDiff(latestScheduledDate, "DAY", 180);
newdate = aa.util.formatDate(expirationdate, "MM/dd/YYYY");
useAppSpecificGroupName = true;
editAppSpecific("PERMIT DATES.Permit Expiration Date", newdate);