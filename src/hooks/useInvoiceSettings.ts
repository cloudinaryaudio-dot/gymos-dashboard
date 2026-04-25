import { useEffect, useState, useCallback } from 'react';

export interface InvoiceSettings {
  gym_name: string;
  address: string;
  contact_number: string;
  email: string;
  logo_url: string;
  footer_text: string;
  terms: string;
  thank_you_message: string;
  show_logo: boolean;
  show_email: boolean;
  show_address: boolean;
  show_terms: boolean;
  show_footer: boolean;
}

const STORAGE_KEY = 'gymos_invoice_settings_v1';

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  gym_name: 'GymOS Fitness Center',
  address: '123 Fitness Street, Mumbai, India - 400001',
  contact_number: '+91 98765 43210',
  email: 'contact@gymos.com',
  logo_url: '',
  footer_text: 'This is a computer-generated invoice.',
  terms: '1. Membership fees are non-refundable.\n2. Please retain this invoice for your records.\n3. Subject to gym terms & conditions.',
  thank_you_message: 'Thank you for choosing us! Stay strong, stay fit. 💪',
  show_logo: true,
  show_email: true,
  show_address: true,
  show_terms: true,
  show_footer: true,
};

function read(): InvoiceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INVOICE_SETTINGS;
    return { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_INVOICE_SETTINGS;
  }
}

export function useInvoiceSettings() {
  const [settings, setSettings] = useState<InvoiceSettings>(() => read());

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(read());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const save = useCallback((next: InvoiceSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSettings(next);
  }, []);

  return { settings, save };
}

export function getInvoiceSettings(): InvoiceSettings {
  return read();
}
