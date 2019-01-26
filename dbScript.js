db.createUser({
  user:"admin",
  pwd:"openSesame",
  roles:["readWrite","dbAdmin"]
});
db.createCollection('employees');
db.employees.insert({
  firstName:"Felipe",
  lastName:"Rodriquez"
});
db.employees.insert({
  firstName:"Dragan",
  lastName:"Plzavik"
});
db.employees.insert({
  firstName:"Bob",
  lastName:"Balk"
});
db.createCollection('buildings');
db.buildings.insert({
  buildingName:"McClurg Court",
  address:"333 E Ontario St, Chicago, IL 60611",
  numRooms:500
});
db.buildings.insert({
  buildingName:"Wacker Place",
  address:"333 Wacker St, Chicago, IL 60611",
  type:"residential",
  numRooms:500
});
