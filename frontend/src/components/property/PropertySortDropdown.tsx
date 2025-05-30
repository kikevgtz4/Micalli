// frontend/src/components/property/PropertySortDropdown.tsx
'use client';
import { Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { SortOption } from '@/types/filters';

interface PropertySortDropdownProps {
  value?: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'distance', label: 'Distance: Nearest' },
  { value: 'popularity', label: 'Most Popular' },
];

export default function PropertySortDropdown({ value, onChange }: PropertySortDropdownProps) {
  const currentOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500">
          Sort: {currentOption.label}
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </MenuButton>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-stone-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(option.value)}
                    className={`${
                      active ? 'bg-stone-100 text-stone-900' : 'text-stone-700'
                    } ${
                      value === option.value ? 'font-medium' : ''
                    } group flex items-center px-4 py-2 text-sm w-full text-left`}
                  >
                    {option.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}