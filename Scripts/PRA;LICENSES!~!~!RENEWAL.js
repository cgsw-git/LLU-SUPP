if (balanceDue <= 0 && isTaskActive("Renewal Intake")) {
closeTask("Renewal Intake","Fees Paid","updated via script",null);
}