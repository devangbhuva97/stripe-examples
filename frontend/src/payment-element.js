import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";


const PaymentElementForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

  }

  return (
    <form id="payment-element-form" onSubmit={onSubmit}>
      <PaymentElement />
    </form>
  )
}

const CustomPaymentElement = ({ clientSecret }) => {
  const stripePromise = loadStripe(process.env.STRIPE_PUB_KEY);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElementForm />
    </Elements>
  )
}

export default CustomPaymentElement