import {useState} from 'react';
import {ExternalLink, MessageCircle, X} from 'lucide-react';
import {buildWhatsAppUrl} from '../shared/types';

export function WhatsAppContactWidget() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('Custom Print Inquiry');
  const [message, setMessage] = useState(
    'Hi Kroma Press, I have a question about custom T-shirt printing.',
  );

  const fullText = `[${topic}] ${message}`;
  const whatsappHref = buildWhatsAppUrl(fullText);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#09090B] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span className="text-xs font-semibold">
                Message Owner on WhatsApp
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp contact panel"
              className="w-7 h-7 rounded-md hover:bg-white/10 inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
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
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
              />
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full h-10 inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start Chat on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Contact store owner via WhatsApp"
        className="h-11 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-lg border border-zinc-800 inline-flex items-center gap-2 text-xs font-semibold transition-transform duration-150 hover:scale-[1.02] cursor-pointer whitespace-nowrap"
      >
        <MessageCircle className="w-4 h-4 text-[#25D366]" />
        <span>WhatsApp Owner</span>
      </button>
    </div>
  );
}
