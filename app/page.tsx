'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faStar, faArrowUpAZ, faArrowDownAZ, faFilter } from '@fortawesome/free-solid-svg-icons';
import itemsData from '../names_example_database.json';

interface Item {
  name: string;
  wiki_url: string;
  infobox: {
    image: string;
    rarity: string;
    quote?: string;
    type?: string;
    weight?: number;
    sellprice?: number | number[];
    [key: string]: any;
  };
  image_urls: {
    thumb?: string;
    original?: string;
    file_page?: string;
  };
  [key: string]: any;
}

const rarityColors: { [key: string]: string } = {
  Common: '#717471',
  Uncommon: '#41EB6A',
  Rare: '#1ECBFC',
  Epic: '#d8299b',
  Legendary: '#fbc700',
};

const rarityGradients: { [key: string]: string } = {
  Common: 'linear-gradient(to right, rgb(153 159 165 / 25%) 0%, rgb(5 13 36) 100%)',
  Uncommon: 'linear-gradient(to right, rgb(86 203 134 / 25%) 0%, rgb(5 13 36) 100%)',
  Rare: 'linear-gradient(to right, rgb(30 150 252 / 30%) 0%, rgb(5 13 36) 100%)',
  Epic: 'linear-gradient(to right, rgb(216 41 155 / 25%) 0%, rgb(5 13 36) 100%)',
  Legendary: 'linear-gradient(to right, rgb(251 199 0 / 25%) 0%, rgb(5 13 36) 100%)',
};

type SortField = 'name' | 'rarity' | 'sellprice' | 'weight';

const rarityOrder: { [key: string]: number } = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Get all unique types
  const allTypes = useMemo(() => {
    const typesSet = new Set<string>();
    (itemsData as Item[]).forEach((item) => {
      if (item.infobox?.type) {
        typesSet.add(item.infobox.type);
      }
    });
    return Array.from(typesSet).sort();
  }, []);

  const toggleType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const filteredAndSortedItems = useMemo(() => {
    let items = itemsData as Item[];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.infobox?.rarity?.toLowerCase().includes(query) ||
          item.infobox?.type?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by selected types
    if (selectedTypes.size > 0) {
      items = items.filter((item) => {
        return item.infobox?.type && selectedTypes.has(item.infobox.type);
      });
    }

    // Sort
    items = [...items].sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'rarity':
          const rarityA = rarityOrder[a.infobox?.rarity || 'Common'] || 0;
          const rarityB = rarityOrder[b.infobox?.rarity || 'Common'] || 0;
          compareResult = rarityA - rarityB;
          break;
        case 'sellprice':
          const priceA = Array.isArray(a.infobox?.sellprice) 
            ? a.infobox.sellprice[0] 
            : (a.infobox?.sellprice || 0);
          const priceB = Array.isArray(b.infobox?.sellprice) 
            ? b.infobox.sellprice[0] 
            : (b.infobox?.sellprice || 0);
          compareResult = priceA - priceB;
          break;
        case 'weight':
          compareResult = (a.infobox?.weight || 0) - (b.infobox?.weight || 0);
          break;
      }

      return sortAscending ? compareResult : -compareResult;
    });

    return items;
  }, [searchQuery, sortField, sortAscending, selectedTypes]);

  const getSellPrice = (price: number | number[] | null | undefined): string => {
    if (!price) return 'N/A';
    if (Array.isArray(price)) {
      return `${price[0]} - ${price[price.length - 1]}`;
    }
    return price.toString();
  };

  return (
    <div className="min-h-screen bg-[#07020b] text-gray-100 flex flex-col">
      {/* Header - Logo and Navigation */}
      <header className="bg-[#07020b] border-b border-purple-500/20 sticky top-0 z-40">
        <div className="flex items-center justify-between pr-8">
          {/* Logo */}
          <div className="flex-shrink-0 h-24 flex items-center">
            <Image
              src="/logo.webp"
              alt="ARC Forge"
              width={320}
              height={96}
              className="h-full w-auto"
              priority
            />
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-2">
            <a
              href="#"
              className="px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 font-medium hover:bg-purple-500/30 transition-all"
            >
              Item Database
            </a>
            <a
              href="#"
              className="px-6 py-3 bg-black/20 border border-purple-500/20 rounded-lg text-gray-400 font-medium hover:bg-purple-500/10 hover:text-gray-300 transition-all"
            >
              Crafting Tree
            </a>
            <a
              href="#"
              className="px-6 py-3 bg-black/20 border border-purple-500/20 rounded-lg text-gray-400 font-medium hover:bg-purple-500/10 hover:text-gray-300 transition-all"
            >
              Recycling Tree
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Search, Filters and Sort */}
        <aside className="w-80 bg-[#07020b] border-r border-purple-500/20 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                Search
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-black/40 border border-purple-500/30 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-purple-500/20"></div>
            {/* Sort Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <FontAwesomeIcon icon={faArrowUpAZ} className="text-purple-400" />
                Sort By
              </h3>
              <div className="space-y-2 mb-3">
                <label className="flex items-center gap-3 p-3 bg-black/20 hover:bg-purple-500/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-purple-500/30">
                  <input
                    type="radio"
                    name="sortField"
                    value="name"
                    checked={sortField === 'name'}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="w-4 h-4 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-black/40"
                  />
                  <span className="text-sm text-gray-300">Name</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-black/20 hover:bg-purple-500/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-purple-500/30">
                  <input
                    type="radio"
                    name="sortField"
                    value="rarity"
                    checked={sortField === 'rarity'}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="w-4 h-4 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-black/40"
                  />
                  <span className="text-sm text-gray-300">Rarity</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-black/20 hover:bg-purple-500/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-purple-500/30">
                  <input
                    type="radio"
                    name="sortField"
                    value="sellprice"
                    checked={sortField === 'sellprice'}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="w-4 h-4 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-black/40"
                  />
                  <span className="text-sm text-gray-300">Sell Price</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-black/20 hover:bg-purple-500/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-purple-500/30">
                  <input
                    type="radio"
                    name="sortField"
                    value="weight"
                    checked={sortField === 'weight'}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="w-4 h-4 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-black/40"
                  />
                  <span className="text-sm text-gray-300">Weight</span>
                </label>
              </div>
              
              <button
                onClick={() => setSortAscending(!sortAscending)}
                className="w-full px-4 py-3 bg-black/40 border border-purple-500/30 rounded-lg text-gray-100 hover:bg-purple-500/20 focus:outline-none focus:border-purple-500 transition-all text-sm flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={sortAscending ? faArrowUpAZ : faArrowDownAZ} />
                {sortAscending ? 'Ascending' : 'Descending'}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-purple-500/20"></div>

            {/* Results Count */}
            <div className="text-sm text-gray-400 text-center py-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="font-semibold text-lg text-gray-200">{filteredAndSortedItems.length}</div>
              <div className="text-xs">{filteredAndSortedItems.length === 1 ? 'item' : 'items'} found</div>
            </div>

            {/* Divider */}
            <div className="border-t border-purple-500/20"></div>

            {/* Type Filters */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 uppercase tracking-wide">
                  <FontAwesomeIcon icon={faFilter} className="text-purple-400" />
                  Filter by Type
                </h3>
                {selectedTypes.size > 0 && (
                  <button
                    onClick={() => setSelectedTypes(new Set())}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {allTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-3 p-3 bg-black/20 hover:bg-purple-500/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-purple-500/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.has(type)}
                      onChange={() => toggleType(type)}
                      className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-black/40"
                    />
                    <span className="text-sm text-gray-300">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Items Grid */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
              {filteredAndSortedItems.map((item, index) => {
                const rarity = item.infobox?.rarity || 'Common';
                const borderColor = rarityColors[rarity] || '#717471';
                const gradient = rarityGradients[rarity] || rarityGradients.Common;
                
                return (
                  <div
                    key={`${item.name}-${index}`}
                    onClick={() => setSelectedItem(item)}
                    className="group relative bg-gradient-to-br from-purple-950/30 to-blue-950/30 rounded-lg overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: borderColor,
                      boxShadow: `0 0 15px ${borderColor}20`
                    }}
                  >
                    {/* Image Section */}
                    <div 
                      className="aspect-square flex items-center justify-center p-2 relative overflow-hidden"
                      style={{ background: gradient }}
                    >
                      {item.image_urls?.thumb ? (
                        <img
                          src={item.image_urls.thumb}
                          alt={item.name}
                          className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-2xl text-gray-700">?</div>
                      )}
                    </div>

                    {/* Name Section */}
                    <div className="p-1.5 bg-black/30">
                      <h3 
                        className="font-medium text-xs group-hover:brightness-125 transition-all line-clamp-2 text-center leading-tight"
                        style={{ color: borderColor }}
                      >
                        {item.name}
                      </h3>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ 
                        background: `radial-gradient(circle at center, ${borderColor}15 0%, transparent 70%)`
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* No Results */}
            {filteredAndSortedItems.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search query</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Right Slide-in Detail Panel */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />
          
          {/* Detail Panel */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[550px] bg-[#07020b]/98 backdrop-blur-lg border-l border-purple-500/30 z-50 overflow-y-auto animate-slide-in shadow-2xl">
            <div className="p-8">
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-lg transition-all text-gray-400 hover:text-white"
              >
                ✕
              </button>

              {/* Item Header */}
              <div className="mb-8">
                <div 
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-wider"
                  style={{ 
                    backgroundColor: `${rarityColors[selectedItem.infobox?.rarity] || '#717471'}40`,
                    color: rarityColors[selectedItem.infobox?.rarity] || '#717471'
                  }}
                >
                  {selectedItem.infobox?.rarity || 'Common'}
                </div>
                <h2 className="text-3xl font-bold text-gray-100 mb-3">{selectedItem.name}</h2>
                {selectedItem.infobox?.type && (
                  <p className="text-purple-400 text-sm uppercase tracking-wide">{selectedItem.infobox.type}</p>
                )}
              </div>

              {/* Item Image */}
              {selectedItem.image_urls?.thumb && (
                <div 
                  className="w-full aspect-square rounded-xl mb-8 flex items-center justify-center p-12 border border-purple-500/20"
                  style={{ background: rarityGradients[selectedItem.infobox?.rarity] || rarityGradients.Common }}
                >
                  <img
                    src={selectedItem.image_urls.thumb}
                    alt={selectedItem.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Quote */}
              {selectedItem.infobox?.quote && (
                <div className="mb-8 p-5 bg-black/30 rounded-lg border-l-4 border-purple-500">
                  <p className="text-gray-300 italic leading-relaxed">"{selectedItem.infobox.quote}"</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {selectedItem.infobox?.weight != null && (
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Weight</div>
                    <div className="text-xl font-bold text-gray-100">{selectedItem.infobox.weight}</div>
                  </div>
                )}
                {selectedItem.infobox?.sellprice != null && (
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Sell Price</div>
                    <div className="text-xl font-bold text-green-400">{getSellPrice(selectedItem.infobox.sellprice)}</div>
                  </div>
                )}
                {selectedItem.infobox?.stacksize != null && (
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Stack Size</div>
                    <div className="text-xl font-bold text-gray-100">{selectedItem.infobox.stacksize}</div>
                  </div>
                )}
                {selectedItem.infobox?.damage != null && (
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Damage</div>
                    <div className="text-xl font-bold text-red-400">{selectedItem.infobox.damage}</div>
                  </div>
                )}
              </div>

              {/* Sources */}
              {selectedItem.sources && selectedItem.sources.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.sources.map((source: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Crafting */}
              {selectedItem.crafting && selectedItem.crafting.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Crafting Recipe</h3>
                  {selectedItem.crafting.map((craft: any, idx: number) => (
                    <div key={idx} className="bg-black/30 p-4 rounded-lg mb-2">
                      {craft.workshop && (
                        <div className="text-xs text-purple-400 mb-2">🛠️ {craft.workshop}</div>
                      )}
                      <div className="space-y-1">
                        {craft.recipe?.map((mat: any, midx: number) => (
                          <div key={midx} className="text-sm text-gray-300">
                            • {mat.quantity}x {mat.item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Wiki Link */}
              <a
                href={selectedItem.wiki_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-center text-purple-300 hover:text-purple-200 transition-all"
              >
                View on Wiki →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
