import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AcceptPayment from './accept-payment';
import PurchaseProducts from './purchase-products-with-card-element';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<PurchaseProducts />} />
        <Route path='/accept-payment' element={<AcceptPayment />} />
        <Route path='/purchase-products-with-card-element' element={<PurchaseProducts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;