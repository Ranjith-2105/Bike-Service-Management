const express = require('express');
const router = express.Router();
const Booking = require('./models/booking.js');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "api",
    pass: "55f4ca3cee0df03e582b7984f88b2a6c",
  },
});

router.post('/book-service', async (req, res) => {
  const { name, email, phone, address, vehicleNumber, serviceType, date, time } = req.body;

  try {
    const newBooking = new Booking({ name, email, phone, address, vehicleNumber, serviceType, date, time });
    await newBooking.save();
    console.log(email)
    const mailOptions = {
      from: 'rathnajewellery@gmail.com',
      to: email,
      subject: 'Service Booking Confirmation',
      text: `Hello ${name},\n\nYour service booking has been confirmed.\n\nDetails:\nService Type: ${serviceType}\nDate: ${date}\nTime: ${time}\n\nThank you for choosing our service!`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Service booked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
});

module.exports = router;
