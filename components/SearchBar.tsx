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
      <div className="relative w-full md:w-2/3 lg:w-1/2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          /
        </span>
        <input
          type="text"
          placeholder="Search news..."
          value={value}
          onChange={handleChange}
          className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-10 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 shadow-lg shadow-black/30"
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Tip: search by company, category, or keyword.
      </p>
    </div>
  );
}
