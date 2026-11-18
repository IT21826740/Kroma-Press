import type React from 'react';
import {useEffect, useState} from 'react';
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import {buildWhatsAppUrl, type DemoInquiry} from '../shared/types';

interface WhatsAppContactWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillTopic?: string;
  prefillMessage?: string;
  ownerWhatsAppNumber?: string;
  inquiries: DemoInquiry[];
  onSendDemoInquiry: (topic: string, message: string) => void;
}

export function WhatsAppContactWidget({
  open,
  onOpenChange,
  prefillTopic,
  prefillMessage,
  ownerWhatsAppNumber,
  inquiries,
  onSendDemoInquiry,
}: WhatsAppContactWidgetProps) {
  const [topic, setTopic] = useState(prefillTopic || 'Custom Print Inquiry');
  const [message, setMessage] = useState(
    prefillMessage ||
      'Hi Kroma Press, I have a question about custom T-shirt printing.',
  );
  const [sentNotice, setSentNotice] = useState(false);

  useEffect(() => {
    if (prefillTopic) setTopic(prefillTopic);
    if (prefillMessage) setMessage(prefillMessage);
  }, [prefillTopic, prefillMessage]);

  const fullText = `[${topic}] ${message}`;
  const whatsappHref = buildWhatsAppUrl(fullText, ownerWhatsAppNumber);
  const hasRealWhatsApp = Boolean(whatsappHref);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendDemoInquiry(topic, message.trim());
    setMessage('');
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#09090B] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span className="text-xs font-semibold">
                {hasRealWhatsApp
                  ? 'Message Owner on WhatsApp'
                  : 'Studio Support (Demo Mode)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close support contact panel"
              className="w-7 h-7 rounded-md hover:bg-white/10 inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleDemoSubmit} className="p-4 space-y-3">
            {!hasRealWhatsApp && (
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
                Running in <strong className="text-zinc-900">Demo Mode</strong>. Messages sent here appear immediately in the Admin Portal inbox (or add a real WhatsApp number in Admin Settings).
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
              >
                <option value="Custom Print Inquiry">Custom Print Inquiry</option>
                <option value="Order Delivery & Tracking">
                  Order Delivery &amp; Tracking
                </option>
                <option value="Bulk / Studio Run Quote">
                  Bulk / Studio Run Quote
                </option>
                <option value="Sizing & Fabric Help">
                  Sizing &amp; Fabric Help
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Your Message
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about sizing, custom artwork, or an order..."
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
              />
            </div>

            {sentNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Demo message sent to Studio Owner inbox.</span>
              </div>
            )}

            {!hasRealWhatsApp && inquiries.length > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-1.5 pt-1 border-t border-zinc-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Recent Demo Messages
                </p>
                {inquiries.slice(0, 3).map((inq) => (
                  <div
                    key={inq.id}
                    className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px]"
                  >
                    <p className="font-semibold text-zinc-900">{inq.topic}</p>
                    <p className="text-zinc-600 line-clamp-2">{inq.message}</p>
                  </div>
                ))}
              </div>
            )}

            {hasRealWhatsApp ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenChange(false)}
                className="w-full h-10 inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Start Chat on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="submit"
                className="w-full h-10 inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Demo Message</span>
              </button>
            )}
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label="Contact store owner"
        className="h-11 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-lg border border-zinc-800 inline-flex items-center gap-2 text-xs font-semibold transition-transform duration-150 hover:scale-[1.02] cursor-pointer whitespace-nowrap"
      >
        <MessageCircle className="w-4 h-4 text-[#25D366]" />
        <span>{hasRealWhatsApp ? 'WhatsApp Owner' : 'Studio Support'}</span>
      </button>
    </div>
  );
}
