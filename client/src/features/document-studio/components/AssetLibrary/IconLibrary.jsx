import React, { useState } from 'react';
import {
  FiAward, FiStar, FiCheckCircle, FiShield, FiBook, FiHeart, FiFlag,
  FiTarget, FiTrendingUp, FiZap, FiGlobe, FiUsers, FiUser, FiMail,
  FiCalendar, FiClock, FiMapPin, FiPhone, FiPrinter, FiBriefcase,
  FiBookmark, FiThumbsUp, FiSmile, FiCoffee, FiFeather, FiSun,
  FiMoon, FiCloud, FiKey, FiLifeBuoy, FiCompass, FiRadio, FiMonitor,
  FiCode, FiDatabase, FiCpu, FiActivity, FiLayers, FiEdit3,
  FiPenTool, FiHexagon, FiOctagon, FiTriangle, FiCircle, FiSquare,
  FiHash, FiLink, FiUploadCloud, FiDownloadCloud,
} from 'react-icons/fi';

/**
 * Curated set of ~50 certificate-relevant SVG icons from react-icons (already installed).
 * Each icon is insertable as an 'image' overlay placeholder in the canvas.
 */
const ICON_LIBRARY = [
  { name: 'Award', Icon: FiAward, category: 'certificates' },
  { name: 'Star', Icon: FiStar, category: 'certificates' },
  { name: 'CheckCircle', Icon: FiCheckCircle, category: 'certificates' },
  { name: 'Shield', Icon: FiShield, category: 'certificates' },
  { name: 'Book', Icon: FiBook, category: 'certificates' },
  { name: 'Heart', Icon: FiHeart, category: 'decorative' },
  { name: 'Flag', Icon: FiFlag, category: 'decorative' },
  { name: 'Target', Icon: FiTarget, category: 'certificates' },
  { name: 'TrendingUp', Icon: FiTrendingUp, category: 'certificates' },
  { name: 'Zap', Icon: FiZap, category: 'certificates' },
  { name: 'Globe', Icon: FiGlobe, category: 'general' },
  { name: 'Users', Icon: FiUsers, category: 'general' },
  { name: 'User', Icon: FiUser, category: 'general' },
  { name: 'Mail', Icon: FiMail, category: 'general' },
  { name: 'Calendar', Icon: FiCalendar, category: 'general' },
  { name: 'Clock', Icon: FiClock, category: 'general' },
  { name: 'MapPin', Icon: FiMapPin, category: 'general' },
  { name: 'Phone', Icon: FiPhone, category: 'general' },
  { name: 'Printer', Icon: FiPrinter, category: 'general' },
  { name: 'Briefcase', Icon: FiBriefcase, category: 'certificates' },
  { name: 'Bookmark', Icon: FiBookmark, category: 'decorative' },
  { name: 'ThumbsUp', Icon: FiThumbsUp, category: 'certificates' },
  { name: 'Smile', Icon: FiSmile, category: 'decorative' },
  { name: 'Coffee', Icon: FiCoffee, category: 'decorative' },
  { name: 'Feather', Icon: FiFeather, category: 'decorative' },
  { name: 'Sun', Icon: FiSun, category: 'decorative' },
  { name: 'Moon', Icon: FiMoon, category: 'decorative' },
  { name: 'Cloud', Icon: FiCloud, category: 'decorative' },
  { name: 'Key', Icon: FiKey, category: 'general' },
  { name: 'LifeBuoy', Icon: FiLifeBuoy, category: 'decorative' },
  { name: 'Compass', Icon: FiCompass, category: 'decorative' },
  { name: 'Radio', Icon: FiRadio, category: 'general' },
  { name: 'Monitor', Icon: FiMonitor, category: 'tech' },
  { name: 'Code', Icon: FiCode, category: 'tech' },
  { name: 'Database', Icon: FiDatabase, category: 'tech' },
  { name: 'CPU', Icon: FiCpu, category: 'tech' },
  { name: 'Activity', Icon: FiActivity, category: 'tech' },
  { name: 'Layers', Icon: FiLayers, category: 'general' },
  { name: 'Edit', Icon: FiEdit3, category: 'general' },
  { name: 'Pen', Icon: FiPenTool, category: 'general' },
  { name: 'Hexagon', Icon: FiHexagon, category: 'shapes' },
  { name: 'Octagon', Icon: FiOctagon, category: 'shapes' },
  { name: 'Triangle', Icon: FiTriangle, category: 'shapes' },
  { name: 'Circle', Icon: FiCircle, category: 'shapes' },
  { name: 'Square', Icon: FiSquare, category: 'shapes' },
  { name: 'Hash', Icon: FiHash, category: 'general' },
  { name: 'Link', Icon: FiLink, category: 'general' },
  { name: 'Upload', Icon: FiUploadCloud, category: 'general' },
  { name: 'Download', Icon: FiDownloadCloud, category: 'general' },
];

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'certificates', label: 'Certificates' },
  { value: 'decorative', label: 'Decorative' },
  { value: 'general', label: 'General' },
  { value: 'tech', label: 'Tech' },
  { value: 'shapes', label: 'Shapes' },
];

/**
 * IconLibrary — Curated icon browser for inserting decorative elements.
 * Icons are inserted as 'image' overlay placeholders.
 */
const IconLibrary = ({ onInsertIcon, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  if (!isOpen) return null;

  const filtered = ICON_LIBRARY.filter((icon) => {
    const matchSearch = !searchTerm || icon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = category === 'all' || icon.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Icon Library</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs" aria-label="Close icon library">✕</button>
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search icons..."
        className="w-full text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 mb-2 outline-none focus:ring-1 focus:ring-violet-500"
      />
      <div className="flex gap-1 mb-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-2 py-0.5 rounded-full text-[8px] font-bold transition ${
              category === cat.value
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
        {filtered.map((icon) => (
          <button
            key={icon.name}
            onClick={() => onInsertIcon(icon.name)}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
            title={icon.name}
            aria-label={`Insert ${icon.name} icon`}
          >
            <icon.Icon size={18} />
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-[10px] text-slate-400 text-center py-4">No icons found</p>
      )}
    </div>
  );
};

export { ICON_LIBRARY };
export default IconLibrary;
