import React from "react";
import InvoiceTab from "../shared/InvoiceTab";

const MemberInvoicesTab = ({ clients, invoices, setInvoices, payments, setPayments, showToast, user }) => (
  <InvoiceTab
    role="member"
    clients={clients}
    invoices={invoices}
    setInvoices={setInvoices}
    payments={payments}
    setPayments={setPayments}
    showToast={showToast}
    user={user}
  />
);

export default MemberInvoicesTab;
