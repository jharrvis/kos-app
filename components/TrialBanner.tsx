'use client';

import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function TrialBanner() {
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const { subscription } = await response.json();
        if (subscription?.status === 'trial' && subscription.trial_ends_at) {
          setTrialEndsAt(subscription.trial_ends_at);
        }
      }
    };

    const isDismissed = localStorage.getItem('trialBannerDismissed');
    if (!isDismissed) {
      fetchSubscription();
    } else {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!trialEndsAt) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const end = new Date(trialEndsAt).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [trialEndsAt]);

  if (dismissed || !timeLeft || timeLeft.days > 7) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('trialBannerDismissed', 'true');
  };

  const isUrgent = timeLeft.days <= 3;
  const bgColor = isUrgent ? 'bg-red-500' : 'bg-yellow-400';
  const textColor = isUrgent ? 'text-white' : 'text-black';

  return (
    <div className={`sticky top-0 p-4 text-center relative ${bgColor} ${textColor}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <p className="font-semibold">
          Masa uji coba Premium berakhir dalam:
        </p>
        <div className="flex gap-2">
          {timeLeft.days > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">{timeLeft.days}</span>
              <span className="text-sm">hari</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold">{timeLeft.hours}</span>
            <span className="text-sm">jam</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold">{timeLeft.minutes}</span>
            <span className="text-sm">menit</span>
          </div>
        </div>
        <a
          href="/langganan"
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            isUrgent
              ? 'bg-white text-red-600 hover:bg-red-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Upgrade Sekarang
        </a>
      </div>
      <button
        onClick={handleDismiss}
        className={`absolute top-2 right-2 text-xl ${textColor} hover:opacity-75`}
      >
        ×
      </button>
    </div>
  );
}