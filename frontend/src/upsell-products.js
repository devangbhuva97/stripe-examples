import React, { useState } from "react";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import { loadStripe } from "@stripe/stripe-js";
import { useStripe, Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

const stripePromise = loadStripe(process.env.STRIPE_PUB_KEY, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });

const UpsellProductsDemo = () => {
  const [clientSecret, setClientSecret] = useState('');
  const stripe = useStripe();
  const [errorMessage, setErrorMessage] = useState();
  const navigate = useNavigate();

  const handlePurchaseProducts = (event, type) => {
    event.preventDefault();
    if (clientSecret) setClientSecret();

    return purchaseUpsellProducts(type)
  }

  const purchaseUpsellProducts = async (type) => {
    setErrorMessage()
    const purchaseProductsResponse = await axiox.post(`${process.env.API_URL}/payments/stripe/internal-poc/purchase-upsell`, { type });

    console.log('====================================================');
    console.log("[Purchase Products]", purchaseProductsResponse);

    const purchaseProductsError = idx(purchaseProductsResponse,_ => _.data.error);

    if (purchaseProductsError) return setErrorMsg(purchaseProductsError);

    let { paymentIntent } = purchaseProductsResponse.data
    if (paymentIntent.status === 'requires_confirmation') {
      const confirmCardPaymentPayload = await stripe.confirmCardPayment(paymentIntent.client_secret, {
        payment_method: paymentIntent.payment_method
      })
      
      console.log("[Confirm Card Payment]", confirmCardPaymentPayload);

      if (confirmCardPaymentPayload.error) {
        return setErrorMessage(confirmCardPaymentPayload.error.message);
      }

      paymentIntent = confirmCardPaymentPayload.paymentIntent
    }

    if (paymentIntent?.status === 'succeeded') {
      setClientSecret()
      alert(`Payment Success - ${paymentIntent.id}`)
      navigate('/')
    } else if (paymentIntent?.status === 'processing') {
      setClientSecret()
      alert(`Payment Processing - ${paymentIntent.id}`)
      navigate('/')
    } else {
      console.log(paymentIntent)
    }
  }

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="mt-2 text-center">
            <h2 className="mb-2">Upsell</h2>
            <TestCards />
            <div className="d-flex justify-content-between mb-4">
              <button type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring')}>
                Recurring without Trail
              </button>
              <button type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring_with_trail')}>
                Recurring with Trail
              </button>
              <button type="button" onClick={(e) => handlePurchaseProducts(e, 'onetime_with_invoice')}>
                Onetime (Invoice)
              </button>
              <button type="button" onClick={(e) => handlePurchaseProducts(e, 'onetime')}>
                Onetime
              </button>
            </div>
            {errorMessage && <div className="text-danger" >{errorMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const UpsellProducts = () => {
  return (
    <Elements stripe={stripePromise}>
      <UpsellProductsDemo />
    </Elements>
  )
}

export default UpsellProducts;
