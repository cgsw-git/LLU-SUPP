showDebug = 1;
tContact = contactArray[iCont];
aa.print("ContactName: " + tContact["firstName"] + " " + tContact["lastName"] + " " + tContact["contactType"]);
contactSetRelation(tContact["contactSeqNumber"], tContact["contactType"]);