import React, { useState } from "react";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import { loadStripe } from "@stripe/stripe-js";
import { useStripe, Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

const stripePromise = loadStripe(process.env.STRIPE_PUB_KEY, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });

const UpsellProductsDemo = () => {
  const stripe = useStripe();
  const [errorMessage, setErrorMessage] = useState();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState();

  const handlePurchaseProducts = async (event, type) => {
    event.preventDefault()

    if (!stripe) return;
    setErrorMessage()
    setIsLoading(type)
    try {
      return await purchaseUpsellProducts(type)
    } catch (error) {
      console.error(error)
      setErrorMessage('Something went wrong!')
    } finally {
      setIsLoading()
    }
  }

  const handlePaymentCallback = (paymentIntent) => {
    if (paymentIntent?.status === 'succeeded') {
      alert(`Payment Success - ${paymentIntent.id}`)
      navigate('/')
    } else if (paymentIntent?.status === 'processing') {
      alert(`Payment Processing - ${paymentIntent.id}`)
      navigate('/')
    } else {
      console.log(paymentIntent)
    }
  }

  const purchaseUpsellProducts = async (type) => {
    const purchaseProductsResponse = await axiox.post(`${process.env.API_URL}/payments/stripe/internal-poc/purchase-upsell`, { type });

    console.log('====================================================');
    console.log("[Purchase Products]", purchaseProductsResponse);

    const purchaseProductsError = idx(purchaseProductsResponse,_ => _.data.error);

    if (purchaseProductsError) return setErrorMsg(purchaseProductsError);

    let { subscription, paymentIntent } = purchaseProductsResponse.data
    if (subscription?.status === 'trialing') {
      alert(`Payment Success - ${subscription.id}`)
      navigate('/')
    } else if (paymentIntent?.status === 'requires_confirmation') {
      const confirmCardPaymentPayload = await stripe.confirmCardPayment(paymentIntent.client_secret, {
        payment_method: paymentIntent.payment_method
      })
      
      console.log("[Confirm Card Payment]", confirmCardPaymentPayload);

      if (confirmCardPaymentPayload.error) {
        return setErrorMessage(confirmCardPaymentPayload.error.message);
      }

      handlePaymentCallback(confirmCardPaymentPayload.paymentIntent)
    } else {
      setErrorMessage('Something went wrong!')
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
              <button disabled={isLoading || !stripe} type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring_without_trial')}>
                { isLoading === 'recurring_without_trial' ? 'Processing...' : 'Recurring without Trail' }
              </button>
              <button disabled={isLoading || !stripe} type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring_with_trail')}>
                { isLoading === 'recurring_with_trail' ? 'Processing...' : 'Recurring with Trail' }
              </button>
              <button disabled={isLoading || !stripe} type="button" onClick={(e) => handlePurchaseProducts(e, 'onetime')}>
                { isLoading === 'onetime' ? 'Processing...' : 'Onetime' }
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
