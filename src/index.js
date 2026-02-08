import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from './components/shared/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  
      <App />
     
);
