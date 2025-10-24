// models/booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    address: String,
    phone: String,
    vehicleNumber: String,
    service: String,
    date: String,
    time: String,
    status: {
        type: String,
        default: "Pending" // Pending → In Progress → Completed
    },
    deliveryDate: {
        type: String,
        default: ""
    },
    kilometers: {
        type: Number,
        default: 0 // starts as 0
    },
    amount: {
        type: Number,
        default: 0 // starts as 0
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
