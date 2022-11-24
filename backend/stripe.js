require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CUSTOMER_ID = 'cus_Mm1vz5nYyLBUOV'

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

// https://dashboard.stripe.com/test/products/prod_Masp3fgiulAhqC
const PRODUCTS = [
  {
    id: 'price_1Lrh7cAjORjIkyJ0cKYhIHlc',
    type: 'R',
    amount: 299,
    desc: 'Laptop Monthly Recurring | 14 days free trial',
    trail_period: 14
  },
  {
    id: 'price_1Lrh7PAjORjIkyJ0o5QImlcO',
    type: 'R',
    amount: 249,
    desc: 'Laptop Monthly Recurring',
  },
  {
    id: 'price_1M6txQAjORjIkyJ0Hul7u3Iq',
    type: 'O',
    amount: 1099,
    desc: 'Laptop',
  },
  {
    id: 'price_1M6u03AjORjIkyJ03oDBQ0AY',
    type: 'O',
    amount: 199,
    desc: 'Laptop Charger',
  }
]

const purchaseProducts = async (req, res) => {
  try {
    let { products, payment_method } = req.body;
    let hasExistingPaymentMethod = false;
    const paymentSource = await stripe.paymentMethods.retrieve(payment_method);
  
    if (paymentSource && paymentSource.card) {
      const { exp_month, exp_year, fingerprint } = paymentSource.card;
      const { data } = await stripe.paymentMethods.list({ customer: CUSTOMER_ID, type: 'card'})
      const existingPaymentMethod = data.find(x => x.card.fingerprint === fingerprint);
      if (existingPaymentMethod) {
        if (existingPaymentMethod.card.exp_month !== exp_month || existingPaymentMethod.card.exp_year !== exp_year) {
          await stripe.paymentMethods.update(existingPaymentMethod.id, { card: { exp_month, exp_year } });
        }
        hasExistingPaymentMethod = true
        payment_method = existingPaymentMethod.id;
      }
    }
    
    if (!hasExistingPaymentMethod) {
      await stripe.paymentMethods.attach(
        payment_method,
        { customer: CUSTOMER_ID }
      );
    }

    await stripe.customers.update(CUSTOMER_ID, { invoice_settings: { default_payment_method: payment_method } })

    const recurringItem = products.find(id => PRODUCTS.find(p => p.id === id).type === 'R')
    const recurringItemDetails = PRODUCTS.find(p => p.id === recurringItem)
    const onetimeItems = products.filter(id => PRODUCTS.find(p => p.id === id).type === 'O')
    
    if (recurringItemDetails) {
      const subscription = await stripe.subscriptions.create({
        customer: CUSTOMER_ID,
        items: [
          { price: recurringItemDetails.id },
        ],
        add_invoice_items: onetimeItems.map(price => ({ price })),
        trial_period_days: recurringItemDetails.trail_period,
        default_payment_method: payment_method,
        off_session: true,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      return res.json({ payment_method, subscription, client_secret: subscription.latest_invoice.payment_intent && subscription.latest_invoice.payment_intent.client_secret })
    }

    if (onetimeItems.length === 1) {

      const onetimeItemDetails = PRODUCTS.find(p => p.id === onetimeItems[0])
      
      const paymentIntent = await stripe.paymentIntents.create({ amount: onetimeItemDetails.amount * 100, currency: 'USD', customer: CUSTOMER_ID, payment_method, confirm: false });

      return res.json({ payment_method, paymentIntent, client_secret: paymentIntent && paymentIntent.client_secret })

    }


    // Free item for create invoice
    const freeInvoiceItem = await stripe.invoiceItems.create({ customer: CUSTOMER_ID, amount: 0, currency: 'USD', description: 'Invoice Fee' });
    await stripe.invoiceItems.create({ customer: CUSTOMER_ID, amount: 1, currency: 'USD', description: 'Invoice Fee#2' });

    const invoice = await stripe.invoices.create({ customer: CUSTOMER_ID, default_payment_method: payment_method });
    const invoiceLineItemIds = invoice && invoice.lines && invoice.lines.data ? invoice.lines.data.map(key => key.id) : []

    const itemIdsDiff = invoiceLineItemIds.filter((v) => v !== freeInvoiceItem.id);
    if (itemIdsDiff.length) {
      for (const itemId of itemIdsDiff) {
        await stripe.invoiceItems.del(itemId)
      }
    }

    for (const price of products) {
      await stripe.invoiceItems.create({ customer: CUSTOMER_ID, price, invoice: invoice.id });
    }
    const finalizInvoice = await stripe.invoices.finalizeInvoice(invoice.id, { expand: ['payment_intent'] });
    
    return res.json({ 
      payment_method,
      invoice: finalizInvoice, 
      client_secret: finalizInvoice.payment_intent.client_secret 
    });
    
  } catch (error) {
    console.log({ ...error, errorStack: error.stack });
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const upSellOnetimeProduct = async (req, res) => {
  try {
    const customer = await stripe.customers.retrieve(CUSTOMER_ID);

    try {
      const onetime = await stripe.paymentIntents.create({ 
        amount: 200, 
        currency: 'USD', 
        customer: customer.id, 
        payment_method: customer.invoice_settings.default_payment_method, 
        off_session: true, 
        confirm: true 
      });
      return res.json({ ...onetime });
    } catch (error) {
      console.log({ ...error, errorStack: error.stack });
      const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(error.raw.payment_intent.id);
      return res.json({ ...paymentIntentRetrieved })
    }
  } catch (error) {
    console.log({ ...error, errorStack: error.stack });
    return res.json({ error: error.message || 'Something went wrong!' });
  }
}

const upSellRecuringProduct = async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: CUSTOMER_ID,
      items: [
        { price: 'price_1JZCIqCScnf89tZoW5QoZjTv' },
      ],
      off_session: true
    });
    return res.json({ ...subscription });
  } catch (error) {
    console.log({ ...error, errorStack: error.stack });
    try {
      const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(error.raw.payment_intent.id);
      return res.json({ ...paymentIntentRetrieved })
    } catch (error) {
      console.log({ ...error, errorStack: error.stack });
      return res.json({ error: error.message || 'Something went wrong!' });
    }
  }
}

const purchaseProductsV2 = async (req, res) => {
  try {
    const { products } = req.body
    // const paymentIntent = await stripe.paymentIntents.create({
    //   customer: CUSTOMER_ID,
    //   amount: 1099,
    //   currency: 'usd',
    //   automatic_payment_methods: {
    //     enabled: true
    //   },
    //   setup_future_usage: 'off_session',
    // }, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });

    // return res.json({ paymentIntent, client_secret: paymentIntent && paymentIntent.client_secret })


    if (!products || !products.length) {
      return res.json({ error: 'Products are required!' });
    }
    const recurringItem = products.find(id => PRODUCTS.find(p => p.id === id).type === 'R')
    const recurringItemDetails = PRODUCTS.find(p => p.id === recurringItem)
    const onetimeItems = products.filter(id => PRODUCTS.find(p => p.id === id).type === 'O')

    if (recurringItemDetails) {
      const subscription = await stripe.subscriptions.create({
        customer: CUSTOMER_ID,
        items: [
          { price: recurringItemDetails.id },
        ],
        add_invoice_items: onetimeItems.map(price => ({ price })),
        trial_period_days: recurringItemDetails.trail_period,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return res.json({ subscription, client_secret: subscription.latest_invoice.payment_intent && subscription.latest_invoice.payment_intent.client_secret })
    }

    const invoice = await stripe.invoices.create({ 
      customer: CUSTOMER_ID, 
      pending_invoice_items_behavior: 'exclude'
    })
    for (const price of products) {
      await stripe.invoiceItems.create({ customer: CUSTOMER_ID, price, invoice: invoice.id })
    }

    const finalizInvoice = await stripe.invoices.finalizeInvoice(invoice.id, { expand: ['payment_intent'] })

    const paymentIntent = await stripe.paymentIntents.update(finalizInvoice.payment_intent.id, { setup_future_usage: 'off_session' })

    return res.json({
      invoice: finalizInvoice,
      // paymentIntent: paymentIntent, 
      client_secret: finalizInvoice.payment_intent.client_secret 
    })

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
  purchaseProducts,
  upSellOnetimeProduct,
  upSellRecuringProduct,
  purchaseProductsV2
}