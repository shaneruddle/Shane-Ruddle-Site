// /staff-check: the cashier's staff list for staff discounts. Its own small page, no website or Firebase bundle.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import StaffCheck from './components/StaffCheck';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StaffCheck />
  </StrictMode>,
);
