import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

const IconPicker = ({ value, onChange }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Get all valid icon names (excluding internal exports if any, usually components start with uppercase)
    const allIconNames = useMemo(() => {
        return Object.keys(LucideIcons).filter(name => /^[A-Z]/.test(name));
    }, []);

    // Filter icons based on search
    const filteredIcons = useMemo(() => {
        if (!search) return allIconNames.slice(0, 100); // Limit initial view for performance
        return allIconNames.filter(name =>
            name.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 100); // Limit results
    }, [search, allIconNames]);

    const SelectedIcon = value && LucideIcons[value] ? LucideIcons[value] : LucideIcons.HelpCircle;

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Select Icon</label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 focus:ring-1 focus:ring-primary-500 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center bg-neutral-100 rounded text-neutral-600">
                        <SelectedIcon size={16} />
                    </div>
                    <span className="text-sm text-neutral-700">{value || 'Select an icon...'}</span>
                </div>
                <LucideIcons.ChevronDown size={14} className="text-neutral-400" />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-neutral-200 shadow-xl max-h-64 flex flex-col">

                    {/* Search Bar */}
                    <div className="p-2 border-b border-neutral-100 bg-neutral-50 rounded-t-lg sticky top-0">
                        <div className="relative">
                            <LucideIcons.Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search 1000+ icons..."
                                autoFocus
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-2 grid grid-cols-6 gap-1">
                        {filteredIcons.map(iconName => {
                            const Icon = LucideIcons[iconName];
                            const isSelected = value === iconName;
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => {
                                        onChange(iconName);
                                        setIsOpen(false);
                                    }}
                                    title={iconName}
                                    className={`p-2 rounded hover:bg-neutral-100 flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200' : 'text-neutral-600'}`}
                                >
                                    <Icon size={20} />
                                </button>
                            );
                        })}

                        {filteredIcons.length === 0 && (
                            <div className="col-span-6 py-4 text-center text-xs text-neutral-400">
                                No icons found
                            </div>
                        )}
                    </div>

                    {/* Footer showing count */}
                    <div className="px-3 py-1.5 bg-neutral-50 border-t border-neutral-100 text-xs text-neutral-400 text-center rounded-b-lg">
                        Showing {filteredIcons.length} of {allIconNames.length}
                    </div>
                </div>
            )}

            {/* Click outside closer could be added here or simplified */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default IconPicker;
