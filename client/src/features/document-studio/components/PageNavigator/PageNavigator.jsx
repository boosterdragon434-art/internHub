import React from 'react';
import { FiPlus, FiCopy, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * PageNavigator — Thumbnails, add/duplicate/delete/reorder pages for multi-page documents.
 */
const PageNavigator = ({ pages, currentPageIndex, onSelectPage, onAddPage, onDuplicatePage, onDeletePage, onReorderPage }) => {
  if (!pages || pages.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <span className="text-[10px] text-slate-400 font-bold">Single Page</span>
        <button onClick={onAddPage} className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-bold rounded-lg transition" aria-label="Add page">
          <FiPlus size={10} /> Add Page
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
      <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Pages</span>
      <div className="flex items-center gap-1.5">
        {pages.map((page, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPage(idx)}
            className={`relative flex items-center justify-center w-12 h-9 rounded-lg border-2 text-[9px] font-bold transition shrink-0 ${
              idx === currentPageIndex
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-600'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300'
            }`}
            aria-label={`Page ${idx + 1}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 ml-auto shrink-0">
        <button onClick={onAddPage} className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition" aria-label="Add page" title="Add page">
          <FiPlus size={12} />
        </button>
        <button onClick={() => onDuplicatePage(currentPageIndex)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition" aria-label="Duplicate page" title="Duplicate current page">
          <FiCopy size={12} />
        </button>
        {pages.length > 1 && (
          <button onClick={() => onDeletePage(currentPageIndex)} className="p-1.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-500 rounded-lg transition" aria-label="Delete page" title="Delete current page">
            <FiTrash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PageNavigator;
