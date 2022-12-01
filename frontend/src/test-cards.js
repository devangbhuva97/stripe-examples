import React from 'react';

const TestCards = () => {
  return(
    <ul className="list-group mb-3">
      <li className="list-group-item d-flex justify-content-between lh-condensed">
        <div>
          <h6 className="my-0">Payment succeeds</h6>
        </div>
        <span className="text-success">4242 4242 4242 4242</span>
      </li>
      <li className="list-group-item d-flex justify-content-between lh-condensed">
        <div>
          <h6 className="my-0">Payment requires authentication once</h6>
        </div>
        <span className="text-warning">4000 0025 0000 3155</span>
      </li>
      <li className="list-group-item d-flex justify-content-between lh-condensed">
        <div>
          <h6 className="my-0">Payment requires authentication everytime</h6>
        </div>
        <span className="text-warning">4000 0027 6000 3184</span>
      </li>
      <li className="list-group-item d-flex justify-content-between lh-condensed">
        <div>
          <h6 className="my-0">Payment is declined</h6>
        </div>
        <span className="text-danger">4000 0000 0000 9995</span>
      </li>
      <li className="list-group-item d-flex justify-content-between lh-condensed">
        <div>
          <h6 className="my-0">Payment is declined after attaching</h6>
        </div>
        <span className="text-danger">4000 0000 0000 0341</span>
      </li>
    </ul>
  )
}

export default TestCards;