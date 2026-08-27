import { useState } from 'react';
import { Briefcase, ExternalLink, Eye, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export default function ProposalPortfolioGallery({ items = [], title = 'Attached Portfolio Projects' }) {
  const [selectedItem, setSelectedItem] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/40 via-white to-slate-50/50 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-600 shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500">
              {items.length} project{items.length === 1 ? '' : 's'} attached to showcase relevant work
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id || item.title}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            {/* Image Thumbnail Header */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
                  <Briefcase className="h-8 w-8 stroke-1" />
                  <span className="mt-1 text-[11px] font-medium text-slate-400">No Image Preview</span>
                </div>
              )}

              {/* Lightbox / Zoom Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md backdrop-blur-xs hover:bg-white"
                >
                  <Eye className="h-3.5 w-3.5 text-brand-600" /> Preview Project
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 flex-col justify-between p-3.5">
              <div>
                <h5 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-brand-600 transition-colors">
                  {item.title}
                </h5>
                {item.description && (
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Skills used */}
                {item.skills && item.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {typeof s === 'string' ? s : s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  View Details
                </button>

                {item.projectUrl ? (
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-700"
                    title="Open live project in new tab"
                  >
                    Live Demo <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[11px] italic text-slate-400">Attached File</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Image & Project Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="min-w-0 pr-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-slate-500">Portfolio Showcase Item</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4">
              {selectedItem.imageUrl && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner">
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="max-h-[50vh] w-full object-contain mx-auto"
                  />
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Project Description
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedItem.description || 'No detailed description provided for this portfolio project.'}
                </p>
              </div>

              {selectedItem.skills && selectedItem.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Skills & Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {typeof s === 'string' ? s : s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 bg-slate-50">
              <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>

              {selectedItem.projectUrl && (
                <a
                  href={selectedItem.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
                >
                  Visit Live Project URL <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
