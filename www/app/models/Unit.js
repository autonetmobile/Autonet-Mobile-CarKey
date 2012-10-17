var Unit = Model("unit", function() {
  this.persistence(Model.localStorage);
  this.extend({
    findByUnitID : function(string) {
      return this.detect(function() {
        return this.attr("unitID") == string
      });
    },
    parse : function(string) {
      AutonetApplication.debugLog("Parse: "+ string);
      var parts = string.split(",")
      var unitID = parts[0];
      var nickname = (parts[1] == undefined ? "" : parts[1].replace(/"(.*)"/, "$1"));
      var make, model, year, theme;
      if (parts[2]) {
        var infoParts = (parts[2] == undefined? "///" : parts[2].replace(/"(.*)"/, "$1").split("/"));
        make = infoParts[0];
        model = infoParts[1];
        year = infoParts[2];
        theme = infoParts[3];
      }
      var unit = Unit.findByUnitID(unitID);
      if (unit == undefined) {
        unit = new Unit({'unitID': unitID})
      } else {
        unit.reset(); // Clear potentially saved passwords.
      }
      unit.attr('nickname', nickname);
      unit.attr('make', make);
      unit.attr('model', model);
      unit.attr('year', year);
      unit.attr('theme', theme);
      
      unit.save();
      return unit;
    },
    controlledUnits : function() {
      return Unit.select(function() {
        return this.attr("controlled") == true;
      }).all();
    },
    firstControlledUnit : function() {
      return Unit.detect(function() {
        return (this.attr("controlled") == true) ;
      });
    }
  });
  this.include({
    getDisplayName : function() {
      var nickname = this.attr('nickname')
      if (nickname && nickname.length > 0) {
        return nickname;
      }
      var vehicle_string = "";
      if (this.attr("year") && this.attr("year").length > 0) {
        vehicle_string += this.attr("year") + " ";
      }
      if (this.attr("make") && this.attr("make").length > 0) {
        vehicle_string += this.attr("make") + " ";
      }
      if (this.attr("model") && this.attr("model").length > 0) {
        vehicle_string += this.attr("model");
      }
      if (vehicle_string.length > 0) {
        return this.attr("unitID") + " " + "(" + vehicle_string + ")";
      }
      return this.attr("unitID");
    },
    getMapDisplayName : function () {
      var nickname = this.attr('nickname');
      var unitID = this.attr("unitID");
      if (nickname && nickname.length > 0) {
        return nickname;
      }
      var vehicle_string = "";
      if (this.attr("year") && this.attr("year").length > 0) {
        vehicle_string += this.attr("year") + " ";
      }
      if (this.attr("make") && this.attr("make").length > 0) {
        vehicle_string += this.attr("make") + " ";
      }
      if (this.attr("model") && this.attr("model").length > 0) {
        vehicle_string += this.attr("model");
      }
      if (vehicle_string.length > 0) {
        return vehicle_string;
      }
      return "Car";
    }
  });
});