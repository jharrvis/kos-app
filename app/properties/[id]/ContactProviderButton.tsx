'use client';

export default function ContactProviderButton({ providerName }: { providerName: string }) {
  const handleContact = () => {
    alert(`Contact feature coming in Wave 4. Provider: ${providerName}`);
  };

  return (
    <button
      onClick={handleContact}
      className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Contact Provider
    </button>
  );
}
