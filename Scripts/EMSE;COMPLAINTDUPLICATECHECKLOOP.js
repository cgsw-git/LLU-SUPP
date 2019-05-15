vApp = null;
vApp = recordArray[iRec];
vCap = aa.cap.getCap(vApp).getOutput();
vAppTypeString = vCap.getCapType().toString();
//vFileDateObj = vCap.getFileDate();
bAppTypeMatch = false;
//bASIMatch = false;
if (appMatch(vAppTypeString) && (vApp.equals(capId) == false)) {
bAppTypeMatch = true;
}