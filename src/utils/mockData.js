// Mock data for testing when MongoDB is not available
const mockUsers = [
    {
        _id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2a$10$mocked.hash', // bcrypt hash placeholder
        isVerified: true,
        profilePicture: null
    }
];

const mockCars = [
    {
        _id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 25000,
        brand: 'Toyota',
        color: 'Silver',
        description: 'Reliable and fuel-efficient sedan perfect for business trips',
        isAvailable: true,
        status: 'not-rented',
        image: null
    },
    {
        _id: '2',
        make: 'Honda',
        model: 'CR-V',
        year: 2023,
        price: 35000,
        brand: 'Honda',
        color: 'Black',
        description: 'Spacious SUV ideal for family trips and adventures',
        isAvailable: true,
        status: 'not-rented',
        image: null
    },
    {
        _id: '3',
        make: 'BMW',
        model: 'X5',
        year: 2023,
        price: 65000,
        brand: 'BMW',
        color: 'White',
        description: 'Luxury SUV with premium features and comfort',
        isAvailable: true,
        status: 'not-rented',
        image: null
    },
    {
        _id: '4',
        make: 'Mercedes',
        model: 'C-Class',
        year: 2022,
        price: 55000,
        brand: 'Mercedes-Benz',
        color: 'Blue',
        description: 'Elegant sedan with advanced technology and style',
        isAvailable: false,
        status: 'approved',
        rentedBy: '1',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-22'),
        totalPrice: 385000
    }
];

const mockNotifications = [
    {
        _id: '1',
        userId: '1',
        type: 'rental_approved',
        title: 'Rental Approved!',
        message: 'Your rental request for Mercedes C-Class has been approved. Enjoy your ride!',
        isRead: false,
        relatedCarId: '4',
        createdAt: new Date('2024-01-15T10:00:00Z')
    },
    {
        _id: '2',
        userId: '1',
        type: 'rental_pending',
        title: 'Rental Request Submitted',
        message: 'Your rental request for Mercedes C-Class is pending payment verification.',
        isRead: true,
        relatedCarId: '4',
        createdAt: new Date('2024-01-15T09:30:00Z')
    }
];

module.exports = {
    mockUsers,
    mockCars,
    mockNotifications
};