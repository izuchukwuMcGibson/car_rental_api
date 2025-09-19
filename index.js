const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const userRouter = require('./src/routes/user.routes');
const carRouter = require('./src/routes/cars.routes');
const cors = require('cors')
dotenv.config();
const app = express();

app.use(express.json())
app.use(morgan('dev'))
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://car-rental-frontend-xi-nine.vercel.app'],
    credentials: true
}));
const PORT = process.env.PORT || 4500;

app.get('/', (req, res)=> {
    res.send('Welcome To My Home Page')
})

app.use('/api/users', userRouter);
app.use('/api/cars', carRouter);


app.listen(PORT, ()=> {
    connectDB()
    console.log(`Server is running on http://localhost:${PORT}`)
})

