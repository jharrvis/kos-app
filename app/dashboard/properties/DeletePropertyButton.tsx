'use client';

import { useState } from 'react';

export default function DeletePropertyButton({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Property deleted successfully');
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`Failed to delete property: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to delete property. Please try again.');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
