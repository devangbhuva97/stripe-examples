import React, { useState } from "react";
import axiox from "axios";
import idx from 'idx';
import TestCards from './test-cards'
import { PRODUCTS } from "./utils/products";
import CustomPaymentElement from './payment-element'

const PurchaseProductsWithPaymentElement = () => {
  const [errorMsg, setErrorMsg] = useState();
  const [successMsg, setSuccessMsg] = useState();
  const [products, handleProducts] = useState([]);
  const [clientSecret, setClientSecret] = useState('');

  const handleProductsChange = (e) => {
    const { checked, id } = e.target;
    if (checked) handleProducts((prev) => [...prev, id])
    if (!checked) handleProducts((prev) => prev.filter(p => p !== id))
  }

  const clearMsg = () => {
    if (errorMsg) setErrorMsg();
    if (successMsg) setSuccessMsg();
  }

  const purchaseProducts = async (event) => {
    event.preventDefault();
    
    if (!products?.length) return setErrorMsg('Please select at least 1 product')

    // if (!name) return setErrorMsg('Please enter name')
    
    clearMsg();

    const data = { products }
    const purchaseProductsResponse = await axiox.post(`${process.env.API_URL}/v2/purchase-products`, data);

    console.log('====================================================');
    console.log("[Purchase Products]", purchaseProductsResponse);

    const purchaseProductsError = idx(purchaseProductsResponse,_ => _.data.error);

    if (purchaseProductsError) return setErrorMsg(purchaseProductsError);

    if (purchaseProductsResponse.data.client_secret) setClientSecret(purchaseProductsResponse.data.client_secret);

    console.log(purchaseProductsResponse, '------purchaseProductsResponse-----')
  }

  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <div className="mt-5 text-center">
            <TestCards />
            <div>Products</div>
            <div>
              {
                PRODUCTS.map(p => {
                  return(
                    <div className="custom-control custom-checkbox text-left" key={p.id}>
                      <input type="checkbox" className="custom-control-input" id={p.id} value={p.id} name='product' onChange={handleProductsChange} />
                      <label className="custom-control-label text-dark" htmlFor={p.id}>{`${p.amount} - ${p.desc} - Trial: ${p.trail_period || 0} days`}</label>
                    </div>
                  )
                })
              }
            </div>
            <hr />
            {
              !clientSecret && 
              <div>
                <button type="button" className="mb-4" onClick={purchaseProducts}>
                  Purchase Products
                </button>
              </div>
            }
            {
              clientSecret && <CustomPaymentElement clientSecret={clientSecret} />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseProductsWithPaymentElement;
