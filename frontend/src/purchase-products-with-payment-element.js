import React, { useState } from "react";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import CustomPaymentElement from './payment-element'

const PurchaseProductsWithPaymentElement = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [productType, setProductType] = useState('')
  const [type, setPaymentType] = useState('')
  const [isLoading, setIsLoading] = useState();

  const handlePurchaseProducts = async (event, type) => {
    event.preventDefault();
    setProductType(type)
    if (clientSecret) setClientSecret();
    setIsLoading(type)
    try {
      return await purchaseProducts(type)
    } catch (error) {
      console.error(error)
      setErrorMessage('Something went wrong!')
    } finally {
      setIsLoading()
    }
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
              <button disabled={isLoading} type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring')}>
                { isLoading === 'recurring' ? 'Processing...' : 'Recurring without Trail' }
              </button>
              <button disabled={isLoading} type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring_with_trail')}>
                { isLoading === 'recurring_with_trail' ? 'Processing...' : 'Recurring with Trail' }
              </button>
              <button disabled={isLoading} type="button" onClick={(e) => handlePurchaseProducts(e, 'onetime')}>
                { isLoading === 'onetime' ? 'Processing...' : 'Onetime' }
              </button>
            </div>
            <hr />
            { productType && <h3 className="text-capitalize">{productType.split('_').join(' ')}</h3> }
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
