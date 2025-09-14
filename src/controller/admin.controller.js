const Car = require("../models/car.schema.js");
const User = require("../models/user.schema.js")
const cloudinary = require( '../config/cloudinary.js');
const multer = require('multer');
require('dotenv').config();

// Configure Multer for handling file uploads (store files in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (_, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPEG, PNG, JPG, and WEBP are allowed.'));
    }
  },
});

// Add a Car
const addCar = async (req, res) => {
  const { make, model, year, price, description, color, brand } = req.body;
  const id = req.user.id;

  // Validate Inputs
  if (!make || !model || !year || !price) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findById(id);
    if (user.isAdmin !== true) {
      return res.status(403).json({ message: "Only admins can add cars" });
    }

    let imageUrl = null;
    let imagePublicId = null;

    // Handle image upload to Cloudinary (no streamifier)
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'car_rental/cars' });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    // Create new car
    const newCar = new Car({
      make,
      model,
      year,
      price,
      description,
      color,
      brand,
      image: imageUrl,
      imagePublicId: imagePublicId,
    });
    await newCar.save();

    return res.status(201).json({ message: "Car Added Successfully", car: newCar });
  } catch (error) {
    console.error("Error adding car:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Edit a Car
const editCar = async (req, res) => {
  const { carId } = req.params;
  const id = req.user.id;
  const { make, model, year, price, description, color, brand } = req.body;

  try {
    const user = await User.findById(id);
    if (user.isAdmin !== true) {
      return res.status(403).json({ message: "Only admins can edit cars" });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    let imageUrl = car.image;
    let imagePublicId = car.imagePublicId;

    // Handle image upload (if a new image is uploaded) - no streamifier
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: 'car_rental/cars' });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    // Update car details
    car.make = make || car.make;
    car.model = model || car.model;
    car.year = year || car.year;
    car.price = price || car.price;
    car.description = description || car.description;
    car.color = color || car.color;
    car.brand = brand || car.brand;
    car.image = imageUrl;
    car.imagePublicId = imagePublicId;

    await car.save();

    return res.status(200).json({ message: "Car Updated Successfully", car });
  } catch (error) {
    console.error("Error updating car:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a Car
const deleteCar = async (req, res) => {
  const { carId } = req.params;
  const id = req.user.id;

  try {
    const user = await User.findById(id);
    if (user.isAdmin !== true) {
      return res.status(403).json({ message: "Only admins can delete cars" });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Delete car image from Cloudinary (optional)
    if (car.imagePublicId) {
      await cloudinary.uploader.destroy(car.imagePublicId);
    } else if (car.image) {
      const publicId = car.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`car_rental/cars/${publicId}`);
    }

    await car.deleteOne();

    return res.status(200).json({ message: "Car Deleted Successfully" });
  } catch (error) {
    console.error("Error deleting car:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get All Cars
const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find();
    return res.status(200).json({ cars });
  } catch (error) {
    console.error("Error fetching cars:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Search Cars By Make
const searchCars = async (req, res) => {
  const { make } = req.query;
  try {
    const cars = await Car.find(make ? { make: { $regex: make, $options: 'i' } } : {});
    return res.status(200).json({ cars });
  } catch (err) {
    console.error("Error searching cars:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  upload, // Export Multer middleware
  addCar,
  editCar,
  deleteCar,
  getAllCars,
  searchCars,
};
