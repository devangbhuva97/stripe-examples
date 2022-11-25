import React, { useState } from "react";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import CustomPaymentElement from './payment-element'

const PurchaseProductsWithPaymentElement = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [type, setPaymentType] = useState('')

  const purchaseProducts = async (event, type) => {
    event.preventDefault();
    if (clientSecret) setClientSecret();

    const purchaseProductsResponse = await axiox.post(`${process.env.API_URL}/payments/stripe/internal-poc/purchase`, { type });

    console.log('====================================================');
    console.log("[Purchase Products]", purchaseProductsResponse);

    const purchaseProductsError = idx(purchaseProductsResponse,_ => _.data.error);

    if (purchaseProductsError) return setErrorMsg(purchaseProductsError);

    if (purchaseProductsResponse.data.clientSecret) {
      setClientSecret(purchaseProductsResponse.data.clientSecret);
      setPaymentType(purchaseProductsResponse.data.type)
    }

    console.log(purchaseProductsResponse, '------purchaseProductsResponse-----')
  }

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="mt-2 text-center">
            <TestCards />
            <div className="d-flex justify-content-between mb-4">
              <button type="button" onClick={(e) => purchaseProducts(e, 'recurring')}>
                Recurring without Trail
              </button>
              <button type="button" onClick={(e) => purchaseProducts(e, 'recurring_with_trail')}>
                Recurring with Trail
              </button>
              <button type="button" onClick={(e) => purchaseProducts(e, 'onetime_with_invoice')}>
                Onetime (Invoice)
              </button>
              <button type="button" onClick={(e) => purchaseProducts(e, 'onetime')}>
                Onetime
              </button>
            </div>
            <hr />
            {
              clientSecret && <CustomPaymentElement clientSecret={clientSecret} setClientSecret={setClientSecret} type={type} />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseProductsWithPaymentElement;
