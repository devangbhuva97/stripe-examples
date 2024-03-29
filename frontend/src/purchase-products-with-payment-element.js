import React, { useState } from "react";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import CustomPaymentElement from './payment-element'

const PurchaseProductsWithPaymentElement = () => {
  const [productType, setProductType] = useState('')
  const [isLoading, setIsLoading] = useState();
  const [paymentDetails, setPaymentDetails] = useState()

  const handlePurchaseProducts = async (event, type) => {
    event.preventDefault();
    setPaymentDetails();
    setProductType(type)
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

    setPaymentDetails(purchaseProductsResponse.data)

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
              <button disabled={isLoading} type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring_without_trial')}>
                { isLoading === 'recurring_without_trial' ? 'Processing...' : 'Recurring without Trail' }
              </button>
              <button disabled={isLoading} type="button" onClick={(e) => handlePurchaseProducts(e, 'recurring_with_trail')}>
                { isLoading === 'recurring_with_trail' ? 'Processing...' : 'Recurring with Trail' }
              </button>
              <button disabled={isLoading} type="button" onClick={(e) => handlePurchaseProducts(e, 'onetime')}>
                { isLoading === 'onetime' ? 'Processing...' : 'Onetime' }
              </button>
            </div>
            <hr />
            { productType && <h3 className="text-uppercase">{productType.split('_').join(' ')}</h3> }
            {
              paymentDetails?.clientSecret && <CustomPaymentElement paymentDetails={paymentDetails} setPaymentDetails={setPaymentDetails} />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseProductsWithPaymentElement;
