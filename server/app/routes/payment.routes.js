require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

let mongoose = require('mongoose'),
request = require('request'),
  express = require('express'),
  router = express.Router();
const stripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    res.status(500).send({ error: stripeErr })
    console.log(stripeErr)
  } else {
    res.status(200).send({ success: stripeRes })
  }
}


    router.route('/').get((req, res) => {
    res.send({ message: 'Stripe Checkout server!', timestamp: new Date().toISOString })
    });

    router.route('/').post((req, res) => {
    stripe.charges.create(req.body, stripeCharge(res))
  });


module.exports = router;