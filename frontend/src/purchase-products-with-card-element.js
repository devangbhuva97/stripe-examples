import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import { PRODUCTS } from "./utils/products";

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

const PurchaseProductsDemo = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMsg, setErrorMsg] = useState();
  const [successMsg, setSuccessMsg] = useState();
  const [products, handleProducts] = useState([]);

  const handleProductsChange = (e) => {
    const { checked, id } = e.target;
    if (checked) handleProducts((prev) => [...prev, id])
    if (!checked) handleProducts((prev) => prev.filter(p => p !== id))
  }

  const clearMsg = () => {
    if (errorMsg) setErrorMsg();
    if (successMsg) setSuccessMsg();
  }

  const purchaseProducts = async (event) => {
    event.preventDefault();
    
    if (!products?.length) return setErrorMsg('Please select at least 1 product')

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
      products,
      payment_method: createPaymentMethodPayload.paymentMethod.id,
    }
    const purchaseProductsResponse = await axiox.post(`${process.env.API_URL}/purchase-products`, data);

    console.log('====================================================');
    console.log("[Purchase Products]", purchaseProductsResponse);

    const purchaseProductsError = idx(purchaseProductsResponse,_ => _.data.error);

    if (purchaseProductsError) return setErrorMsg(purchaseProductsError);

    if (purchaseProductsResponse.data.client_secret) {
      const confirmCardPaymentPayload = await stripe.confirmCardPayment(purchaseProductsResponse.data.client_secret, { payment_method: purchaseProductsResponse.data.payment_method, setup_future_usage: 'off_session' });
  
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
                    <div className="custom-control custom-checkbox text-left" key={p.id}>
                      <input type="checkbox" className="custom-control-input" id={p.id} value={p.id} name='product' onChange={handleProductsChange} />
                      <label className="custom-control-label text-dark" htmlFor={p.id}>{`${p.amount} - ${p.desc} - Trial: ${p.trail_period || 0} days`}</label>
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

const PurchaseProductsWithCardElement = () => {
  return (
    <Elements stripe={stripePromise}>
      <PurchaseProductsDemo />
    </Elements>
  )
}

export default PurchaseProductsWithCardElement;
