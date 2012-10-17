describe("Unit", function() {
  it ("Store and load user credentials", function() {
    var credentials = new UserCredentials({"email": "email", "password": "password", "phoneNumber": "phoneNumber", "providerServer": "providerServer"});
    credentials.save();
    
    var creds = UserCredentials.first();
    expect(creds.attr('email')).toEqual("email");
    expect(creds.attr('password')).toEqual("password");
    expect(creds.attr('phoneNumber')).toEqual("phoneNumber");
    expect(creds.attr('providerServer')).toEqual("providerServer");
    
    credentials.destroy();
  });
});