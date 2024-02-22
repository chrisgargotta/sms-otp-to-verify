const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');

//use environment variables
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyId = process.env.TWILIO_VERIFY_SID;

const client = new twilio(accountSid, authToken);

app.use(bodyParser.urlencoded({ extended: false }));

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to initiate the 2FA process using Twilio Verify v2
app.post('/send-code', async (req, res) => {
  const countryCode = req.body.countryCode;
	const phoneNumber = req.body.phoneNumber;

  if (!countryCode || !phoneNumber) {
    return res.status(400).send('Country code and phone number are required.');
  }

  try {
		await client.verify.v2.services(verifyId)
			.verifications
			.create({to: `${countryCode}${phoneNumber}`, channel: 'sms'})
			.then(verification => console.log(verification.sid));

    res.send('Verification code sent successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending verification code.');
  }
});

// Endpoint to verify the provided code
app.post('/verify-code', async (req, res) => {
	const countryCode = req.body.countryCode;
  const phoneNumber = req.body.phoneNumber;
  const verificationCode = req.body.code;

  if (!countryCode || !phoneNumber || !verificationCode) {
    return res.status(400).send('Country code, phone number and verification code are required.');
  }

  try {
    var verifyCheck = await client.verify.v2.services(verifyId)
      .verificationChecks
      .create({to: `${countryCode}${phoneNumber}`, code: verificationCode});
      
    if (verifyCheck.status === 'approved') {
      // Code is valid, you can proceed with further actions
      // (e.g., mark the user as verified in your database)
      res.send('Verification successful!');
    } else {
      res.status(401).send('Invalid verification code.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error verifying code.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});