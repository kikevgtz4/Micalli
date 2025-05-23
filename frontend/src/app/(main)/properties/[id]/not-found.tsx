import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function PropertyNotFound() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn&apos;t find the property you&apos;re looking for.
          </p>
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
            <p className="mb-6 text-gray-700">
              The property may have been removed or the URL might be incorrect.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/properties"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center"
              >
                Browse All Properties
              </Link>
              <Link
                href="/"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}