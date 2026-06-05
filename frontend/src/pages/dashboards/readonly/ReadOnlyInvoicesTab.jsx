import React from "react";
import InvoiceTab from "../shared/InvoiceTab";

const ReadOnlyInvoicesTab = ({ invoices = [], clients = [], payments = [], showToast, user }) => (
  <InvoiceTab
    role="readonly"
    invoices={invoices}
    clients={clients}
    payments={payments}
    showToast={showToast}
    user={user}
  />
);

export default ReadOnlyInvoicesTab;
