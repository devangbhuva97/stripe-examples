import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'

const stripePromise = loadStripe(process.env.STRIPE_PUB_KEY, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "22px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

// https://dashboard.stripe.com/test/products/prod_KBMjirO3HYBPLa
// https://dashboard.stripe.com/test/products/prod_KBMns8wuQTRrV8
const PRODUCTS = [
  {
    id: 'price_1JX00PCScnf89tZoLhwHReEP',
    type: 'O',
    amount: '$18',
    desc: 'One time | #1'
  },
  {
    id: 'price_1JX00PCScnf89tZoAGeWPujZ',
    type: 'R',
    amount: '$13',
    desc: 'Daily Recurring | #1',
    trail_period: 0,
  },
  {
    id: 'price_1JX00PCScnf89tZoQoEiRE4P',
    type: 'R',
    amount: '$17',
    desc: 'Weekly Recurring | #1',
    trail_period: 14,
  },
  {
    id: 'price_1JX00PCScnf89tZoiI4kOVDj',
    type: 'R',
    amount: '$12',
    desc: 'Monthly Recurring | #1',
    trail_period: 28,
  },
  {
    id: 'price_1JX03WCScnf89tZoFrRgeWRQ',
    type: 'O',
    amount: '$24',
    desc: 'One time | #2'
  },
  {
    id: 'price_1JX03WCScnf89tZoUX3gHxkF',
    type: 'R',
    amount: '$23',
    desc: 'Monthly Recurring | #2',
    trail_period: 7,
  },
  {
    id: 'price_1JX03WCScnf89tZoyvxJxDWs',
    type: 'R',
    amount: '$27',
    desc: 'Daily Recurring | #2',
    trail_period: 15,
  },
  {
    id: 'price_1JX03WCScnf89tZoY6a8M9hp',
    type: 'R',
    amount: '$22',
    desc: 'Weekly Recurring | #2',
    trail_period: 10,
  }
]

const BUMP_PRODUCTS = [
  {
    id: 'price_1JX00PCScnf89tZoHOD631UN',
    type: 'O',
    amount: '$14',
    desc: 'One time | #1'
  },
  {
    id: 'price_1JX03WCScnf89tZosJV2DMiU',
    type: 'O',
    amount: '$28',
    desc: 'One time | #2'
  },
]

const PurchaseProductsDemo = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMsg, setErrorMsg] = useState();
  const [successMsg, setSuccessMsg] = useState();
  const [product, handleProduct] = useState();
  const [bumpProducts, handleBumpProducts] = useState([]);

  const handleProductChange = (e) => {
    handleProduct(e.target.value)
  }

  const handleBumpProductChange = (e) => {
    const { checked, id } = e.target;
    if (checked) handleBumpProducts((prev) => [...prev, id])
    if (!checked) handleBumpProducts((prev) => prev.filter(p => p !== id))
  }

  const clearMsg = () => {
    if (errorMsg) setErrorMsg();
    if (successMsg) setSuccessMsg();
  }

  const purchaseProducts = async (event) => {
    event.preventDefault();
    
    if (!product) return setErrorMsg('Please select at least 1 product')

    // if (!name) return setErrorMsg('Please enter name')
    
    clearMsg();
    
    if (!stripe || !elements) return;

    const createPaymentMethodPayload = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement)
    });

    console.log("[Create Payment Method]", createPaymentMethodPayload);
    
    if (createPaymentMethodPayload.error) return setErrorMsg(createPaymentMethodPayload.error.message);

    const data = {
      products: [ product, ...bumpProducts],
      payment_method: createPaymentMethodPayload.paymentMethod.id,
    }
    const purchaseProductsResponse = await axiox.post(`${process.env.API_URL}/purchase-products`, data);

    console.log('====================================================');
    console.log("[Purchase Products]", purchaseProductsResponse);

    const purchaseProductsError = idx(purchaseProductsResponse,_ => _.data.error);

    if (purchaseProductsError) return setErrorMsg(purchaseProductsError);

    if (purchaseProductsResponse.data.client_secret) {
      const confirmCardPaymentPayload = await stripe.confirmCardPayment(purchaseProductsResponse.data.client_secret, { payment_method: createPaymentMethodPayload.paymentMethod.id, setup_future_usage: 'off_session' });
  
      console.log("[Confirm Card Payment]", confirmCardPaymentPayload);
    }

    return setSuccessMsg('Products Purchased!');

  }

  const purchaseUpSellProduct = async (type) => {

    const upSellPurchaseResponse = await axiox.post(`${process.env.API_URL}/up-sell-${type}`);

    console.log('====================================================');
    console.log(`[Up Sell ${type.toUpperCase()} Product]`, upSellPurchaseResponse);

    const upSellPurchaseError = idx(upSellPurchaseResponse,_ => _.data.error);

    if (upSellPurchaseError) return setErrorMsg(upSellPurchaseError);

    if (upSellPurchaseResponse.data.client_secret && upSellPurchaseResponse.data.last_payment_error && upSellPurchaseResponse.data.last_payment_error.payment_method.id) {

      const confirmCardPaymentPayload = await stripe.confirmCardPayment(upSellPurchaseResponse.data.client_secret, {
        payment_method: upSellPurchaseResponse.data.last_payment_error.payment_method.id
      })

      console.log("[Confirm Card Payment]", confirmCardPaymentPayload);

    }
  }

  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <form className="mt-5 text-center">
            <TestCards />
            <div>Products</div>
            <div>
              {
                PRODUCTS.map(p => {
                  return(
                    <div className="custom-control custom-radio text-left" key={p.id}>
                      <input type="radio" className="custom-control-input" id={p.id} value={p.id} name='product' onChange={handleProductChange} />
                      <label className="custom-control-label text-dark" htmlFor={p.id}>{`${p.amount} - ${p.desc} - Trial: ${p.trail_period || 0} days`}</label>
                    </div>
                  )
                })
              }
            </div>
            <hr />
            <div>Bump Products</div>
            <div>
              {
                BUMP_PRODUCTS.map(p => {
                  return(
                    <div className="custom-control custom-checkbox text-left" key={p.id}>
                      <input type="checkbox" className="custom-control-input" id={p.id} value={bumpProducts.includes(p.id)} onChange={handleBumpProductChange} />
                      <label className="custom-control-label text-dark" htmlFor={p.id}>{`${p.amount} - ${p.desc}`}</label>
                    </div>
                  )
                })
              }
            </div>
            <hr />
            <div className="mb-5">
              <CardElement options={CARD_ELEMENT_OPTIONS} onChange={clearMsg} />
              {errorMsg && <span className="text-danger">{errorMsg}</span>}
              {successMsg && <span className="text-success">{successMsg}</span>}
            </div>
            <div>
              <button type="button" className="mb-4" onClick={purchaseProducts} disabled={!stripe}>
                Purchase Products
              </button>
            </div>
            <hr />
            <div>
              <button type="button" className="mb-4" onClick={() => purchaseUpSellProduct('onetime')}>
                Purchase Up Sell One time Product
              </button>
            </div>
            <div>
              <button type="button" className="mb-4" onClick={() => purchaseUpSellProduct('recurring')}>
                Purchase Up Sell Subscription Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const PurchaseProducts = () => {
  return (
    <Elements stripe={stripePromise}>
      <PurchaseProductsDemo />
    </Elements>
  )
}

export default PurchaseProducts;
