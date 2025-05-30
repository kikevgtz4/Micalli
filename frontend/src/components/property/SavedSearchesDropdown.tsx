// frontend/src/components/property/SavedSearchesDropdown.tsx
'use client';
import { Fragment } from 'react';
import { Menu, MenuButton, Transition } from '@headlessui/react';
import { SavedSearch } from '@/types/filters';
import { 
  BookmarkIcon, 
  TrashIcon, 
  ChevronDownIcon 
} from 'lucide-react';
import { formatters } from '@/utils/formatters';

interface SavedSearchesDropdownProps {
  savedSearches: SavedSearch[];
  onLoad: (searchId: string) => void;
  onDelete: (searchId: string) => void;
}

export default function SavedSearchesDropdown({
  savedSearches,
  onLoad,
  onDelete,
}: SavedSearchesDropdownProps) {
  if (savedSearches.length === 0) {
    return null;
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex items-center px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500">
          <BookmarkIcon className="h-4 w-4 mr-2" />
          Saved Searches ({savedSearches.length})
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
        <Menu.Items className="absolute left-0 w-64 mt-2 origin-top-left bg-white divide-y divide-stone-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            {savedSearches.map((search) => (
              <Menu.Item key={search.id}>
                {({ active }) => (
                  <div
                    className={`${
                      active ? 'bg-stone-100' : ''
                    } px-4 py-2 flex items-center justify-between group`}
                  >
                    <button
                      onClick={() => onLoad(search.id)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-stone-900">
                        {search.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatters.date.relative(search.createdAt)}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(search.id);
                      }}
                      className="ml-2 p-1 rounded hover:bg-stone-200"
                    >
                      <TrashIcon className="h-4 w-4 text-stone-500" />
                    </button>
                  </div>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}