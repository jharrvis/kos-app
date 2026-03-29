"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        console.error("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Select Your Role</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="tenant"
            name="role"
            value="tenant"
            checked={role === "tenant"}
            onChange={(e) => setRole(e.target.value)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label htmlFor="tenant" className="text-gray-700">Tenant</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="provider"
            name="role"
            value="provider"
            checked={role === "provider"}
            onChange={(e) => setRole(e.target.value)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label htmlFor="provider" className="text-gray-700">Provider</label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Continue"}
        </button>
      </form>
    </main>
  );
}