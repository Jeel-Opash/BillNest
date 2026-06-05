import React from "react";
import InvoiceTab from "../shared/InvoiceTab";

const AdminInvoicesTab = ({ clients, invoices, setInvoices, payments, setPayments, showToast, user }) => (
  <InvoiceTab
    role="admin"
    clients={clients}
    invoices={invoices}
    setInvoices={setInvoices}
    payments={payments}
    setPayments={setPayments}
    showToast={showToast}
    user={user}
  />
);

export default AdminInvoicesTab;
