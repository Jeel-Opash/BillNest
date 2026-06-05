import React, { useState, useEffect, useRef } from "react";

const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const AIAssistant = ({
  user,
  clients = [],
  invoices = [],
  subscriptions = [],
  payments = [],
  onCreateDraftInvoice,
  showToast
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "ai",
      text: `Hello ${user?.name || "there"}! I'm your BillNest Copilot. I have access to your workspace telemetry. What would you like to know today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        "📊 Summarize total revenue",
        "🔄 Check MRR & subscriptions",
        "⚠️ Who has outstanding invoices?",
        "➕ Draft invoice for Pixel Creative Labs of ₹15,000"
      ]
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const addMessage = (sender, text, suggestions = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions
      }
    ]);
  };

  const processQuery = (query) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const cleanQuery = query.toLowerCase().trim();

      // 1. DRAFT INVOICE CREATION REGEX MATCH
      const draftRegex = /(?:draft|create)\s+invoice\s+for\s+([^of]+?)(?:\s+of\s+(?:rs\.?|inr|₹)?\s*([\d,]+))?$/i;
      const match = cleanQuery.match(draftRegex);

      if (match) {
        const clientNameRaw = match[1].trim();
        const amountStr = match[2] ? match[2].replace(/,/g, "") : "10000";
        const amount = parseFloat(amountStr) || 10000;

        // Try to match with an existing client company
        const matchedClient = clients.find(
          c => c.company.toLowerCase().includes(clientNameRaw.toLowerCase()) || 
               c.name.toLowerCase().includes(clientNameRaw.toLowerCase())
        );

        const finalClientName = matchedClient ? matchedClient.company : clientNameRaw;

        if (onCreateDraftInvoice) {
          onCreateDraftInvoice(finalClientName, amount);
          addMessage(
            "ai",
            `Done! I have created a new draft invoice (${formatCurrency(amount)}) for **${finalClientName}** and switched you to the Invoices panel. You can finalize it now.`
          );
        } else {
          addMessage(
            "ai",
            `I parsed your request to create a draft invoice for **${finalClientName}** of **${formatCurrency(amount)}**, but the billing pipeline handler is currently busy. Please try again.`
          );
        }
        return;
      }

      // 2. REVENUE STATUS
      if (cleanQuery.includes("revenue") || cleanQuery.includes("income") || cleanQuery.includes("sales") || cleanQuery.includes("earn")) {
        const totalRev = invoices
          .filter(inv => inv.status?.toLowerCase() === "paid")
          .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

        const paidCount = invoices.filter(inv => inv.status?.toLowerCase() === "paid").length;
        const totalCount = invoices.length;

        addMessage(
          "ai",
          `Here is your revenue summary for **${user?.organization?.name || "your workspace"}**:\n\n` +
          `• **Total Paid Income:** ${formatCurrency(totalRev)}\n` +
          `• **Paid Invoices:** ${paidCount} / ${totalCount} total invoices cleared.\n\n` +
          `Would you like to export these numbers or see subscription breakdown?`
        );
        return;
      }

      // 3. MRR & SUBSCRIPTIONS
      if (cleanQuery.includes("mrr") || cleanQuery.includes("recurring") || cleanQuery.includes("subscription")) {
        const activeSubs = subscriptions.filter(sub => sub.status?.toLowerCase() === "active");
        const mrr = activeSubs.reduce((sum, sub) => {
          const price = Number(sub.price) || 0;
          return sum + (sub.cycle === "yearly" ? price / 12 : price);
        }, 0);

        addMessage(
          "ai",
          `Your subscription statistics show:\n\n` +
          `• **Current MRR:** ${formatCurrency(mrr)}\n` +
          `• **Active Subscription Contracts:** ${activeSubs.length} running\n\n` +
          `Most subscription payments are automatically processed via Stripe test credentials.`
        );
        return;
      }

      // 4. UNPAID / OUTSTANDING / OVERDUE
      if (cleanQuery.includes("unpaid") || cleanRegexMatch(cleanQuery, ["pending", "outstanding", "overdue", "owe"])) {
        const outstandingInvoices = invoices.filter(inv => 
          ["sent", "pending", "overdue"].includes(inv.status?.toLowerCase())
        );
        
        const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

        // Find client with highest outstanding
        const clientDebt = {};
        outstandingInvoices.forEach(inv => {
          clientDebt[inv.client] = (clientDebt[inv.client] || 0) + Number(inv.amount);
        });

        let worstDebtor = "";
        let maxDebt = 0;
        Object.entries(clientDebt).forEach(([name, debt]) => {
          if (debt > maxDebt) {
            maxDebt = debt;
            worstDebtor = name;
          }
        });

        let responseText = `You have **${outstandingInvoices.length} outstanding invoices** totaling **${formatCurrency(outstandingTotal)}**:\n\n`;
        
        if (worstDebtor) {
          responseText += `• **Highest Outstanding:** ${worstDebtor} owes ${formatCurrency(maxDebt)}.\n\n`;
        }

        responseText += `I recommend sending automated reminders or setting up recurring subscription drafts to secure these balances.`;

        addMessage("ai", responseText);
        return;
      }

      // 5. CLIENTS / CUSTOMERS
      if (cleanQuery.includes("client") || cleanQuery.includes("customer")) {
        addMessage(
          "ai",
          `You currently have **${clients.length} registered clients** in your workspace.\n\n` +
          `The top client by gross historical volume is **${clients[0]?.company || "Pixel Creative Labs"}**.\n` +
          `You can view specific logs or invite teammates under the Team members tab.`
        );
        return;
      }

      // 6. DEFAULT FALLBACK
      addMessage(
        "ai",
        "I'm here to analyze your workspace metrics and automate billing actions. You can ask me to:\n" +
        "• Summarize revenue or MRR\n" +
        "• Look up outstanding bills\n" +
        "• Draft a new invoice (e.g. \"Draft invoice for Nova Tech of ₹8500\")",
        [
          "📊 Summarize total revenue",
          "🔄 Check MRR & subscriptions",
          "⚠️ Who has outstanding invoices?"
        ]
      );

    }, 800);
  };

  const cleanRegexMatch = (str, keywords) => {
    return keywords.some(keyword => str.includes(keyword));
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;

    const query = inputVal;
    addMessage("user", query);
    setInputVal("");
    processQuery(query);
  };

  const handleSuggestionClick = (suggestion) => {
    // Strip emojis
    const cleanText = suggestion.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
    addMessage("user", cleanText);
    processQuery(cleanText);
  };

  return (
    <div className="fixed bottom-6 right-24 z-50 font-sans">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 outline-none relative group border border-indigo-400/20"
      >
        <span className="material-symbols-outlined text-[26px]">
          {isOpen ? "close" : "smart_toy"}
        </span>
        
        {/* Pulsing indicator */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
            1
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[360px] h-[480px] bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wide leading-tight">BillNest Copilot</h4>
                <p className="text-[9px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active isolation scope
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-semibold whitespace-pre-line shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Meta details */}
                <span className="text-[8px] font-bold text-slate-400 px-1">{msg.time}</span>

                {/* Suggestions / Quick Actions */}
                {msg.suggestions && (
                  <div className="flex flex-wrap gap-1.5 pt-2 max-w-[95%]">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[9px] px-2.5 py-1.5 rounded-xl transition-all shadow-sm hover:border-slate-300 text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Simulated typing placeholder */}
            {isTyping && (
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-500"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-500 delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-500 delay-200"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Ask Copilot or create draft..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none transition-all placeholder-slate-400"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default AIAssistant;
