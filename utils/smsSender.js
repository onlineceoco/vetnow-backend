const soap = require("soap");

async function smsSender(phone, msg) {
  var url = "https://www.payam-resan.com/ws/v2/ws.asmx?WSDL";
  var args = {
    Username: process.env.SMS_USERNAME,
    PassWord: process.env.SMS_PASSWORD,
    SenderNumber: process.env.SMS_NUMBER,
    RecipientNumbers: [{ string: phone }],
    MessageBodie: `VetNow\nCode: ${msg}`,
    Type: 1,
    AllowedDelay: 0,
  };

  soap.createClient(url, function (err, client) {
    client.SendMessage(args, function (err, result) {
      if (err) {
        smsSender();
      }
    });
  });
}

module.exports = smsSender;
