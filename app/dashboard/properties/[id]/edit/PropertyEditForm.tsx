'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProvinceSelector from '@/components/ProvinceSelector';
import CitySelector from '@/components/CitySelector';
import MapPicker from '@/components/MapPicker';

export default function PropertyEditForm({ property }: { property: any }) {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: property.title || '',
    description: property.description || '',
    address: property.address || '',
    province_id: property.province_id || '',
    city_id: property.city_id || '',
    latitude: property.latitude || '',
    longitude: property.longitude || '',
    price: property.price || '',
    room_type: property.room_type || 'single',
    capacity: property.capacity || '',
    facilities: property.facilities || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFacilityChange = (facility: string) => {
    const currentFacilities = formData.facilities;
    if (currentFacilities.includes(facility)) {
      setFormData({
        ...formData,
        facilities: currentFacilities.filter((f: string) => f !== facility),
      });
    } else {
      setFormData({
        ...formData,
        facilities: [...currentFacilities, facility],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.province_id || !formData.city_id) {
      setError('Please select province and city');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          address: formData.address,
          province_id: formData.province_id,
          city_id: formData.city_id,
          latitude: formData.latitude ? parseFloat(formData.latitude as string) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude as string) : null,
          price: parseInt(formData.price as string),
          room_type: formData.room_type,
          capacity: formData.capacity ? parseInt(formData.capacity as string) : null,
          facilities: formData.facilities,
        }),
      });

      if (response.ok) {
        alert('Property updated successfully!');
        router.push('/dashboard/properties');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update property');
      }
    } catch (err) {
      setError('Failed to update property. Please try again.');
      console.error('Update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={10}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={1000}
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Full Address *
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={20}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
          <ProvinceSelector
            value={formData.province_id}
            onChange={(value) => setFormData({ ...formData, province_id: value, city_id: '' })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
          <CitySelector
            provinceId={formData.province_id}
            value={formData.city_id}
            onChange={(value) => setFormData({ ...formData, city_id: value })}
          />
        </div>
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
          latitude={formData.latitude || -6.2088}
          longitude={formData.longitude || 106.8456}
          onChange={(lat, lng) => {
            setFormData({ ...formData, latitude: lat, longitude: lng })
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price (Rp/month) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="100000"
          />
        </div>

        <div>
          <label htmlFor="room_type" className="block text-sm font-medium text-gray-700 mb-2">
            Room Type *
          </label>
          <select
            id="room_type"
            name="room_type"
            value={formData.room_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="single">Single</option>
            <option value="shared">Shared</option>
            <option value="studio">Studio</option>
            <option value="apartment">Apartment</option>
          </select>
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
            Capacity (persons)
          </label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['wifi', 'ac', 'parking', 'kitchen', 'laundry', 'security'].map((facility) => (
            <label key={facility} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.facilities.includes(facility)}
                onChange={() => handleFacilityChange(facility)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm capitalize">{facility}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update Property'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/properties')}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
