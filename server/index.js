const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { jsPDF } = require('jspdf');
const userModel = require('./models/user.js');
const bookingModel = require('./models/booking.js');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas connection (use environment variable in production)
const uri = process.env.MONGODB_URI || 'REPLACE_WITH_YOUR_MONGODB_URI';
mongoose.connect(uri);

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

// Generate PDF for user bookings (Completed only) - jsPDF version
app.get('/user-report-pdf/:email', async (req, res) => {
    const userEmail = req.params.email;
    try {
        // Get only completed bookings
        const bookings = await bookingModel.find({ 
            email: userEmail, 
            status: 'Completed' 
        });

        if (bookings.length === 0) {
            return res.status(404).json({ 
                error: 'No completed bookings found for this user' 
            });
        }

        // Calculate total amount
        const totalAmount = bookings.reduce((sum, booking) => {
            return sum + (Number(booking.amount) || 0);
        }, 0);

        // Create new PDF document
        const doc = new jsPDF();
        
        // Set up colors
        const primaryColor = [16, 185, 129]; // #10B981
        const textColor = [55, 65, 81]; // #374151
        const lightGray = [243, 244, 246]; // #f3f4f6
        
        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(' Bike Service Booking Report', 105, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
        
        // User Information
        let yPosition = 45;
        doc.setTextColor(...textColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('User Information', 20, yPosition);
        
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Email: ${userEmail}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Total Completed Bookings: ${bookings.length}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Total Amount: Rs.${totalAmount.toFixed(2)}`, 20, yPosition);
        
        // Table Header
        yPosition += 15;
        doc.setFillColor(...lightGray);
        doc.rect(20, yPosition - 5, 170, 8, 'F');
        
        doc.setTextColor(...textColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        
        const headers = ['Name', 'Address', 'Phone', 'Vehicle', 'Service', 'Date', 'Time', 'Amount'];
        const colWidths = [25, 30, 20, 20, 20, 15, 15, 15];
        let xPosition = 20;
        
        headers.forEach((header, index) => {
            doc.text(header, xPosition, yPosition);
            xPosition += colWidths[index];
        });
        
        // Table Data
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        
        bookings.forEach((booking, index) => {
            if (yPosition > 250) { // Start new page if needed
                doc.addPage();
                yPosition = 20;
            }
            
            // Alternate row colors
            if (index % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(20, yPosition - 3, 170, 6, 'F');
            }
            
            xPosition = 20;
            const rowData = [
                booking.name || '',
                booking.address || '',
                booking.phone || '',
                booking.vehicleNumber || '',
                booking.service || '',
                booking.date || '',
                booking.time || '',
                `Rs.${booking.amount ? Number(booking.amount).toFixed(2) : '0.00'}`
            ];
            
            rowData.forEach((data, colIndex) => {
                // Truncate long text
                const truncatedData = data.length > 15 ? data.substring(0, 12) + '...' : data;
                doc.text(truncatedData, xPosition, yPosition);
                xPosition += colWidths[colIndex];
            });
            
            yPosition += 6;
        });
        
        // Summary Section
        yPosition += 10;
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFillColor(...lightGray);
        doc.rect(20, yPosition - 5, 170, 20, 'F');
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(' Summary', 25, yPosition + 2);
        
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Bookings: ${bookings.length}`, 25, yPosition + 8);
        doc.text(`Total Amount: Rs.${totalAmount.toFixed(2)}`, 25, yPosition + 14);
        
        // Footer
        yPosition += 25;
        doc.setTextColor(102, 102, 102);
        doc.setFontSize(8);
        doc.text('This report contains only completed bookings', 105, yPosition, { align: 'center' });
        doc.text('Generated by Bike Service Management System', 105, yPosition + 5, { align: 'center' });
        
        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer');
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="user-bookings-${userEmail}-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.byteLength);
        
        res.send(Buffer.from(pdfBuffer));

    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
