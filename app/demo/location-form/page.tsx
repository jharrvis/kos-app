"use client";

import { useState } from "react";
import ProvinceSelector from "../../../components/ProvinceSelector";
import CitySelector from "../../../components/CitySelector";

const LocationFormDemo = () => {
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Location Form Demo</h1>
      <form className="w-full max-w-sm space-y-4">
        <ProvinceSelector
          value={selectedProvince}
          onChange={(value) => {
            setSelectedProvince(value);
            setSelectedCity(undefined); // Reset city when province changes
          }}
          required
        />
        <CitySelector
          provinceId={selectedProvince}
          value={selectedCity}
          onChange={setSelectedCity}
          required
        />
      </form>
      <div className="mt-6 w-full max-w-sm bg-white p-4 rounded-md shadow-md">
        <h2 className="text-lg font-semibold mb-2">Selected Values</h2>
        <p className="text-sm text-gray-700">Province ID: {selectedProvince || "None"}</p>
        <p className="text-sm text-gray-700">City ID: {selectedCity || "None"}</p>
      </div>
    </main>
  );
};

export default LocationFormDemo;