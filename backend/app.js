const express = require('express');
const bodyParser = require('body-parser');

require('dotenv').config();

const stripe = require('./stripe');

const allowCrossDomain = function(req, res, next) {
  if (res.header) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', '*');
  }
  
  next();
}

const app = express();
app.use(allowCrossDomain);
app.set('trust proxy',true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/health', (_, res) => res.send('OK'));

app.post('/setup-intent', stripe.setupIntent);
app.post('/create-payment-intent', stripe.createPaymentIntent);
app.post('/confirm-payment-intent', stripe.confirmPaymentIntent);
app.post('/create-customer', stripe.createCustomer);
app.post('/update-payment-intent', stripe.updatePaymentIntent);


app.listen({ port: 3000 }, () => {
  console.log(`🚀 Server ready at http://localhost:${3000}`);
});
