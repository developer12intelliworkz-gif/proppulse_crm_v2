import React, { memo, useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { debounce } from "lodash";
import { useAuth } from "@/contexts/AuthContext";

interface SearchInputProps {
  filterText: string;
  setFilterText: (value: string) => void;
  isLoading: boolean;
}

const SearchInput = memo(
  ({ filterText, setFilterText, isLoading }: SearchInputProps) => {
    const { user } = useAuth();
    const isAgent = user?.role === "agent";

    const [localValue, setLocalValue] = useState(filterText);

    const debouncedSetFilterText = useMemo(
      () => debounce((value: string) => setFilterText(value), 300),
      [setFilterText]
    );

    useEffect(() => {
      setLocalValue(filterText);
    }, [filterText]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);
      debouncedSetFilterText(value);
    };

    return (
      <div className="relative flex-1 mb-2">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search leads..."
          value={localValue}
          onChange={handleChange}
          className="pl-10 pr-4 w-full bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-[var(--theme-color)] focus:ring-1 focus:ring-[var(--theme-color)]/20 rounded-xl h-10 text-sm shadow-sm transition-all outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          // disabled={isLoading || isAgent}
        />
      </div>
    );
  }
);

export default SearchInput;
