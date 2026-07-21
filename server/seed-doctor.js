const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./app/models/user.model');

mongoose.connect(process.env.ATLAS_URI).then(async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('doctor123', 8);

    const doctor = await User.create({
        username: 'drsuraj',
        firstname: 'Suraj',
        lastname: 'Mmore',
        email: 'suraj@doctor.com',
        password: hash,
        role: 'doctor',
        speciality: 'Neurology',
        phone: '9876543210',
        gender: 'Male',
        status: 'Active',
        about: 'Experienced neurologist with 10 years of practice.',
        confirmationCode: 'drsuraj-' + Date.now()
    });

    console.log('Doctor created:', doctor._id);
    mongoose.disconnect();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
