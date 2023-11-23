const express = require('express');
const cors = require('cors');
require('dotenv').config();

const applyMiddleware = (app) => {
    app.use(cors());
    app.use(express.json());
};

module.exports = applyMiddleware;
