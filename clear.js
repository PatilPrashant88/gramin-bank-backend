const mongoose = require('mongoose');
const User = require('./models/User'); // adjust path as needed
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('Connected to MongoDB');
    await User.deleteMany({});
    console.log('All users deleted');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
    mongoose.connection.close();
  });
