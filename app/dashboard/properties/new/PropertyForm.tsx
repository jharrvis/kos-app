"use client";

import { useState } from "react";
import ProvinceSelector from "@/components/ProvinceSelector";
import CitySelector from "@/components/CitySelector";
import { useRouter } from "next/navigation";
import MapPicker from '@/components/MapPicker';
import PropertyLimitIndicator from '@/components/PropertyLimitIndicator';

const PropertyForm = () => {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    province_id: "",
    city_id: "",
    latitude: "" as string | number,
    longitude: "" as string | number,
    price: "",
    room_type: "single",
    capacity: "",
    facilities: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFacilitiesChange = (facility: string) => {
    setFormData((prev) => {
      const facilities = prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility];
      return { ...prev, facilities };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters long.";
    }
    if (!formData.address || formData.address.length < 20) {
      newErrors.address = "Address must be at least 20 characters long.";
    }
    if (!formData.province_id) {
      newErrors.province_id = "Province is required.";
    }
    if (!formData.city_id) {
      newErrors.city_id = "City is required.";
    }
    if (!formData.price || Number(formData.price) < 100000) {
      newErrors.price = "Price must be at least 100,000 Rupiah.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      alert("Property created! Redirecting...");
      router.push("/dashboard/properties");
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Create New Property</h1>

      {apiError && <div className="mb-4 p-2 bg-red-100 text-red-700">{apiError}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
        </div>

        <ProvinceSelector
          value={formData.province_id}
          onChange={(value) => setFormData((prev) => ({ ...prev, province_id: value }))}
          required
        />
        {errors.province_id && <p className="text-red-600 text-sm mt-1">{errors.province_id}</p>}

        <CitySelector
          provinceId={formData.province_id}
          value={formData.city_id}
          onChange={(value) => setFormData((prev) => ({ ...prev, city_id: value }))}
          required
        />
        {errors.city_id && <p className="text-red-600 text-sm mt-1">{errors.city_id}</p>}

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (Rupiah per month)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
        </div>

        <button
          type="button"
          onClick={() => setShowMapPicker(!showMapPicker)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          {showMapPicker ? 'Hide Map' : 'Choose Location on Map'}
        </button>

        {showMapPicker && (
          <MapPicker
            latitude={Number(formData.latitude) || -6.2088}
            longitude={Number(formData.longitude) || 106.8456}
            onChange={(lat, lng) => {
              setFormData({ ...formData, latitude: lat, longitude: lng })
            }}
          />
        )}

        <PropertyLimitIndicator />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? "Submitting..." : "Create Property"}
        </button>
      </form>
    </div>
  );
};

export default PropertyForm;