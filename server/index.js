const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { jsPDF } = require('jspdf');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const userModel = require('./models/user.js');
const bookingModel = require('./models/booking.js');

// Email configuration
const mailer = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "api",
    pass: "55f4ca3cee0df03e582b7984f88b2a6c",
  },
});

const mailFrom = 'rathnajewellery@gmail.com';

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas connection
const uri = 'mongodb+srv://iamranjith21_db_user:gQWoWFjmknmAUsBV@bike.y1wfd7b.mongodb.net/?appName=bike';
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
        doc.text('🚴‍♂️ Bike Service Booking Report', 105, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 20, { align: 'center' });
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

// ================= REPORT ROUTE (CSV Download) =================
app.get('/user-report/:email', async (req, res) => {
    const userEmail = req.params.email;
    try {
        const bookings = await bookingModel.find({ email: userEmail }).sort({ date: 1, time: 1 });
        const headers = [
            'Name','Email','Phone','Address','VehicleNumber','Service','Date','Time','Status','DeliveryDate','Kilometers','Amount'
        ];
        const rows = bookings.map(b => [
            b.name || '',
            b.email || '',
            b.phone || '',
            b.address || '',
            b.vehicleNumber || '',
            b.service || '',
            b.date || '',
            b.time || '',
            b.status || '',
            b.deliveryDate || '',
            (b.kilometers ?? 0).toString(),
            (b.amount ?? 0).toString()
        ]);

        const escape = (v) => '"' + String(v).replace(/"/g, '""') + '"';
        const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');

        const filename = `bike_service_report_${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to generate report' });
    }
});

// ================= REPORT ROUTE (PDF - only Accepted) =================
app.get('/user-report-pdf/:email', async (req, res) => {
    const userEmail = req.params.email;
    try {
        const bookings = await bookingModel.find({ email: userEmail, status: 'Accepted' }).sort({ date: 1, time: 1 });

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const filename = `bike_service_report_${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        // Header
        doc
          .font('Helvetica-Bold')
          .fillColor('#0ea5a4')
          .fontSize(22)
          .text('Bike Service - Service History (Accepted)', { align: 'center' })
          .moveDown(0.2)
          .font('Helvetica')
          .fillColor('#374151')
          .fontSize(10)
          .text(`User: ${userEmail}`, { align: 'center' })
          .moveDown(0.8);

        // Table header
        const headers = [
          'Name','Vehicle','Service','Date','Time','Delivery','KM'
        ];

        // Column positions (last column is Amount aligned right)
        const columnX = [40, 150, 260, 350, 410, 470, 530];
        const rightEdge = 570;
        const amountColWidth = rightEdge - columnX[columnX.length - 1] - 6;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827');
        const headerY = doc.y;
        headers.forEach((h, i) => {
          const nextX = columnX[i+1] || (rightEdge - amountColWidth - 6);
          doc.text(h, columnX[i], headerY, { width: nextX - columnX[i] - 6, align: 'left' });
        });
        doc.text('Amount', rightEdge - amountColWidth, headerY, { width: amountColWidth, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke('#e5e7eb');
        doc.moveDown(0.5);

        // Rows
        let totalAmount = 0;
        const rowHeight = 18;
        bookings.forEach((b, idx) => {
          totalAmount += Number(b.amount || 0);
          const y = doc.y;
          // Zebra shading
          if (idx % 2 === 0) {
            doc.save().rect(40, y - 2, 530, rowHeight).fill('#fafafa').restore();
          }
          doc.font('Helvetica').fillColor('#111827').fontSize(10);
          const values = [
            b.name || '',
            b.vehicleNumber || '',
            b.service || '',
            b.date || '',
            b.time || '',
            (b.deliveryDate || ''),
            (b.kilometers ?? 0).toString()
          ];
          values.forEach((v, i) => {
            const nextX = columnX[i+1] || (rightEdge - amountColWidth - 6);
            doc.text(String(v), columnX[i], y, { width: nextX - columnX[i] - 6, align: 'left' });
          });
          const amtText = `Rs.${Number(b.amount ?? 0).toFixed(2)}`;
          doc.text(amtText, rightEdge - amountColWidth, y, { width: amountColWidth, align: 'right' });
          doc.moveTo(40, y + rowHeight - 6).lineTo(570, y + rowHeight - 6).stroke('#f3f4f6');
          doc.y = y + rowHeight;
        });

        // Footer / total
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke('#e5e7eb');
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(`Total Spending (Accepted): Rs.${totalAmount.toFixed(2)}`, rightEdge - 300, doc.y, { width: 300, align: 'right' });
        doc.moveDown(1);
        doc.fontSize(9).fillColor('#6b7280').text('Generated by Bike Service System', { align: 'center' });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to generate PDF report' });
    }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
