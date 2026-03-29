"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProvinceSelector from "@/components/ProvinceSelector";
import CitySelector from "@/components/CitySelector";

const SearchPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    province_id: searchParams.get("province_id") || "",
    city_id: searchParams.get("city_id") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    room_type: searchParams.get("room_type") || "",
    facilities: searchParams.get("facilities")?.split(",") || [],
  });

  const [properties, setProperties] = useState<{ id: string; title: string; city: string; province: string; price: number; room_type: string; facilities: string[]; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        ...filters,
        facilities: Array.isArray(filters.facilities) ? filters.facilities.join(",") : filters.facilities,
      }).toString();
      const response = await fetch(`/api/properties?${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    if (!value) delete updatedFilters[key];
    setFilters(updatedFilters);
    const params = new URLSearchParams(updatedFilters).toString();
    router.push(`/cari?${params}`);
  };

  return (
    <div className="flex flex-col md:flex-row">
      {/* Filter Panel */}
      <aside className="w-full md:w-1/4 p-4 bg-gray-100">
        <h2 className="text-lg font-bold mb-4">Filters</h2>
        <ProvinceSelector
          value={Array.isArray(filters.province_id) ? filters.province_id[0] : filters.province_id}
          onChange={(value) => handleFilterChange("province_id", value)}
        />
        <CitySelector
          provinceId={Array.isArray(filters.province_id) ? filters.province_id[0] : filters.province_id}
          value={Array.isArray(filters.city_id) ? filters.city_id[0] : filters.city_id}
          onChange={(value) => handleFilterChange("city_id", value)}
        />
        <div className="mt-4">
          <label className="block text-sm font-medium">Price Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_price}
              onChange={(e) => handleFilterChange("min_price", e.target.value)}
              className="w-full border rounded p-2"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_price}
              onChange={(e) => handleFilterChange("max_price", e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium">Room Type</label>
          <select
            value={filters.room_type}
            onChange={(e) => handleFilterChange("room_type", e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Any</option>
            <option value="single">Single</option>
            <option value="shared">Shared</option>
            <option value="studio">Studio</option>
            <option value="apartment">Apartment</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium">Facilities</label>
          {["wifi", "ac", "parking", "kitchen", "laundry", "security"].map((facility) => (
            <label key={facility} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.facilities.includes(facility)}
                onChange={() => {
                  const updatedFacilities = filters.facilities.includes(facility)
                    ? Array.isArray(filters.facilities) ? filters.facilities.filter((f) => f !== facility) : []
                    : [...filters.facilities, facility];
                  handleFilterChange("facilities", updatedFacilities.join(","));
                }}
              />
              {facility}
            </label>
          ))}
        </div>
        <button
          onClick={() => {
            setFilters({});
            router.push("/cari");
          }}
          className="mt-4 w-full bg-red-500 text-white py-2 rounded"
        >
          Reset Filters
        </button>
      </aside>

      {/* Results Section */}
      <main className="flex-1 p-4">
        {loading && <p>Loading properties...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && properties.length === 0 && (
          <p>No properties match your filters. Try adjusting your search criteria.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <div key={property.id} className="border rounded p-4">
              <div className="bg-gray-200 h-40 mb-4">Image coming soon</div>
              <h3 className="font-bold text-lg mb-2">{property.title}</h3>
              <p className="text-sm text-gray-600">{property.city}, {property.province}</p>
              <p className="text-blue-600 font-bold">Rp {property.price.toLocaleString("id-ID")} / month</p>
              <p className="text-sm capitalize">{property.room_type}</p>
              <div className="flex gap-2 mt-2">
                {property.facilities.slice(0, 3).map((facility) => (
                  <span key={facility} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {facility}
                  </span>
                ))}
                {property.facilities.length > 3 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    +{property.facilities.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SearchPage;