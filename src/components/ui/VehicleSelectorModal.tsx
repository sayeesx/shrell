import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useVehicle } from '../../application/VehicleContext';
import { useBodyScrollLock } from '../common/useBodyScrollLock';

interface VehicleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const {
    makes,
    models,
    variants,
    selectedMakeId,
    setSelectedMakeId,
    selectedModelId,
    setSelectedModelId,
    selectedVehicle,
    setSelectedVehicle,
    clearVehicle,
  } = useVehicle();

  const [selectedVariantId, setSelectedVariantId] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMake = makes.find((m) => m.id === selectedMakeId);
  const currentModel = models.find((m) => m.id === selectedModelId);
  const currentVariant = variants.find((v) => v.id === selectedVariantId);

  const handleConfirmVehicle = () => {
    if (currentMake && currentModel) {
      setSelectedVehicle({
        make: currentMake,
        model: currentModel,
        variant: currentVariant,
        year: selectedYear,
      });
      onClose();
    }
  };

  const handleClear = () => {
    clearVehicle();
    setSelectedVariantId('');
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-selector-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
      style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
    >
      {/* Dedicated Fullscreen Frosted Backdrop Layer (zero background bleed) */}
      <div
        className="fixed inset-0 modal-backdrop-solid"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg bg-white border border-gray-200/90 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-xs">
              <i className="bi bi-car-front-fill text-xl" aria-hidden="true"></i>
            </div>
            <div>
              <h2 id="vehicle-selector-title" className="text-base font-extrabold text-gray-900">
                Vehicle Fitment Selector
              </h2>
              <p className="text-xs text-gray-500">
                Filter catalogue for guaranteed plug-and-play compatibility
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
            aria-label="Close vehicle selector"
          >
            <i className="bi bi-x-lg text-sm" aria-hidden="true"></i>
          </button>
        </div>

        {/* Current Vehicle Badge if active */}
        {selectedVehicle && (
          <div className="mx-6 mt-4 p-3.5 bg-brand-50 border border-brand-200 rounded-2xl flex items-center justify-between text-xs text-brand-900">
            <div className="flex items-center gap-2 font-medium">
              <i className="bi bi-shield-check text-brand-600 text-base" aria-hidden="true"></i>
              <span>
                Active: <strong>{selectedVehicle.make.name} {selectedVehicle.model.name}</strong> ({selectedVehicle.year})
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 hover:text-brand-600 text-xs underline font-semibold ml-2"
            >
              Reset
            </button>
          </div>
        )}

        {/* Step-by-Step Form */}
        <div className="p-6 space-y-4 text-sm">
          {/* 1. Manufacturer */}
          <div>
            <label htmlFor="select-make" className="block text-xs font-semibold text-gray-700 mb-1.5">
              1. Vehicle Manufacturer (Make)
            </label>
            <select
              id="select-make"
              value={selectedMakeId}
              onChange={(e) => setSelectedMakeId(e.target.value)}
              className="w-full bg-canvas-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
            >
              <option value="">-- Choose Manufacturer --</option>
              {makes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.country})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Model */}
          <div>
            <label htmlFor="select-model" className="block text-xs font-semibold text-gray-700 mb-1.5">
              2. Vehicle Model
            </label>
            <select
              id="select-model"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              disabled={!selectedMakeId}
              className="w-full bg-canvas-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              <option value="">
                {selectedMakeId ? '-- Choose Vehicle Model --' : 'Select Make First'}
              </option>
              {models.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.name} ({mod.bodyType})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Year & 4. Variant */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-year" className="block text-xs font-semibold text-gray-700 mb-1.5">
                3. Manufacturing Year
              </label>
              <select
                id="select-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={!selectedModelId}
                className="w-full bg-canvas-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="select-variant" className="block text-xs font-semibold text-gray-700 mb-1.5">
                4. Variant (Optional)
              </label>
              <select
                id="select-variant"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                disabled={!selectedModelId}
                className="w-full bg-canvas-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                <option value="">All Variants</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variantName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmVehicle}
            disabled={!selectedMakeId || !selectedModelId}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <i className="bi bi-check-lg text-sm" aria-hidden="true"></i>
            <span>Apply Fitment Filter</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
