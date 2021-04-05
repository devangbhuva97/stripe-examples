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

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent
}