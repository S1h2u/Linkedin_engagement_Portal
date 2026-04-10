'use client';

import { ChangeEvent, useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    onSearch(q);
  };

  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search news..."
        value={value}
        onChange={handleChange}
        className="w-full md:w-1/2 px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
