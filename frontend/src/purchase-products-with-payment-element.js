import React, { useState } from "react";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import CustomPaymentElement from './payment-element'

const PurchaseProductsWithPaymentElement = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [type, setPaymentType] = useState('')

  const handlePurchaseProducts = (event, type) => {
    event.preventDefault();
    if (clientSecret) setClientSecret();
    return purchaseProducts(type)
  }

  const purchaseProducts = async (type) => {
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
            <h2 className="mb-2">Order Form</h2>
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
