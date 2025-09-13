const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors')
const path = require('path');
const jwt = require('jsonwebtoken');

// Mock controllers
const {
    mockLogin,
    mockSignup,
    mockGetDashboardData,
    mockGetAllCars,
    mockGetUserRentals,
    mockGetNotifications,
    mockSearchCars,
    mockRentCar,
    mockMarkNotificationAsRead,
    mockMarkAllNotificationsAsRead
} = require('./src/controller/mock.controller');

dotenv.config();
const app = express();

app.use(express.json())
app.use(morgan('dev'))
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4500;

// Simple auth middleware for mock
const mockAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authentication failed: Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication failed: Token missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Authentication failed: Invalid token' });
    }
};

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

// Mock API routes
app.post('/api/users/login', mockLogin);
app.post('/api/users/signup', mockSignup);

app.get('/api/cars/get-cars', mockGetAllCars);
app.post('/api/cars/rent-car/:carId', mockAuth, mockRentCar);

app.get('/api/dashboard/dashboard', mockAuth, mockGetDashboardData);
app.get('/api/dashboard/rentals', mockAuth, mockGetUserRentals);
app.get('/api/dashboard/notifications', mockAuth, mockGetNotifications);
app.get('/api/dashboard/search', mockSearchCars);
app.put('/api/dashboard/notifications/:notificationId/read', mockAuth, mockMarkNotificationAsRead);
app.put('/api/dashboard/notifications/read-all', mockAuth, mockMarkAllNotificationsAsRead);

app.listen(PORT, ()=> {
    console.log(`Demo server is running on http://localhost:${PORT}`)
    console.log('Note: This is a demo version with mock data (no MongoDB required)')
    console.log('Use any email with password "password123" to login')
})

module.exports = app;