import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AcceptPayment from './accept-payment';
import PurchaseProductsWithCardElement from './purchase-products-with-card-element';
import PurchaseProductsWithPaymentElement from './purchase-products-with-payment-element';
import UpsellProducts from './upsell-products';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<PurchaseProductsWithPaymentElement />} />
        <Route path='/upsell' element={<UpsellProducts />} />
        <Route path='/accept-payment' element={<AcceptPayment />} />
        <Route path='/purchase-products-with-card-element' element={<PurchaseProductsWithCardElement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;