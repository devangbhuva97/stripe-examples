import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import axiox from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import idx from 'idx';


const PaymentElementForm = ({ setPaymentDetails, paymentDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    setErrorMessage()
    setIsLoading(true)
    try {
      return await processConfirmPayment()
    } catch (error) {
      console.error(error)
      setErrorMessage('Something went wrong!')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentCallback = (paymentIntent) => {
    if (paymentIntent?.status === 'succeeded') {
      setPaymentDetails()
      alert(`Payment Success - ${paymentIntent.id}`)
      navigate('/upsell')
    } else if (paymentIntent?.status === 'processing') {
      setPaymentDetails()
      alert(`Payment Processing - ${paymentIntent.id}`)
      navigate('/upsell')
    } else {
      console.log(paymentIntent)
    }
  }

  const processConfirmPayment = async () => {
    const { error, paymentIntent } = await stripe.confirmPayment({ 
      elements, 
      confirmParams: {
        return_url: `${window.location.origin}`
      },
      redirect: 'if_required' 
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      if (paymentDetails.isAuth) {
        await purchaseProducts(paymentDetails.type, paymentDetails.paymentIntent.id)
      } else {
        const verifiedPaymentIntent = await axiox.post(`${process.env.API_URL}/payments/stripe/internal-poc/verify-purchase`, { id: paymentIntent.id });
        return handlePaymentCallback(verifiedPaymentIntent.data)
      }
    }
  }

  const purchaseProducts = async (type, authPaymentIntentId) => {
    const purchaseProductsResponse = await axiox.post(`${process.env.API_URL}/payments/stripe/internal-poc/purchase`, { type, authPaymentIntentId });

    console.log('====================================================');
    console.log("[Purchase Products]", purchaseProductsResponse);

    const purchaseProductsError = idx(purchaseProductsResponse,_ => _.data.error);

    if (purchaseProductsError) return setErrorMsg(purchaseProductsError);

    const { subscription } = purchaseProductsResponse.data
    if (subscription?.status === 'trialing') {
      alert(`Payment Success - ${subscription.id}`)
      navigate('/upsell')
    } else {
      setErrorMessage('Something went wrong!')
    }
  }

  return (
    <form id="payment-element-form" onSubmit={onSubmit}>
      <PaymentElement />
      {errorMessage && <div className="text-danger" >{errorMessage}</div>}
      <button disabled={isLoading || !stripe || !elements} id="submit" className="mb-4">
        <span id="button-text">
          {isLoading ? "Processing..." : "Pay now"}
        </span>
      </button>
    </form>
  )
}

const stripePromise = loadStripe(process.env.STRIPE_PUB_KEY, { stripeAccount: process.env.STRIPE_CUS_ACCOUNT_ID });

const CustomPaymentElement = ({ paymentDetails, setPaymentDetails }) => {
  const { clientSecret } = paymentDetails
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElementForm setPaymentDetails={setPaymentDetails} paymentDetails={paymentDetails} />
    </Elements>
  )
}

export default CustomPaymentElement