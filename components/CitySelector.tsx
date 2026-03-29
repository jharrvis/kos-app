"use client";

import { useEffect, useState } from "react";

interface City {
  id: string;
  province_id: string;
  name: string;
  slug: string;
  type: "kota" | "kabupaten";
}

interface CitySelectorProps {
  provinceId: string | undefined;
  value: string | undefined;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  provinceId,
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/locations/cities?province_id=${provinceId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }
        const data: City[] = await response.json();
        setCities(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [provinceId]);

  return (
    <div className="w-full">
      <label
        htmlFor="city-selector"
        className="block text-sm font-medium text-gray-700"
      >
        City
      </label>
      <select
        id="city-selector"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled || loading || !provinceId}
        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        aria-describedby={error ? "city-error" : undefined}
      >
        <option value="">Select a city</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name} ({city.type})
          </option>
        ))}
      </select>
      {loading && <p className="mt-2 text-sm text-gray-500">Loading cities...</p>}
      {error && (
        <p id="city-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default CitySelector;