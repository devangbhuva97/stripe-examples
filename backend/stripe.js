const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      ...req.body,
      amount: 1099,
      currency: 'usd'
    });
    return res.json(paymentIntent);
  } catch (error) {
    console.log(error.message);
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const confirmPaymentIntent = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(req.body.id);
    return res.json(paymentIntent);
  } catch (error) {
    console.log(error.message);
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const createCustomer = async (req, res) => {
  try {
    const customer = await stripe.customers.create({ description: 'My First Test Customer from stripe examples' });
    return res.json(customer);
  } catch (error) {
    console.log(error.message);
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const updatePaymentIntent = async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const paymentIntent = await stripe.paymentIntents.update(id, rest);
    return res.json(paymentIntent);
  } catch (error) {
    console.log(error.message);
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  createCustomer,
  updatePaymentIntent,
}