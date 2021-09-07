require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const setupIntent = async (req, res) => {
  try {
    const intent = await stripe.setupIntents.create({ ...req.body }, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });
    return res.json(intent);
  } catch (error) {
    console.log({ ...error, errorStack: error.stack });
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const createPaymentIntent = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      ...req.body,
      amount: 1099,
      currency: 'usd'
    }, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });
    return res.json(paymentIntent);
  } catch (error) {
    console.log({ ...error, errorStack: error.stack });
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const confirmPaymentIntent = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(req.body.id, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });
    return res.json(paymentIntent);
  } catch (error) {
    console.log(error.message);
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const createCustomer = async (req, res) => {
  try {
    const customer = await stripe.customers.create({ description: 'My First Test Customer from stripe examples' }, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });
    return res.json(customer);
  } catch (error) {
    console.log({ ...error, errorStack: error.stack });
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const updatePaymentIntent = async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const paymentIntent = await stripe.paymentIntents.update(id, rest, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });
    return res.json(paymentIntent);
  } catch (error) {
    console.log({ ...error, errorStack: error.stack });
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

module.exports = {
  setupIntent,
  createPaymentIntent,
  confirmPaymentIntent,
  createCustomer,
  updatePaymentIntent,
}