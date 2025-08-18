const Car = require("../models/car.schema");
const User = require("../models/user.schema");

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
    // Create new car
    const newCar = new Car({
      make,
      model,
      year,
      price,
      description,
      color,
      brand,
    });
    await newCar.save();

    return res.status(201).json({ message: "Car Added Successfully" });
  } catch (error) {
    console.error("Error adding car:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Edit A Car
const editCar = async (req, res) => {
  const { carId } = req.params;
  const id = req.user.id;
  const { make, model, year, price, description, color, brand } = req.body;
  try {
    const user = await User.findById(id);
    if (user.isAdmin !== true) {
      return res.status(403).json({ message: "Only admins can add cars" });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    // Update car details
    car.make = make || car.make;
    car.model = model || car.model;
    car.year = year || car.year;
    car.price = price || car.price;
    car.description = description || car.description;
    car.color = color || car.color;
    car.brand = brand || car.brand;
    await car.save();
    return res.status(200).json({ message: "Car Updated Successfully" });
  } catch (error) {
    console.error("Error updating car:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete A Car
const deleteCar = async (req, res) => {
  const { carId } = req.params;
  const id = req.user.id;

  try {
    const user = await User.findById(id);
    if (user.isAdmin !== true) {
      return res.status(403).json({ message: "Only admins can add cars" });
    }
    const car = await Car.findByIdAndDelete(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
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

// Search Cars By make
const searchCars = async (req, res) => {
  const { make } = req.query;
  try {
    const car = await Car.find({ make: make });
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    return res.status(200).json({ car });
  } catch (err) {
    console.error("Error searching cars:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addCar,
  editCar,
  deleteCar,
  getAllCars,
  searchCars,
};
