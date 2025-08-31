const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userModel = require('./models/user.js');
const bookingModel = require('./models/booking.js');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const uri = 'mongodb://localhost:27017/bike';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('✅ MongoDB connected'));

// ================= AUTH ROUTES =================

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (email === 'admin@gmail.com') {
            if (password === 'Admin-01') return res.json('Login Admin');
            return res.status(401).json({ error: 'Incorrect admin password' });
        }

        if (user.password === password) return res.json('Login successful');
        return res.status(401).json({ error: 'Incorrect password' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register
app.post('/register', async (req, res) => {
    try {
        const existingUser = await userModel.findOne({ email: req.body.email });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const newUser = await userModel.create(req.body);
        res.json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= BOOKING ROUTES =================

// Book service
app.post('/book-service', async (req, res) => {
    const { name, email, address, phone, vehicleNumber, serviceType, date, time } = req.body;
    try {
        const existingBooking = await bookingModel.findOne({ date, time });
        if (existingBooking) return res.status(400).json({ error: 'Date and time already booked' });

        const newBooking = await bookingModel.create({
            name,
            email,
            address,
            phone,
            vehicleNumber,
            service: serviceType,
            date,
            time,
            status: 'Pending',
            deliveryDate: null,
            kilometers: 0
        });

        res.status(201).json({ message: 'Service booked successfully', booking: newBooking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all bookings (Admin)
app.get('/admin', async (req, res) => {
    try {
        const bookings = await bookingModel.find();
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update booking (Admin: status, deliveryDate, kilometers)
app.put('/admin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedBooking = await bookingModel.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true }
        );

        if (!updatedBooking) return res.status(404).json({ error: 'Booking not found' });

        res.json({ message: 'Booking updated successfully', booking: updatedBooking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete booking
app.delete('/admin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBooking = await bookingModel.findByIdAndDelete(id);
        if (!deletedBooking) return res.status(404).json({ error: 'Booking not found' });

        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get bookings for specific user
app.get('/user-bookings/:email', async (req, res) => {
    const userEmail = req.params.email;
    try {
        const bookings = await bookingModel.find({ email: userEmail });
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
