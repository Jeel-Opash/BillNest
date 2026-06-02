import React from "react";

const InvoicesTab = ({
  clients,
  invoices,
  setInvoices,
  builderClient,
  setBuilderClient,
  builderDueDate,
  setBuilderDueDate,
  newDesc,
  setNewDesc,
  newQty,
  setNewQty,
  newPrice,
  setNewPrice,
  builderItems,
  builderDiscount,
  setBuilderDiscount,
  builderTaxRate,
  setBuilderTaxRate,
  handleAddBuilderItem,
  handleCreateInvoice,
  handleGenerateInvoicePDF,
  showToast
}) => {
  const itemsSubtotal = builderItems.reduce((acc, it) => acc + (it.qty * it.price), 0);
  const discountAmount = Math.round(itemsSubtotal * (builderDiscount / 100));
  const itemsTaxAmount = Math.round((itemsSubtotal - discountAmount) * (builderTaxRate / 100));
  const itemsFinalTotal = Math.max(0, itemsSubtotal - discountAmount + itemsTaxAmount);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-heading text-2xl font-bold text-slate-900">Invoices</h3>
        <p className="text-slate-500 text-sm mt-1">Generate client-facing invoices and audit organization billing logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <h4 className="font-heading text-lg font-bold text-slate-900">Operational Invoice Builder</h4>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Draft Mode</span>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Client Entity</label>
                <select className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all" value={builderClient} onChange={(e) => setBuilderClient(e.target.value)}>
                  {clients.map(c => <option key={c.id} value={c.company}>{c.company}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Due Date</label>
                <input type="date" required className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all" value={builderDueDate} onChange={(e) => setBuilderDueDate(e.target.value)} />
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-100 grid grid-cols-12 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <span className="col-span-6">Service Description</span>
                <span className="col-span-2 text-center">Hours / Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="divide-y divide-slate-50">
                {builderItems.map((item, idx) => (
                  <div key={idx} className="p-3 grid grid-cols-12 text-xs font-semibold text-slate-700 items-center">
                    <span className="col-span-6 text-slate-900">{item.desc}</span>
                    <span className="col-span-2 text-center text-slate-500">{item.qty}</span>
                    <span className="col-span-2 text-right text-slate-500">₹{item.price.toLocaleString()}</span>
                    <span className="col-span-2 text-right text-slate-900 font-bold">₹{(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50/30 border-t border-slate-100 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Line Item</span>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" placeholder="Description of service rendered..." className="col-span-6 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-semibold" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  <input type="number" placeholder="Qty" className="col-span-2 bg-white border border-slate-200 rounded-lg p-2 text-xs text-center outline-none focus:border-indigo-500 font-semibold" min="1" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 1)} />
                  <input type="number" placeholder="Rate" className="col-span-4 bg-white border border-slate-200 rounded-lg p-2 text-xs text-right outline-none focus:border-indigo-500 font-semibold" min="0" value={newPrice} onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)} />
                </div>
                <button type="button" onClick={handleAddBuilderItem} className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors w-fit">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Add line item
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Discount (%)</label>
                <input type="number" min="0" max="100" className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all" value={builderDiscount} onChange={(e) => setBuilderDiscount(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tax Rate (GST %)</label>
                <input type="number" min="0" max="100" className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none transition-all" value={builderTaxRate} onChange={(e) => setBuilderTaxRate(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-xs font-semibold text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-900">₹{itemsSubtotal.toLocaleString()}</span>
              </div>
              {builderDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({builderDiscount}%)</span>
                  <span>- ₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              {builderTaxRate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({builderTaxRate}%)</span>
                  <span className="text-slate-900">+ ₹{itemsTaxAmount.toLocaleString()}</span>
                </div>
              )}
              <hr className="border-slate-200/60 my-2" />
              <div className="flex justify-between items-baseline font-bold text-sm">
                <span className="text-slate-900 text-base">Total Amount</span>
                <span className="text-xl text-indigo-600 font-extrabold">₹{itemsFinalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">telegram</span>
                Deploy Invoice Document
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
          <h4 className="font-heading text-lg font-bold text-slate-900">Active Invoices Registry</h4>
          <div className="space-y-4">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col gap-3 hover:border-slate-200/80 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-950 text-xs">{inv.id}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{inv.client}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    inv.status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : inv.status === "sent"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-700"
                  }`}>{inv.status}</span>
                </div>
                <div className="flex justify-between items-end border-t border-slate-200/60 pt-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block">DUE DATE</span>
                    <span className="text-[10px] text-slate-600 font-bold">{inv.dueDate}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-sm font-extrabold text-slate-900 block">₹{inv.amount.toLocaleString()}</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => handleGenerateInvoicePDF(inv)}
                        className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] px-2.5 py-1 rounded-md font-bold hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[11px]">picture_as_pdf</span>
                        PDF
                      </button>
                      {inv.status === "sent" && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvoices(invoices.map(i => i.id === inv.id ? { ...i, status: "paid" } : i));
                            showToast(`Invoice ${inv.id} PAID.`, "success");
                          }}
                          className="bg-emerald-600 text-white text-[9px] px-2 py-1 rounded-md font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTab;
