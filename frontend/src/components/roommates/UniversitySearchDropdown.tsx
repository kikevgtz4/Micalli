// frontend/src/components/roommates/UniversitySearchDropdown.tsx
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import apiService from '@/lib/api';
import { University } from '@/types/api';
import { MagnifyingGlassIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

interface UniversitySearchDropdownProps {
  value?: number;
  onChange: (universityId: number) => void;
  error?: string;
}

export default function UniversitySearchDropdown({ 
  value, 
  onChange, 
  error 
}: UniversitySearchDropdownProps) {
  const [search, setSearch] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Load all universities on mount
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.universities.getAll();
        setUniversities(response.data);
        
        // Set selected university if value exists
        if (value) {
          const selected = response.data.find((u: University) => u.id === value);
          if (selected) {
            setSelectedUniversity(selected);
            setSearch(selected.name);
          }
        }
      } catch (error) {
        console.error('Failed to load universities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUniversities();
  }, [value]);

  // Filter universities based on search
  useEffect(() => {
    if (debouncedSearch) {
      const filtered = universities.filter(uni => 
        uni.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        uni.city?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      setFilteredUniversities(filtered);
    } else {
      setFilteredUniversities(universities);
    }
  }, [debouncedSearch, universities]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (university: University) => {
    setSelectedUniversity(university);
    setSearch(university.name);
    onChange(university.id);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        University
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <BuildingLibraryIcon className="h-5 w-5 text-stone-400" />
        </div>
        
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for your university..."
          className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            error ? 'border-red-300 bg-red-50' : 'border-stone-200'
          }`}
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredUniversities.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-xl border border-stone-200 overflow-auto">
          {filteredUniversities.map((university) => (
            <button
              key={university.id}
              type="button"
              onClick={() => handleSelect(university)}
              className={`w-full px-4 py-3 text-left hover:bg-stone-50 flex items-center justify-between ${
                selectedUniversity?.id === university.id ? 'bg-primary-50 text-primary-700' : ''
              }`}
            >
              <div>
                <div className="font-medium">{university.name}</div>
                <div className="text-sm text-stone-500">{university.city}, {university.state}</div>
              </div>
              {selectedUniversity?.id === university.id && (
                <div className="text-primary-600">✓</div>
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}