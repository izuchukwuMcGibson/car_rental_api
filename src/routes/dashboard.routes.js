const express = require('express');
const router = express.Router();
const { 
    getDashboardData, 
    getUserRentals, 
    getUserNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    searchCarsEnhanced 
} = require('../controller/dashboard.controller');
const { isAuthenticated } = require('../middlewares/isAuth');

// Dashboard routes
router.get('/dashboard', isAuthenticated, getDashboardData);
router.get('/rentals', isAuthenticated, getUserRentals);
router.get('/notifications', isAuthenticated, getUserNotifications);
router.put('/notifications/:notificationId/read', isAuthenticated, markNotificationAsRead);
router.put('/notifications/read-all', isAuthenticated, markAllNotificationsAsRead);
router.get('/search', searchCarsEnhanced);

module.exports = router;