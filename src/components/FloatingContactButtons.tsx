import { usePublicContactSettings } from '@/hooks/useContactSettings';
import { motion } from 'framer-motion';
import { MessageCircle, Instagram } from 'lucide-react';

interface Props {
  gymId: string | undefined;
}

export function FloatingContactButtons({ gymId }: Props) {
  const { data: contactSettings } = usePublicContactSettings(gymId);

  if (!contactSettings) return null;

  const hasWhatsApp = !!contactSettings.whatsapp_number;
  const hasInstagram = !!contactSettings.instagram_url;

  if (!hasWhatsApp && !hasInstagram) return null;

  const whatsappUrl = hasWhatsApp
    ? `https://wa.me/${contactSettings.whatsapp_number}${contactSettings.whatsapp_message ? `?text=${encodeURIComponent(contactSettings.whatsapp_message)}` : ''}`
    : '';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {hasInstagram && (
        <motion.a
          href={contactSettings.instagram_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/25 hover:scale-110 transition-transform duration-200"
          style={{
            background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          aria-label="Contact us on Instagram"
        >
          <Instagram className="h-6 w-6 text-white" />
        </motion.a>
      )}
      {hasWhatsApp && (
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-14 w-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-transform duration-200"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          aria-label="Contact us on WhatsApp"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </motion.a>
      )}
    </div>
  );
}
