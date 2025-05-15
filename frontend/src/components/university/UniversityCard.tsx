import Link from 'next/link';
import Image from 'next/image';

interface UniversityCardProps {
  id: number;
  name: string;
  address: string;
  imageUrl?: string;
  studentCount: number;
}

export default function UniversityCard({
  id,
  name,
  address,
  imageUrl,
  studentCount,
}: UniversityCardProps) {
  return (
    <Link href={`/universities/${id}`} className="block h-full">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative h-40 w-full">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-indigo-100 h-full w-full flex items-center justify-center">
              <span className="text-indigo-700 font-semibold text-xl">{name.charAt(0)}</span>
            </div>
          )}
        </div>
        
        <div className="p-4 flex-grow">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-gray-500 text-sm mt-1">{address}</p>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {studentCount.toLocaleString()} students
          </div>
        </div>
      </div>
    </Link>
  );
}