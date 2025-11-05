'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import PaymentForm from '@/components/PaymentForm';

export default function Page() {
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [bankLinked, setBankLinked] = useState(false);
  const [plaidToken, setPlaidToken] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('plaid_access_token');
    if (saved) {
      setPlaidToken(saved);
      setBankLinked(true);
    }
  }, []);

  const handleBankLinked = (token: string) => {
    localStorage.setItem('plaid_access_token', token);
    setPlaidToken(token);
    setBankLinked(true);
  };

  const handlePaymentComplete = () => {
    // TODO: toast/redirect/etc
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/ahitrooper_white1.png"
              alt="Logo"
              width={200}
              height={80}
              priority
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Powered by High Seas Hawaii Media Group Inc
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />
          <p className="text-gray-400 text-sm uppercase tracking-widest">
            Payment Portal
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-8 md:p-12">
            {!bankLinked && paymentMethod === 'bank' ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-light text-white mb-4">First Time Setup</h2>
                <p className="text-gray-400 mb-12 max-w-md mx-auto">
                  Securely link your bank account to get started. This is a one-time setup that
                  takes less than a minute.
                </p>
                {/* Your Plaid Link button should call handleBankLinked(token) */}
              </div>
            ) : (
              <PaymentForm
                plaidToken={plaidToken}
                paymentMethod={paymentMethod}
                onPaymentComplete={handlePaymentComplete}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
