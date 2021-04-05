import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AcceptPayment from './accept-payment';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<AcceptPayment />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;