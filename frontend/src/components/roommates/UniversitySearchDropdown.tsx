import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/forms/useDebounce';
import apiService from '@/lib/api';
import { University } from '@/types/api';
import { MagnifyingGlassIcon, BuildingLibraryIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface UniversitySearchDropdownProps {
  value?: number;
  onChange: (universityId: number | undefined) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;  // Add this
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
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Load all universities on mount
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.universities.getAll();
        
        // Handle both paginated and non-paginated responses
        let universityList: University[] = [];
        
        if (response.data) {
          if (response.data.results && Array.isArray(response.data.results)) {
            universityList = response.data.results;
          } else if (Array.isArray(response.data)) {
            universityList = response.data;
          }
        }
        
        setUniversities(universityList);
        
        // Set selected university if value exists
        if (value && universityList.length > 0) {
          const selected = universityList.find((u: University) => u.id === value);
          if (selected) {
            setSelectedUniversity(selected);
            setSearch(selected.name);
          }
        }
      } catch (error) {
        console.error('Failed to load universities:', error);
        setUniversities([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUniversities();
  }, [value]);

  // Filter universities based on search
  useEffect(() => {
    if (!Array.isArray(universities)) {
      setFilteredUniversities([]);
      return;
    }
    
    if (debouncedSearch) {
      const filtered = universities.filter(uni => 
        uni.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (uni.city && uni.city.toLowerCase().includes(debouncedSearch.toLowerCase()))
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
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedUniversity]);

  const handleClose = () => {
    setIsOpen(false);
    setHasInteracted(true);
    
    // If they typed something but didn't select, clear it
    if (!selectedUniversity) {
      setSearch('');
      onChange(undefined);
    } else {
      // Reset to selected university name
      setSearch(selectedUniversity.name);
    }
  };

  const handleSelect = (university: University) => {
    setSelectedUniversity(university);
    setSearch(university.name);
    onChange(university.id);
    setIsOpen(false);
    setHasInteracted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    setIsOpen(true);
    
    // Clear selection if they're typing something different
    if (selectedUniversity && !selectedUniversity.name.toLowerCase().includes(newValue.toLowerCase())) {
      setSelectedUniversity(null);
      onChange(undefined);
    }
  };

  const showError = error || (hasInteracted && !selectedUniversity && search.length > 0);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-semibold text-stone-700 mb-2">
        <div className="flex items-center gap-2">
          <BuildingLibraryIcon className="h-5 w-5 text-blue-600" />
          University
        </div>
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <BuildingLibraryIcon className="h-5 w-5 text-stone-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search and select your university..."
          className={`block w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
            showError ? 'border-red-300 bg-red-50' : 'border-stone-200 hover:border-stone-300'
          }`}
        />
        
        {/* Status indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500" />
          ) : selectedUniversity ? (
            <div className="text-green-500">✓</div>
          ) : showError ? (
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && filteredUniversities.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-xl border border-stone-200 overflow-auto text-gray-800">
          {filteredUniversities.length === 0 && search ? (
            <div className="px-4 py-3 text-center text-stone-500">
              No universities found. Please select from the list.
            </div>
          ) : (
            filteredUniversities.map((university) => (
              <button
                key={university.id}
                type="button"
                onClick={() => handleSelect(university)}
                className={`w-full px-4 py-3 text-left hover:bg-stone-50 flex items-center justify-between transition-colors ${
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
            ))
          )}
        </div>
      )}

      {/* Error message */}
      {(error || showError) && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <ExclamationCircleIcon className="h-4 w-4" />
          {error || "Please select a university from the dropdown"}
        </p>
      )}
    </div>
  );
}