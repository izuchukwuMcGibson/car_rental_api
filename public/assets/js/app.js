// Global variables
let currentUser = null;
let allCars = [];
let userRentals = [];
let notifications = [];
let dashboardData = {};

// API Base URL
const API_BASE = '/api';

// DOM Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const dashboard = document.getElementById('dashboard');
const carRentalModal = document.getElementById('carRentalModal');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // User is logged in, show dashboard
        showDashboard();
        loadDashboardData();
    } else {
        // User is not logged in, show login modal
        showLoginModal();
    }
}

function setupEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Auth modal switches
    document.getElementById('showSignup').addEventListener('click', function(e) {
        e.preventDefault();
        loginModal.style.display = 'none';
        signupModal.style.display = 'block';
    });

    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        signupModal.style.display = 'none';
        loginModal.style.display = 'block';
    });

    // Sidebar navigation
    document.querySelectorAll('.menu-item:not(.logout)').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) {
                navigateToPage(page);
            }
        });
    });

    // Logout
    document.querySelector('.menu-item.logout').addEventListener('click', handleLogout);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));

    // Notification actions
    document.getElementById('markAllReadBtn').addEventListener('click', markAllNotificationsAsRead);

    // Car rental form
    document.getElementById('startDate').addEventListener('change', calculateRentalPrice);
    document.getElementById('endDate').addEventListener('change', calculateRentalPrice);
    document.getElementById('confirmRentalBtn').addEventListener('click', confirmRental);
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            loginModal.style.display = 'none';
            showDashboard();
            loadDashboardData();
            showSuccess('Login successful!');
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${API_BASE}/users/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Account created successfully! Please check your email to verify your account.');
            signupModal.style.display = 'none';
            loginModal.style.display = 'block';
        } else {
            showError(data.message || 'Signup failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    dashboard.style.display = 'none';
    showLoginModal();
    currentUser = null;
}

// Dashboard functions
function showDashboard() {
    dashboard.style.display = 'flex';
    loginModal.style.display = 'none';
    signupModal.style.display = 'none';
}

function showLoginModal() {
    loginModal.style.display = 'block';
    dashboard.style.display = 'none';
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/dashboard/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            dashboardData = await response.json();
            currentUser = dashboardData.user;
            updateDashboardUI();
            loadAvailableCars();
            loadUserRentals();
            loadNotifications();
        } else {
            handleAuthError();
        }
    } catch (error) {
        showError('Failed to load dashboard data');
    }
}

function updateDashboardUI() {
    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('welcomeUserName').textContent = currentUser.name;
    
    if (currentUser.profilePicture) {
        document.getElementById('userAvatar').src = currentUser.profilePicture;
    }

    // Update stats
    document.getElementById('availableCarsCount').textContent = dashboardData.stats.availableCarsCount;
    document.getElementById('activeRentalsCount').textContent = dashboardData.stats.activeRentals;
    document.getElementById('completedRentalsCount').textContent = dashboardData.stats.completedRentals;
    document.getElementById('totalNotificationsCount').textContent = dashboardData.notifications.length;

    // Update notification badge
    const unreadNotifications = dashboardData.notifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('notificationBadge');
    if (unreadNotifications > 0) {
        badge.textContent = unreadNotifications;
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }

    // Load recent activity
    loadRecentActivity();
}

function loadRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    const activities = [];

    // Get recent rentals
    dashboardData.userRentals.slice(0, 3).forEach(rental => {
        activities.push({
            title: `Rental: ${rental.make} ${rental.model}`,
            description: `Status: ${rental.status}`,
            time: new Date(rental.updatedAt).toLocaleDateString(),
            type: 'rental'
        });
    });

    // Get recent notifications
    dashboardData.notifications.slice(0, 2).forEach(notification => {
        activities.push({
            title: notification.title,
            description: notification.message,
            time: new Date(notification.createdAt).toLocaleDateString(),
            type: 'notification'
        });
    });

    // Sort by time and take first 5
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 5);

    recentActivity.innerHTML = recentActivities.length > 0 
        ? recentActivities.map(activity => `
            <div class="activity-item">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `).join('')
        : '<p>No recent activity</p>';
}

// Navigation
function navigateToPage(pageName) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Show corresponding page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}Page`).classList.add('active');

    // Load page-specific data
    switch(pageName) {
        case 'available-cars':
            loadAvailableCars();
            break;
        case 'my-rentals':
            loadUserRentals();
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

// Cars functionality
async function loadAvailableCars() {
    try {
        const response = await fetch(`${API_BASE}/cars/get-cars`);
        if (response.ok) {
            const data = await response.json();
            allCars = data.cars.filter(car => car.isAvailable && car.status === 'not-rented');
            displayCars(allCars);
            populateFilters();
        }
    } catch (error) {
        showError('Failed to load available cars');
    }
}

function displayCars(cars) {
    const carsList = document.getElementById('availableCarsList');
    
    if (cars.length === 0) {
        carsList.innerHTML = '<p class="loading">No cars available</p>';
        return;
    }

    carsList.innerHTML = cars.map(car => `
        <div class="car-card">
            <div class="car-image">
                <i class="fas fa-car"></i>
            </div>
            <div class="car-info">
                <h3>${car.make} ${car.model} (${car.year})</h3>
                <p>${car.description || 'No description available'}</p>
                <p><strong>Brand:</strong> ${car.brand || 'N/A'}</p>
                <p><strong>Color:</strong> ${car.color || 'N/A'}</p>
                <div class="car-price">₦${car.price.toLocaleString()}/day</div>
                <button class="btn btn-primary" onclick="openRentalModal('${car._id}')">
                    Rent Now
                </button>
            </div>
        </div>
    `).join('');
}

function populateFilters() {
    const makeFilter = document.getElementById('makeFilter');
    const makes = [...new Set(allCars.map(car => car.make))];
    
    makeFilter.innerHTML = '<option value="">All Makes</option>' + 
        makes.map(make => `<option value="${make}">${make}</option>`).join('');

    // Add filter event listeners
    makeFilter.addEventListener('change', applyFilters);
    document.getElementById('priceFilter').addEventListener('change', applyFilters);
}

function applyFilters() {
    const makeFilter = document.getElementById('makeFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    let filteredCars = allCars;

    if (makeFilter) {
        filteredCars = filteredCars.filter(car => car.make === makeFilter);
    }

    if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(p => p === '+' ? Infinity : parseInt(p.replace('+', '')) * 1000);
        filteredCars = filteredCars.filter(car => {
            if (max === undefined) return car.price >= min;
            return car.price >= min && car.price <= max;
        });
    }

    displayCars(filteredCars);
}

// Car rental functionality
function openRentalModal(carId) {
    const car = allCars.find(c => c._id === carId);
    if (!car) return;

    document.getElementById('pricePerDay').textContent = car.price.toLocaleString();
    carRentalModal.dataset.carId = carId;
    carRentalModal.dataset.pricePerDay = car.price;
    carRentalModal.style.display = 'block';

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
}

function calculateRentalPrice() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const pricePerDay = parseFloat(carRentalModal.dataset.pricePerDay);

    if (startDate && endDate && new Date(endDate) > new Date(startDate)) {
        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const totalPrice = days * pricePerDay;

        document.getElementById('totalDays').textContent = days;
        document.getElementById('totalPrice').textContent = totalPrice.toLocaleString();
    }
}

async function confirmRental() {
    const carId = carRentalModal.dataset.carId;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const totalPrice = parseFloat(document.getElementById('totalPrice').textContent.replace(/,/g, ''));

    if (!startDate || !endDate || !totalPrice) {
        showError('Please fill in all rental details');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/cars/rent-car/${carId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                startDate,
                endDate,
                totalPrice
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Rental request submitted successfully!');
            carRentalModal.style.display = 'none';
            loadDashboardData(); // Refresh data
            navigateToPage('my-rentals');
        } else {
            showError(data.message || 'Rental request failed');
        }
    } catch (error) {
        showError('Failed to submit rental request');
    }
}

// Rentals functionality
async function loadUserRentals() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/dashboard/rentals`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userRentals = data.rentals;
            displayUserRentals();
        }
    } catch (error) {
        showError('Failed to load user rentals');
    }
}

function displayUserRentals() {
    const rentalsList = document.getElementById('myRentalsList');
    
    if (userRentals.length === 0) {
        rentalsList.innerHTML = '<p class="loading">No rentals found</p>';
        return;
    }

    rentalsList.innerHTML = userRentals.map(rental => `
        <div class="rental-card">
            <div class="car-image">
                <i class="fas fa-car"></i>
            </div>
            <div class="rental-info">
                <h3>${rental.make} ${rental.model} (${rental.year})</h3>
                <p><strong>Rental Period:</strong> ${new Date(rental.startDate).toLocaleDateString()} - ${new Date(rental.endDate).toLocaleDateString()}</p>
                <p><strong>Total Price:</strong> ₦${rental.totalPrice?.toLocaleString() || 'N/A'}</p>
                <p><strong>Booked:</strong> ${new Date(rental.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="rental-status status-${rental.status}">
                ${rental.status}
            </div>
        </div>
    `).join('');
}

// Notifications functionality
async function loadNotifications() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/dashboard/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            notifications = data.notifications;
            displayNotifications();
        }
    } catch (error) {
        showError('Failed to load notifications');
    }
}

function displayNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="loading">No notifications</p>';
        return;
    }

    notificationsList.innerHTML = notifications.map(notification => `
        <div class="notification-item ${!notification.isRead ? 'unread' : ''}" data-id="${notification._id}">
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
            <span class="notification-time">${new Date(notification.createdAt).toLocaleDateString()}</span>
            ${!notification.isRead ? `<button class="btn btn-secondary" onclick="markNotificationAsRead('${notification._id}')">Mark as Read</button>` : ''}
        </div>
    `).join('');
}

async function markNotificationAsRead(notificationId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/dashboard/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadNotifications();
            updateNotificationBadge();
        }
    } catch (error) {
        showError('Failed to mark notification as read');
    }
}

async function markAllNotificationsAsRead() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/dashboard/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadNotifications();
            updateNotificationBadge();
            showSuccess('All notifications marked as read');
        }
    } catch (error) {
        showError('Failed to mark all notifications as read');
    }
}

function updateNotificationBadge() {
    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('notificationBadge');
    if (unreadNotifications > 0) {
        badge.textContent = unreadNotifications;
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

// Search functionality
async function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    
    if (searchTerm.length === 0) {
        displayCars(allCars);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/dashboard/search?search=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
            const data = await response.json();
            displayCars(data.cars);
        }
    } catch (error) {
        showError('Search failed');
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

function handleAuthError() {
    localStorage.removeItem('authToken');
    showLoginModal();
    showError('Session expired. Please login again.');
}