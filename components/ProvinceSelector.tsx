"use client";

import { useEffect, useState } from "react";

interface Province {
  id: string;
  name: string;
  slug: string;
}

interface ProvinceSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const ProvinceSelector: React.FC<ProvinceSelectorProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/locations/provinces");
        if (!response.ok) {
          throw new Error("Failed to fetch provinces");
        }
        const data: Province[] = await response.json();
        setProvinces(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  return (
    <div className="w-full">
      <label
        htmlFor="province-selector"
        className="block text-sm font-medium text-gray-700"
      >
        Province
      </label>
      <select
        id="province-selector"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled || loading}
        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        aria-describedby={error ? "province-error" : undefined}
      >
        <option value="">Select a province</option>
        {provinces.map((province) => (
          <option key={province.id} value={province.id}>
            {province.name}
          </option>
        ))}
      </select>
      {loading && <p className="mt-2 text-sm text-gray-500">Loading provinces...</p>}
      {error && (
        <p id="province-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default ProvinceSelector;