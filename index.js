const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const userRouter = require('./src/routes/user.routes');
const carRouter = require('./src/routes/cars.routes');
const dashboardRouter = require('./src/routes/dashboard.routes');
const cors = require('cors')
const path = require('path');
dotenv.config();
const app = express();

app.use(express.json())
app.use(morgan('dev'))
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 4500;

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.use('/api/users', userRouter);
app.use('/api/cars', carRouter);
app.use('/api/dashboard', dashboardRouter);


app.listen(PORT, ()=> {
    connectDB()
    console.log(`Server is running on http://localhost:${PORT}`)
})

