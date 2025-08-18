const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const userRouter = require('./src/routes/user.routes');
const carRouter = require('./src/routes/cars.routes');

dotenv.config();
const app = express();

app.use(express.json())
app.use(morgan('dev'))
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

