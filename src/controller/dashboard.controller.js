const Car = require("../models/car.schema");
const User = require("../models/user.schema");
const Notification = require("../models/notification.schema");

// Get user dashboard data
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get available cars
        const availableCars = await Car.find({ 
            isAvailable: true, 
            status: 'not-rented' 
        });

        // Get user's rentals
        const userRentals = await Car.find({ 
            rentedBy: userId 
        }).populate('rentedBy', 'name email');

        // Get user's notifications (last 10)
        const notifications = await Notification.find({ 
            userId: userId 
        })
        .populate('relatedCarId', 'make model')
        .sort({ createdAt: -1 })
        .limit(10);

        // Get rental statistics
        const totalRentals = userRentals.length;
        const activeRentals = userRentals.filter(rental => 
            rental.status === 'approved' || rental.status === 'pending'
        ).length;
        const completedRentals = userRentals.filter(rental => 
            rental.status === 'completed'
        ).length;

        return res.status(200).json({
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
                totalRentals,
                activeRentals,
                completedRentals,
                availableCarsCount: availableCars.length
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get user's rentals only
const getUserRentals = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRentals = await Car.find({ 
            rentedBy: userId 
        }).populate('rentedBy', 'name email');

        return res.status(200).json({ rentals: userRentals });
    } catch (error) {
        console.error("Error fetching user rentals:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get user's notifications
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        
        const notifications = await Notification.find({ 
            userId: userId 
        })
        .populate('relatedCarId', 'make model')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const totalNotifications = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ 
            userId, 
            isRead: false 
        });

        return res.status(200).json({
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalNotifications / limit),
                totalNotifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            _id: notificationId,
            userId: userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { userId: userId, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Search cars with enhanced filtering
const searchCarsEnhanced = async (req, res) => {
    try {
        const { 
            search, 
            make, 
            model, 
            minPrice, 
            maxPrice, 
            year, 
            available = true 
        } = req.query;

        let query = {};

        // Text search across make, model, and description
        if (search) {
            query.$or = [
                { make: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // Specific filters
        if (make) {
            query.make = { $regex: make, $options: 'i' };
        }
        if (model) {
            query.model = { $regex: model, $options: 'i' };
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (year) {
            query.year = Number(year);
        }
        if (available === 'true') {
            query.isAvailable = true;
            query.status = 'not-rented';
        }

        const cars = await Car.find(query);
        return res.status(200).json({ cars, totalResults: cars.length });
    } catch (error) {
        console.error("Error searching cars:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    getDashboardData,
    getUserRentals,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    searchCarsEnhanced
};