import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axiox from "axios";
import idx from 'idx';

const stripePromise = loadStripe(process.env.STRIPE_PUB_KEY);

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

const AcceptPaymentDemo = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMsg, setErrorMsg] = useState();
  const [successMsg, setSuccessMsg] = useState();

  const clearMsg = () => {
    if (errorMsg) setErrorMsg();
    if (successMsg) setSuccessMsg();
  }

  const completesPaymentAtClient = async event => {
    event.preventDefault();

    clearMsg();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const createPaymentIntentResponse = await axiox.post(`${process.env.API_URL}/create-payment-intent`);

    const clientSecret = idx(createPaymentIntentResponse,_ => _.data.client_secret);

    if (!clientSecret) return setErrorMsg('Something went wrong!');

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)
      }
    });

    console.log("[Confirm Card Payment]", payload);

    if (payload.error) return setErrorMsg(payload.error.message);

    return setSuccessMsg('Payment completed at client side');
  };

  const completesPaymentAtPartialClientServer = async event => {
    event.preventDefault();

   clearMsg();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const payload = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement)
    });

    console.log("[Create Payment Method]", payload);

    if (payload.error) return setErrorMsg(payload.error.message);

    const createPaymentIntentResponse = await axiox.post(`${process.env.API_URL}/create-payment-intent`, {
      confirmation_method: 'manual',
      payment_method: payload.paymentMethod.id,
      confirm: true
    });

    console.log('====================================================');
    console.log("[Create Payment Intent]", createPaymentIntentResponse);

    const createPaymentIntentError = idx(createPaymentIntentResponse,_ => _.data.error);

    if (createPaymentIntentError) return setErrorMsg(createPaymentIntentError);

    if (createPaymentIntentResponse.data.status === 'requires_action') {

      const cardActionResponse = await stripe.handleCardAction(createPaymentIntentResponse.data.client_secret);

      console.log('====================================================');
      console.log("[Handle Card Action]", cardActionResponse);

      if (cardActionResponse.error) return setErrorMsg(cardActionResponse.error.message);

      const confirmPaymentIntentResponse = await axiox.post(`${process.env.API_URL}/confirm-payment-intent`, cardActionResponse.paymentIntent);

      console.log('====================================================');
      console.log("[Confirm Payment Intent]", confirmPaymentIntentResponse);

      const confirmPaymentIntentError = idx(confirmPaymentIntentResponse,_ => _.data.error);

      if (confirmPaymentIntentError) return setErrorMsg(confirmPaymentIntentError);

      return setSuccessMsg('Payment completed at server side');

    } else {

      return setSuccessMsg('Payment completed at client side');

    }

  };

  const completesPaymentAtServer = async event => {
    event.preventDefault();

   clearMsg();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const payload = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement)
    });

    console.log("[Create Payment Method]", payload);

    if (payload.error) return setErrorMsg(payload.error.message);

    const createPaymentIntentResponse = await axiox.post(`${process.env.API_URL}/create-payment-intent`, {
      confirmation_method: 'manual',
      payment_method: payload.paymentMethod.id,
      confirm: false
    });

    console.log('====================================================');
    console.log("[Create Payment Intent]", createPaymentIntentResponse);

    const createPaymentIntentError = idx(createPaymentIntentResponse,_ => _.data.error);

    if (createPaymentIntentError) return setErrorMsg(createPaymentIntentError);

    if (createPaymentIntentResponse.data.status === 'requires_confirmation') {

      const confirmPaymentIntentResponse = await axiox.post(`${process.env.API_URL}/confirm-payment-intent`, createPaymentIntentResponse.data);

      console.log('====================================================');
      console.log("[Confirm Payment Intent]", confirmPaymentIntentResponse);

      const confirmPaymentIntentError = idx(confirmPaymentIntentResponse,_ => _.data.error);

      if (confirmPaymentIntentError) return setErrorMsg(confirmPaymentIntentError);

      if (confirmPaymentIntentResponse.data.status === 'requires_action') {

        const cardActionResponse = await stripe.handleCardAction(confirmPaymentIntentResponse.data.client_secret);

        console.log('====================================================');
        console.log("[Handle Card Action]", cardActionResponse);

        if (cardActionResponse.error) return setErrorMsg(cardActionResponse.error.message);

        const confirmPaymentIntentResponse2 = await axiox.post(`${process.env.API_URL}/confirm-payment-intent`, cardActionResponse.paymentIntent);

        console.log('====================================================');
        console.log("[Confirm Payment Intent 2]", confirmPaymentIntentResponse2);

        const confirmPaymentIntentError2 = idx(confirmPaymentIntentResponse2,_ => _.data.error);

        if (!confirmPaymentIntentError2) return setErrorMsg(confirmPaymentIntentError2);

        return setSuccessMsg('Payment completed at server side');

      } else {

        return setSuccessMsg('Payment completed at server side');

      }

    }
  };

  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <form className="mt-5 text-center">
            <ul className="list-group mb-5">
              <li className="list-group-item d-flex justify-content-between lh-condensed">
                <div>
                  <h6 className="my-0">Payment succeeds</h6>
                </div>
                <span className="text-success">4242 4242 4242 4242</span>
              </li>
              <li className="list-group-item d-flex justify-content-between lh-condensed">
                <div>
                  <h6 className="my-0">Payment requires authentication</h6>
                </div>
                <span className="text-warning">4000 0025 0000 3155</span>
              </li>
              <li className="list-group-item d-flex justify-content-between lh-condensed">
                <div>
                  <h6 className="my-0">Payment is declined</h6>
                </div>
                <span className="text-danger">4000 0000 0000 9995</span>
              </li>
            </ul>
            <div className="mb-5">
              <CardElement options={CARD_ELEMENT_OPTIONS} onChange={clearMsg} />
              {errorMsg && <span className="text-danger">{errorMsg}</span>}
              {successMsg && <span className="text-success">{successMsg}</span>}
            </div>
            <div>
              <button type="button" className="mb-4" onClick={completesPaymentAtClient} disabled={!stripe}>
                Completes Payment at Client
              </button>
            </div>
            <div>
              <button type="button" className="mb-4" onClick={completesPaymentAtPartialClientServer} disabled={!stripe}>
                Completes Payment at Partial Client/Server
              </button>
            </div>
            <div>
              <button type="button" className="mb-4" onClick={completesPaymentAtServer} disabled={!stripe}>
                Completes Payment at Server
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AcceptPayment = () => {
  return (
    <Elements stripe={stripePromise}>
      <AcceptPaymentDemo />
    </Elements>
  )
}

export default AcceptPayment;
