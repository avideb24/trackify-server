const express = require('express');
const applyMiddleware = require('./middlewares/applyMiddleware');
const connectDB = require('./db/connectDB');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

applyMiddleware(app);


async function run() {
    try {
        
    } 
    finally {
      
    }
  }
  run().catch(console.dir);


app.get('/health', (req, res)=> {
    res.send('Tech Vibe server is running successfully...!!!')
})

app.all('*', (req, res, next) => {
    const error = new Error(`Url error: [${req.originalUrl}]`)
    error.status = 404
    next(error)
})

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        message: err.message
    })
})

const main = async() => {
    await connectDB();
    app.listen(port, ()=> {
        console.log(`Running port: ${port}`);
    })
}

main();
