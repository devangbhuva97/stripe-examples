import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import axiox from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";


const PaymentElementForm = ({ setClientSecret, type = 'paymentIntent' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    setErrorMessage()

    if (type === 'paymentIntent') {
      return processConfirmPayment()
    }

    if (type === 'setupIntent') {
      return processConfirmCard()
    }

    alert('Something went wrong!')
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

      const verifiedPaymentIntent = await axiox.post(`${process.env.API_URL}/payments/stripe/internal-poc/verify-purchase`, { type, id: paymentIntent.id });

      console.log(verifiedPaymentIntent)

      if (paymentIntent?.status === 'succeeded') {
        setClientSecret()
        alert(`Payment Success - ${paymentIntent.id}`)
        navigate('/upsell')
      } else if (paymentIntent?.status === 'processing') {
        setClientSecret()
        alert(`Payment Processing - ${paymentIntent.id}`)
        navigate('/upsell')
      } else {
        console.log(paymentIntent)
      }
    }

    setIsLoading(false);
  }

  const processConfirmCard = async () => {
    const { error, setupIntent } = await stripe.confirmSetup({ 
      elements, 
      confirmParams: {
        return_url: `${window.location.origin}`
      },
      redirect: 'if_required' 
    })

    console.log(setupIntent, error)

    if (error) {
      setErrorMessage(error.message);
    } else {
      if (setupIntent?.status === 'succeeded') {
        setClientSecret()
        alert(`Payment Success - ${setupIntent.id}`)
      } else if (setupIntent?.status === 'processing') {
        setClientSecret()
        alert(`Payment Processing - ${setupIntent.id}`)
      } else {
        console.log(setupIntent)
      }
    }

    setIsLoading(false);
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

const CustomPaymentElement = ({ clientSecret, setClientSecret, type }) => {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElementForm setClientSecret={setClientSecret} type={type} />
    </Elements>
  )
}

export default CustomPaymentElement