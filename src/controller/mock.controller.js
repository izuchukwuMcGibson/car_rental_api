const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { mockUsers, mockCars, mockNotifications } = require('../utils/mockData');

// Mock user authentication
const mockLogin = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Find user (for demo, we'll accept any email with password "password123")
    const user = mockUsers.find(u => u.email === email) || mockUsers[0];
    
    if (password !== 'password123') {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'demo-secret',
        { expiresIn: '7d' }
    );

    res.status(200).json({
        message: "Login successful",
        token
    });
};

const mockSignup = async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!email || !name || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // For demo, we'll create a success response
    res.status(201).json({ 
        message: "User created successfully. For demo purposes, you can now login with any email and password 'password123'",
        token: jwt.sign({ id: '1', email }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '7d' })
    });
};

// Mock dashboard data
const mockGetDashboardData = async (req, res) => {
    const user = mockUsers[0]; // Use first mock user
    const availableCars = mockCars.filter(car => car.isAvailable && car.status === 'not-rented');
    const userRentals = mockCars.filter(car => car.rentedBy === user._id);
    const notifications = mockNotifications;

    res.status(200).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture
        },
        availableCars,
        userRentals,
        notifications,
        stats: {
            totalRentals: userRentals.length,
            activeRentals: userRentals.filter(r => r.status === 'approved').length,
            completedRentals: userRentals.filter(r => r.status === 'completed').length,
            availableCarsCount: availableCars.length
        }
    });
};

// Mock get all cars
const mockGetAllCars = async (req, res) => {
    res.status(200).json({ cars: mockCars });
};

// Mock user rentals
const mockGetUserRentals = async (req, res) => {
    const userRentals = mockCars.filter(car => car.rentedBy === '1');
    res.status(200).json({ rentals: userRentals });
};

// Mock notifications
const mockGetNotifications = async (req, res) => {
    res.status(200).json({ 
        notifications: mockNotifications,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalNotifications: mockNotifications.length,
            unreadCount: mockNotifications.filter(n => !n.isRead).length
        }
    });
};

// Mock search cars
const mockSearchCars = async (req, res) => {
    const { search } = req.query;
    let filteredCars = mockCars;
    
    if (search) {
        filteredCars = mockCars.filter(car => 
            car.make.toLowerCase().includes(search.toLowerCase()) ||
            car.model.toLowerCase().includes(search.toLowerCase()) ||
            car.brand.toLowerCase().includes(search.toLowerCase()) ||
            (car.description && car.description.toLowerCase().includes(search.toLowerCase()))
        );
    }
    
    res.status(200).json({ cars: filteredCars, totalResults: filteredCars.length });
};

// Mock rent car
const mockRentCar = async (req, res) => {
    const { carId } = req.params;
    
    // For demo, always return success
    res.status(200).json({ 
        message: "Car rented successfully! In a real application, this would process payment through Flutterwave." 
    });
};

// Mock mark notification as read
const mockMarkNotificationAsRead = async (req, res) => {
    res.status(200).json({ message: "Notification marked as read" });
};

// Mock mark all notifications as read
const mockMarkAllNotificationsAsRead = async (req, res) => {
    res.status(200).json({ message: "All notifications marked as read" });
};

module.exports = {
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
};