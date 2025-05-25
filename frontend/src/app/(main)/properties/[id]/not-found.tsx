// src/app/(main)/properties/[id]/not-found.tsx
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function PropertyNotFound() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-4">Property Not Found</h1>
          <p className="text-lg text-stone-600 mb-8">
            Sorry, we couldn't find the property you're looking for.
          </p>
          <div className="bg-surface p-8 rounded-lg shadow-md max-w-md mx-auto">
            <p className="mb-6 text-stone-700">
              The property may have been removed or the URL might be incorrect.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/properties"
                className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors text-center"
              >
                Browse All Properties
              </Link>
              <Link
                href="/"
                className="border border-stone-200 text-stone-700 px-4 py-2 rounded-md hover:bg-stone-50 text-center"
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