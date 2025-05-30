"use client";

interface PropertyAmenitiesProps {
  amenities: string[];
}

const amenityIcons: Record<string, string> = {
  'WiFi': '📶',
  'Air Conditioning': '❄️',
  'Heating': '🔥',
  'Washing Machine': '🧺',
  'Dryer': '🌪️',
  'Kitchen': '🍳',
  'Refrigerator': '🧊',
  'Microwave': '📱',
  'Dishwasher': '🍽️',
  'TV': '📺',
  'Cable TV': '📡',
  'Parking': '🚗',
  'Gym': '💪',
  'Swimming Pool': '🏊',
  'Security System': '🔒',
  'Elevator': '🛗',
  'Balcony': '🏠',
  'Patio': '🌿',
  'Garden': '🌱',
  'Study Room': '📚'
};

export default function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
      <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">
        Amenities & Features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {amenities.map((amenity, index) => (
          <div
            key={index}
            className="flex items-center p-3 bg-stone-50 dark:bg-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
          >
            <span className="text-xl mr-3" role="img" aria-label={amenity}>
              {amenityIcons[amenity] || '✓'}
            </span>
            <span className="text-stone-700 dark:text-stone-300 font-medium">
              {amenity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
