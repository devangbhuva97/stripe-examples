import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";


const PaymentElementForm = ({ setClientSecret, type = 'paymentIntent' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState();
  const [isLoading, setIsLoading] = useState(false);

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
      setClientSecret()
      if (paymentIntent?.status === 'succeeded') {
      alert(`Payment Success - ${paymentIntent.id}`)
      } else if (paymentIntent?.status === 'processing') {
      alert(`Payment Processing - ${paymentIntent.id}`)
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
      setClientSecret()
      if (setupIntent?.status === 'succeeded') {
      alert(`Payment Success - ${setupIntent.id}`)
      } else if (setupIntent?.status === 'processing') {
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

const CustomPaymentElement = ({ clientSecret, setClientSecret, type }) => {
  const stripePromise = loadStripe(process.env.STRIPE_PUB_KEY);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElementForm setClientSecret={setClientSecret} type={type} />
    </Elements>
  )
}

export default CustomPaymentElement