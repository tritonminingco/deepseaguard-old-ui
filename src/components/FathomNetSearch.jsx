import { useDeferredValue, useEffect, useRef, useState } from "react";
import { FATHOMNET_ENDPOINTS, apiRequest } from "../config/api";

function FathomNetSearch({ onSpeciesSelect, className = "" }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const deferredQuery = useDeferredValue(query);

    useEffect(() => {
        if (deferredQuery.length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        const searchSpecies = async () => {
            setLoading(true);
            try {
                const url = FATHOMNET_ENDPOINTS.searchSpecies(deferredQuery, 8);
                const data = await apiRequest(url);
                setSuggestions(data.suggestions || []);
                setShowDropdown(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error("Species search error:", error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        searchSpecies();
    }, [deferredQuery]);

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSpeciesSelect(suggestions[selectedIndex]);
                }
                break;
            case "Escape":
                setShowDropdown(false);
                setSelectedIndex(-1);
                searchRef.current?.blur();
                break;
        }
    };

    // Handle species selection
    const handleSpeciesSelect = async (species) => {
        setQuery(species.name);
        setShowDropdown(false);
        setSelectedIndex(-1);

        if (onSpeciesSelect) {
            try {
                // Fetch detailed species data
                const url = FATHOMNET_ENDPOINTS.getSpecies(species.name, 5);
                const detailedData = await apiRequest(url);
                onSpeciesSelect(detailedData);
            } catch (error) {
                console.error("Error fetching species details:", error);
                onSpeciesSelect(species);
            }
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={`fathomnet-search ${className}`} ref={searchRef}>
            <div className="search-input-container">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search marine species... (e.g., Octopus, Jellyfish)"
                    className="species-search-input"
                />
                <div className="search-icon">
                    {loading ? (
                        <div className="search-spinner"></div>
                    ) : (
                        <span>🔍</span>
                    )}
                </div>
            </div>

            {showDropdown && (
                <div className="search-dropdown">
                    {suggestions.length === 0 && !loading && (
                        <div className="dropdown-item no-results">
                            No species found for "{query}"
                        </div>
                    )}

                    {suggestions.map((species, index) => (
                        <div
                            key={`${species.name}-${index}`}
                            className={`dropdown-item ${
                                index === selectedIndex ? "selected" : ""
                            }`}
                            onClick={() => handleSpeciesSelect(species)}
                            onMouseEnter={() => setSelectedIndex(index)}>
                            <div className="species-suggestion">
                                <div className="species-names">
                                    <div className="scientific-name">
                                        {species.name}
                                    </div>
                                    {species.commonName && (
                                        <div className="common-name">
                                            {species.commonName}
                                        </div>
                                    )}
                                </div>
                                <div className="species-info">
                                    {species.phylum && (
                                        <span className="phylum">
                                            {species.phylum}
                                        </span>
                                    )}
                                    {species.imageCount > 0 && (
                                        <span className="image-count">
                                            {species.imageCount} images
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
        .fathomnet-search {
          position: relative;
          width: 100%;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .species-search-input {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border: 2px solid #334155;
          border-radius: 8px;
          background: #1e293b;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .species-search-input:focus {
          border-color: #3b82f6;
        }

        .species-search-input::placeholder {
          color: #64748b;
        }

        .search-icon {
          position: absolute;
          right: 12px;
          font-size: 16px;
        }

        .search-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #334155;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1e293b;
          border: 2px solid #334155;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 300px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .dropdown-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #334155;
          transition: background-color 0.2s;
        }

        .dropdown-item:hover,
        .dropdown-item.selected {
          background: #334155;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item.no-results {
          color: #64748b;
          cursor: default;
        }

        .dropdown-item.no-results:hover {
          background: transparent;
        }

        .species-suggestion {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .species-names {
          flex: 1;
        }

        .scientific-name {
          font-weight: 600;
          color: #f8fafc;
          font-style: italic;
        }

        .common-name {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .species-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 11px;
          color: #64748b;
        }

        .phylum {
          margin-bottom: 2px;
        }

        .image-count {
          font-weight: 500;
          color: #3b82f6;
        }
      `}</style>
        </div>
    );
}

export default FathomNetSearch;
