const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async() => {
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.em2vhup.mongodb.net/?retryWrites=true&w=majority`; 

    console.log('Connecting to database...');
    await mongoose.connect(uri)
    console.log('Connected to database.');
}

module.exports = connectDB;
