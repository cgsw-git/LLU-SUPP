if(balanceDue <= 0)
{
  if(isTaskActive("Permit Issuance"))
  {
	closeTask("Permit Issuance","Complete","updated via script",null);
  }  
  aa.runScript("EH_PAYMENTRECEIVEAFTER4RENEW"); 
  
}