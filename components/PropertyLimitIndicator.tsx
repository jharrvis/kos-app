'use client';

import { useEffect, useState } from 'react';

export default function PropertyLimitIndicator() {
  const [propertyCount, setPropertyCount] = useState(0);
  const [maxProperties, setMaxProperties] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const subscription = await response.json();
        setMaxProperties(subscription.features.max_properties || 0);
      }

      const propertyResponse = await fetch('/api/properties/count');
      if (propertyResponse.ok) {
        const { count } = await propertyResponse.json();
        setPropertyCount(count);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="mb-4">
      <p>
        {propertyCount}/{maxProperties} properti digunakan
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${(propertyCount / maxProperties) * 100}%` }}
        ></div>
      </div>
      {propertyCount >= maxProperties && (
        <p className="text-red-500 mt-2">
          Anda telah mencapai batas properti.{' '}
          <a href="/langganan" className="underline">
            Upgrade untuk menambah properti.
          </a>
        </p>
      )}
    </div>
  );
}