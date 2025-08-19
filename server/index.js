const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userModel = require('./models/user.js');
const bookingModel = require('./models/booking.js');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Clean MongoDB connection (no deprecated options)
mongoose.connect('mongodb://localhost:27017/bike');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// ✅ Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User Not Found', message: 'No user found with the provided email.' });
        }

        if (user.email === 'admin@gmail.com') {
            if (password === 'Admin-01') {
                return res.json("Login Admin");
            } else {
                return res.status(401).json({ error: 'Incorrect Password', message: 'Incorrect password for admin account.' });
            }
        }

        if (user.password === password) {
            return res.json("Login successful");
        } else {
            return res.status(401).json({ error: 'Incorrect Password', message: 'Incorrect password. Please try again.' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Server Error', message: 'An error occurred during login.' });
    }
});

// ✅ Registration route
app.post('/register', async (req, res) => {
    try {
        const existingUser = await userModel.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists", message: "Account already exists with this email." });
        }

        const newUser = await userModel.create(req.body);
        res.json(newUser);
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Book service route
app.post('/book-service', async (req, res) => {
    const { name, email, address, phone, vehicleNumber, serviceType, date, time } = req.body;

    try {
        const existingBooking = await bookingModel.findOne({ date, time });
        if (existingBooking) {
            return res.status(400).json({ error: "Date and time already booked", message: "Please choose another slot." });
        }

        const newBooking = await bookingModel.create({
            name,
            email,
            address,
            phone,
            vehicleNumber,
            service: serviceType,
            date,
            time
        });

        console.log('Booking created:', newBooking);
        res.status(201).json({ message: "Service booked successfully" });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Admin - Get all bookings
app.get('/admin', async (req, res) => {
    try {
        const bookings = await bookingModel.find();
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Admin - Delete booking
app.delete('/admin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBooking = await bookingModel.findByIdAndDelete(id);
        if (!deletedBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Get bookings by user email
app.get('/user-bookings/:email', async (req, res) => {
    try {
        const bookings = await bookingModel.find({ email: req.params.email });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
