import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, Bot, Clock, Sparkles, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "admin";
  text: string;
  timestamp: string;
}

interface ChatSession {
  sessionId: string;
  customerName: string;
  messages: ChatMessage[];
  lastUpdated: string;
  unreadByAdmin: boolean;
}

export const AdminChatManager: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all chat sessions
  const fetchSessions = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await fetch("/api/admin/chats");
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // Poll for sessions every 3 seconds to keep it fully synchronized
  useEffect(() => {
    fetchSessions(true);
    const interval = setInterval(() => fetchSessions(false), 3000);
    return () => clearInterval(interval);
  }, []);

  // Mark active session as read
  useEffect(() => {
    if (!activeSessionId) return;

    const markAsRead = async () => {
      try {
        await fetch("/api/admin/chats/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: activeSessionId }),
        });
        // Optimistically update local session state
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === activeSessionId ? { ...s, unreadByAdmin: false } : s
          )
        );
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    };

    markAsRead();
  }, [activeSessionId]);

  // Auto-scroll inside chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionId, sessions]);

  // Find currently active session
  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);

  // Send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId || !replyText.trim() || isSending) return;

    const textToSend = replyText;
    setReplyText("");
    setIsSending(true);

    try {
      const response = await fetch("/api/admin/chats/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, text: textToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        // Optimistically append the reply to state
        setSessions((prev) =>
          prev.map((s) => {
            if (s.sessionId === activeSessionId) {
              return {
                ...s,
                messages: [...s.messages, data.message],
                lastUpdated: new Date().toISOString(),
                unreadByAdmin: false,
              };
            }
            return s;
          })
        );
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs h-[600px] flex">
      {/* Sessions list (Left panel) */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-gray-200 bg-white shrink-0">
          <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-orange-500" />
            লাইভ চ্যাট মেসেজসমূহ
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">কাস্টমারদের সাথে সরাসরি চ্যাট করুন ও অটোমেটিক উত্তর দেখুন</p>
        </div>

        {/* Sessions scroll container */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {isLoading && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-xs font-semibold">মেসেজ লোড হচ্ছে...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-400 flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 text-gray-300 stroke-[1.5]" />
              <p className="text-xs font-bold">কোনো চ্যাট সেশন পাওয়া যায়নি।</p>
              <p className="text-[10px] text-gray-500">গ্রাহকেরা চ্যাট উইজেটে মেসেজ দিলে এখানে দেখা যাবে।</p>
            </div>
          ) : (
            sessions.map((session) => {
              const lastMessage = session.messages[session.messages.length - 1];
              return (
                <button
                  key={session.sessionId}
                  onClick={() => setActiveSessionId(session.sessionId)}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 border-l-4 cursor-pointer hover:bg-slate-100 ${
                    activeSessionId === session.sessionId
                      ? "bg-orange-50/70 border-orange-500"
                      : "border-transparent bg-white"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0 relative shadow-sm">
                    <User className="w-5 h-5" />
                    {session.unreadByAdmin && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                  </div>

                  {/* Info preview */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`text-xs font-black truncate max-w-[110px] ${
                        session.unreadByAdmin ? "text-slate-900" : "text-slate-700"
                      }`}>
                        {session.customerName}
                      </h4>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {formatTime(session.lastUpdated)}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate leading-tight ${
                      session.unreadByAdmin ? "text-orange-600 font-extrabold" : "text-gray-500 font-medium"
                    }`}>
                      {lastMessage ? (
                        <>
                          <span className="font-extrabold text-slate-400 mr-1">
                            {lastMessage.sender === "admin" ? "আপনি:" : lastMessage.sender === "bot" ? "AI:" : ""}
                          </span>
                          {lastMessage.text}
                        </>
                      ) : (
                        "কোনো মেসেজ নেই"
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat view (Right panel) */}
      <div className="flex-grow flex flex-col bg-slate-50">
        {activeSession ? (
          <>
            {/* Active Session Header */}
            <div className="px-5 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 text-[#006437] flex items-center justify-center font-bold text-xs relative">
                  <User className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-800">{activeSession.customerName}</h3>
                  <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5">
                    <span>সেশন আইডি:</span>
                    <span className="font-mono text-slate-500">{activeSession.sessionId}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[80%] ${
                    msg.sender === "admin" ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                  }`}
                >
                  {/* Sender Icon */}
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === "admin"
                        ? "bg-orange-100 border-orange-200 text-orange-600"
                        : msg.sender === "bot"
                        ? "bg-emerald-50 border-emerald-100 text-[#006437]"
                        : "bg-gray-100 border-gray-200 text-gray-600"
                    }`}
                  >
                    {msg.sender === "admin" ? (
                      <User className="w-4 h-4" />
                    ) : msg.sender === "bot" ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        msg.sender === "admin"
                          ? "bg-orange-500 text-white rounded-tr-none"
                          : msg.sender === "bot"
                          ? "bg-[#006437] text-white rounded-tl-none"
                          : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {/* Name tags inside bubbles to make it ultra-clear */}
                      <span className="text-[9px] font-black opacity-80 block mb-1">
                        {msg.sender === "admin" ? "আপনি (অ্যাডমিন)" : msg.sender === "bot" ? "AI সহকারী" : "কাস্টমার"}
                      </span>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 self-end font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Manual Reply Form */}
            <form
              onSubmit={handleSendReply}
              className="p-4 bg-white border-t border-gray-200 flex gap-2 items-center shrink-0 shadow-lg"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="এখানে উত্তরটি লিখুন (যেমন: 'অবশ্যই ভাই, আমাদের প্রতিনিধি কিছুক্ষণের মধ্যেই আপনাকে কল দিচ্ছে...')"
                className="flex-grow px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-orange-500 font-bold"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>উত্তর পাঠান</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8 text-orange-500 stroke-[1.5]" />
            </div>
            <h4 className="font-extrabold text-sm text-gray-700 mb-1">কোনো মেসেজ সিলেক্ট করা হয়নি</h4>
            <p className="text-xs text-gray-500 font-semibold">গ্রাহকের লাইভ মেসেজ বা প্রশ্ন দেখতে বামপাশের লিস্ট থেকে যেকোনো একটি চ্যাট সেশন নির্বাচন করুন।</p>
          </div>
        )}
      </div>
    </div>
  );
};
