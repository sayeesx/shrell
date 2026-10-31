import React from 'react';
import { MessageCircle } from 'lucide-react';
import { whatsAppService } from '../../features/whatsapp/WhatsAppService';

export const WhatsAppButton: React.FC = () => {
  return (
    <aside aria-label="Customer Support Assistance" className="fixed bottom-6 right-6 z-40">
      <a
        href={whatsAppService.getGeneralSupportLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-elevation transition-transform hover:scale-105 min-h-[44px] min-w-[44px]"
        aria-label="Chat with VAHN Automotive technical team on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 flex-shrink-0" />
        <span className="hidden sm:inline text-xs font-semibold font-mono tracking-wide">
          WhatsApp Desk
        </span>
      </a>
    </aside>
  );
};
