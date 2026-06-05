import React from "react";
import InvoiceTab from "../shared/InvoiceTab";

const InvoicesTab = ({ clients, invoices, setInvoices, payments, setPayments, showToast, user }) => (
  <InvoiceTab
    role="owner"
    clients={clients}
    invoices={invoices}
    setInvoices={setInvoices}
    payments={payments}
    setPayments={setPayments}
    showToast={showToast}
    user={user}
  />
);

export default InvoicesTab;
