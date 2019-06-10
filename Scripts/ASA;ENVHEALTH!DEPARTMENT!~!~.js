// copy the licensed professionals from the fictitious facility becuase the Observer LP should be the only LP on the record.
// this should be replaced with a more strategic solution in case the source record no longer exists
myResult = aa.cap.getCapID("FA0000868");
sCapId = (myResult) ? myResult.getOutput() : null;
tCapId = capId;
copyLicensedProf(sCapId, tCapId)	