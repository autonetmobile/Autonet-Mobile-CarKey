describe("Unit", function() {
  
  beforeEach(function() {
    UnitStorage.storeUnits(undefined);
  });
  
  it ("should be able to parse a unit", function() {
    var string = "1,My S2K,Honda/S2000/2006/themename";
    var unit = Unit.parse(string);
    expect(unit.attr('unitID')).toEqual("1");
    expect(unit.attr('nickname')).toEqual("My S2K");
    expect(unit.attr('make')).toEqual("Honda");
    expect(unit.attr('model')).toEqual("S2000");
    expect(unit.attr('year')).toEqual("2006");
    expect(unit.attr('theme')).toEqual("themename");
  });
  
  it ("should match up the saved password to a unit I just loaded", function() {
    var unit = Unit.parse("1,My S2K,Honda/S2000/2006/themename");
    expect(unit.attr('password')).toEqual(undefined);
    unit.attr('password') = "password";
    UnitStorage.storeUnits([unit]);
    var unit = Unit.parse("1,New Nickname,Acura/NSX/2002/default");
    expect(unit.attr('password')).toEqual("password");
    expect(unit.attr('nickname')).toEqual("New Nickname");
  });
  
  it ("should persist units", function() {
    var unit1 = Unit.parse("1,My S2K,Honda/S2000/2006/themename");
    var unit2 = Unit.parse("2,My Hyundai,Hyundai/Sonata/2008/default");
    UnitStorage.storeUnits([unit1,unit2]);
    var retrievedUnits = UnitStorage.retrieveUnits();
    expect(retrievedUnits[0]).toEqual(unit1);
    expect(retrievedUnits[1]).toEqual(unit2);
  });
  
  it ("should store which units are controlled", function() {
     UnitStorage.setControlledUnitIDs(["1", "2"]);
     var unitIDs = UnitStorage.controlledUnits();
     expect(unitIDs).toEqual(["1", "2"]);
  });
  
  it ("should know which units are controlled", function() {
    
  });
});