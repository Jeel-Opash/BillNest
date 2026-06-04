import React, { useState, useEffect } from "react";

const formatCardNumber = (value) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length > 0) {
    return parts.join(" ");
  } else {
    return v;
  }
};

const formatExpiry = (value) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  if (v.length >= 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
  }
  return v;
};

const StripeCheckoutModal = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
  onFailure
}) => {
  if (!isOpen || !invoice) return null;

  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Simulation states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | success | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Autocomplete client email if present
    if (invoice.clientEmail) {
      setEmail(invoice.clientEmail);
    } else {
      // Mock lookup based on standard names
      if (invoice.client?.includes("ABC")) {
        setEmail("owner@abcrestaurant.com");
      } else if (invoice.client?.includes("Pixel")) {
        setEmail("finance@pixelstudio.com");
      } else if (invoice.client?.includes("Nova")) {
        setEmail("billing@novatech.com");
      } else {
        setEmail("accounting@client-entity.com");
      }
    }
  }, [invoice]);

  // Card brand detector
  const getCardBrand = (number) => {
    const cleanNumber = number.replace(/\s+/g, "");
    if (cleanNumber.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cleanNumber)) return "Mastercard";
    if (/^3[47]/.test(cleanNumber)) return "Amex";
    if (cleanNumber.startsWith("6")) return "Discover";
    return "Unknown";
  };

  const cardBrand = getCardBrand(cardNumber);

  // Quick fill helper
  const handleQuickFill = (type) => {
    setName(type === "success" ? "Jane Doe" : type === "insufficient" ? "John Smith" : type === "stolen" ? "Bob Miller" : "Alice Green");
    setCardNumber(
      type === "success" 
        ? "4242 4242 4242 4242" 
        : type === "insufficient" 
        ? "4000 0020 0000 0000" 
        : type === "stolen" 
        ? "4000 0002 0000 0000" 
        : "4000 0001 0000 0000"
    );
    setExpiry(type === "expired" ? "01/24" : "12/28");
    setCvc("123");
    setZip("395003");
    setErrorMessage("");
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s+/g, "").length < 16) {
      setErrorMessage("Please enter a valid 16-digit card number.");
      return;
    }
    if (expiry.length < 5) {
      setErrorMessage("Please enter expiry in MM/YY format.");
      return;
    }
    if (cvc.length < 3) {
      setErrorMessage("Please enter a valid CVC code.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    // Simulate network delay
    setTimeout(() => {
      const cleanNum = cardNumber.replace(/\s+/g, "");
      
      if (cleanNum === "4242424242424242") {
        // Success path
        setPaymentStatus("success");
        setIsProcessing(false);
        setTimeout(() => {
          onSuccess({
            txnId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            method: `Stripe Card (${cardBrand})`,
            date: new Date().toISOString().split("T")[0],
            amount: invoice.amount,
            client: invoice.client,
            invoice: invoice.id
          });
          onClose();
          setPaymentStatus("idle");
          setCardNumber("");
          setExpiry("");
          setCvc("");
          setName("");
        }, 3000);
      } else if (cleanNum === "4000002000000000") {
        // Insufficient funds
        setPaymentStatus("error");
        setIsProcessing(false);
        setErrorMessage("Your card has insufficient funds. (Decline code: insufficient_funds)");
        onFailure({
          code: "card_declined",
          decline_code: "insufficient_funds",
          message: "The card has insufficient funds to complete this transaction.",
          amount: invoice.amount,
          client: invoice.client,
          invoice: invoice.id
        });
      } else if (cleanNum === "4000000200000000") {
        // Stolen Card
        setPaymentStatus("error");
        setIsProcessing(false);
        setErrorMessage("This card has been reported stolen. (Decline code: stolen_card)");
        onFailure({
          code: "card_declined",
          decline_code: "stolen_card",
          message: "The transaction was declined because the card is reported stolen.",
          amount: invoice.amount,
          client: invoice.client,
          invoice: invoice.id
        });
      } else if (cleanNum === "4000000100000000" || expiry === "01/24") {
        // Expired Card
        setPaymentStatus("error");
        setIsProcessing(false);
        setErrorMessage("Your card has expired. (Decline code: expired_card)");
        onFailure({
          code: "card_declined",
          decline_code: "expired_card",
          message: "The card has expired. Please check expiration parameters.",
          amount: invoice.amount,
          client: invoice.client,
          invoice: invoice.id
        });
      } else {
        // Generic success for other numbers to keep it user-friendly
        setPaymentStatus("success");
        setIsProcessing(false);
        setTimeout(() => {
          onSuccess({
            txnId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            method: `Stripe Card (${cardBrand === "Unknown" ? "Visa" : cardBrand})`,
            date: new Date().toISOString().split("T")[0],
            amount: invoice.amount,
            client: invoice.client,
            invoice: invoice.id
          });
          onClose();
          setPaymentStatus("idle");
          setCardNumber("");
          setExpiry("");
          setCvc("");
          setName("");
        }, 3000);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row relative min-h-[580px] animate-fade-in text-slate-700">
        
        {/* Absolute close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:right-auto md:left-4 z-50 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full p-2.5 transition-all outline-none flex items-center justify-center cursor-pointer"
          title="Cancel Payment"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>

        {/* LEFT COLUMN: Summary (Dark theme) */}
        <div className="w-full md:w-5/12 bg-slate-900 text-white p-8 flex flex-col justify-between border-r border-slate-800">
          <div className="mt-8 space-y-6">
            
            {/* Merchant Identity */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
                BN
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">BillNest Merchant Portal</span>
            </div>

            {/* Invoicing summary details */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black tracking-widest uppercase text-slate-400">Paying Invoiced Order</span>
              <h2 className="text-lg font-black text-slate-100">{invoice.id}</h2>
              <p className="text-xs text-slate-400 font-medium">Clearance of professional billing balance</p>
            </div>

            {/* Huge Amount Visual */}
            <div className="py-4 border-y border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Amount Due</span>
              <h1 className="text-3xl font-black text-indigo-400">₹{invoice.amount.toLocaleString()}</h1>
            </div>

            {/* Line items mini roster */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider">Services Purchased</span>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-medium text-slate-300">
                    <span className="truncate max-w-[150px]">{it.desc} (x{it.qty})</span>
                    <span className="font-bold">₹{(it.qty * it.price).toLocaleString()}</span>
                  </div>
                ))
              ) : invoice.itemsList && invoice.itemsList.length > 0 ? (
                invoice.itemsList.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-medium text-slate-300">
                    <span className="truncate max-w-[150px]">{it.desc} (x{it.qty})</span>
                    <span className="font-bold">₹{(it.qty * it.price).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center text-xs font-medium text-slate-300">
                  <span>General Services Billing</span>
                  <span className="font-bold">₹{invoice.amount.toLocaleString()}</span>
                </div>
              )}
            </div>

          </div>

          {/* Secure details footer */}
          <div className="pt-6 border-t border-slate-800 flex items-center gap-2.5 text-[10px] text-slate-500 font-semibold mt-6">
            <span className="material-symbols-outlined text-[16px] text-indigo-400">lock</span>
            <span>Secure 256-bit SSL transaction verified by Stripe.</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Stripe Inputs */}
        <div className="w-full md:w-7/12 p-8 bg-white flex flex-col justify-between relative">
          
          {/* Main content body */}
          <div className="my-auto space-y-6">
            
            {/* Heading */}
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-black text-slate-900 tracking-tight">Pay with Card</h3>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Test Sandbox</span>
              </div>
            </div>

            {/* Quick-fill shortcuts */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
              <span className="block text-[9px] font-black uppercase text-indigo-600 tracking-wider">Simulated Cards Quick-Fill</span>
              <div className="flex flex-wrap gap-2 pt-1 select-none">
                <button 
                  type="button" 
                  onClick={() => handleQuickFill("success")}
                  className="bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  Success Card
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill("insufficient")}
                  className="bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  Declined (Funds)
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill("expired")}
                  className="bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  Declined (Expired)
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill("stolen")}
                  className="bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  Declined (Stolen)
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs font-semibold">
              
              {/* Email */}
              <div>
                <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Email address</label>
                <input 
                  type="email"
                  required
                  placeholder="billing@client.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Card Information */}
              <div>
                <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Card Information</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    maxLength="19"
                    placeholder="Card Number (4242 4242...)"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-t-xl p-2.5 pl-10 text-xs font-bold outline-none transition-colors"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">credit_card</span>
                  
                  {/* Brand badge */}
                  {cardBrand !== "Unknown" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase select-none">
                      {cardBrand}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2">
                  <input 
                    type="text"
                    required
                    maxLength="5"
                    placeholder="MM / YY"
                    className="w-full bg-slate-50 border-x border-b border-slate-200 focus:bg-white focus:border-indigo-600 rounded-bl-xl p-2.5 text-xs font-bold outline-none transition-colors"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  />
                  <input 
                    type="password"
                    required
                    maxLength="4"
                    placeholder="CVC"
                    className="w-full bg-slate-50 border-r border-b border-slate-200 focus:bg-white focus:border-indigo-600 rounded-br-xl p-2.5 text-xs font-bold outline-none transition-colors"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
              </div>

              {/* Name on Card */}
              <div>
                <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Cardholder name</label>
                <input 
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Country & Postal Code</label>
                <div className="grid grid-cols-2 gap-2">
                  <select className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer">
                    <option>India (IN)</option>
                    <option>United States (US)</option>
                    <option>Germany (DE)</option>
                    <option>United Kingdom (UK)</option>
                  </select>
                  <input 
                    type="text"
                    required
                    placeholder="ZIP / Postal"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl p-2.5 text-xs font-bold outline-none transition-colors"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  />
                </div>
              </div>

              {/* Remember user checkbox */}
              <div className="flex items-center gap-2 select-none pt-1">
                <input 
                  type="checkbox"
                  id="remember-stripe"
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-stripe" className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">Remember me for future transactions</label>
              </div>

              {/* Error block */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold leading-relaxed flex items-start gap-2 animate-shake">
                  <span className="material-symbols-outlined text-[16px] text-rose-500 mt-0.5">error_outline</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-100/50 cursor-pointer flex items-center justify-center gap-2 outline-none mt-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing secure txn...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Pay ₹{invoice.amount.toLocaleString()}</span>
                  </>
                )}
              </button>

            </form>

          </div>

          {/* Stripe branding footer */}
          <div className="text-[9px] text-slate-400 font-semibold text-center select-none pt-4 border-t border-slate-50 flex items-center justify-center gap-1.5 mt-4">
            <span>Powered by</span>
            <span className="font-extrabold text-slate-600">stripe</span>
            <span>|</span>
            <a href="#" className="hover:underline">Terms</a>
            <span>|</span>
            <a href="#" className="hover:underline">Privacy</a>
          </div>

          {/* ==================== SCREEN OVERLAY: SUCCESS ==================== */}
          {paymentStatus === "success" && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-md animate-bounce mb-6">
                <span className="material-symbols-outlined text-[42px] font-black">check_circle</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Payment Succeeded!</h2>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mt-1">Transaction Captured</p>
              
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-4 max-w-sm">
                Thank you for your clearance. We've verified and cryptographically recorded the transaction. You're being returned to the merchant site.
              </p>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl w-full max-w-xs space-y-1.5 text-left mt-6 font-mono text-[10px] text-slate-500 font-bold">
                <div className="flex justify-between">
                  <span>Merchant:</span>
                  <span className="text-slate-900 font-semibold">BillNest SaaS</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice ID:</span>
                  <span className="text-slate-900 font-semibold">{invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Pay:</span>
                  <span className="text-slate-900 font-semibold">₹{invoice.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default StripeCheckoutModal;
