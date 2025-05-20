'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">UniHousing</h3>
            <p className="text-gray-300">
              Finding student housing made easy in Monterrey, Mexico.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">For Students</h4>
            <ul className="space-y-2">
              <li><Link href="/properties" className="text-gray-300 hover:text-white">Find Housing</Link></li>
              <li><Link href="/roommates" className="text-gray-300 hover:text-white">Find Roommates</Link></li>
              <li><Link href="/universities" className="text-gray-300 hover:text-white">Universities</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">For Property Owners</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href={isAuthenticated && user?.user_type === 'property_owner' 
                    ? "/dashboard/list-property" 
                    : "/login?redirect=/dashboard/list-property"} 
                  className="text-gray-300 hover:text-white"
                >
                  List Your Property
                </Link>
              </li>
              <li><Link href="/owner-resources" className="text-gray-300 hover:text-white">Resources</Link></li>
              <li><Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-300">support@unihousing.mx</li>
              <li className="text-gray-300">+52 (81) 1234 5678</li>
              <li className="text-gray-300">Monterrey, Nuevo León, Mexico</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} UniHousing. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}