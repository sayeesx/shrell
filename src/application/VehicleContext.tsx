import React, { createContext, useContext, useEffect, useState } from 'react';
import { VehicleMake, VehicleModel, VehicleVariant } from '../domain/types';
import { vehicleRepository } from '../infrastructure/repositories';

interface SelectedVehicle {
  make: VehicleMake;
  model: VehicleModel;
  variant?: VehicleVariant;
  year?: number;
}

interface VehicleContextType {
  selectedVehicle: SelectedVehicle | null;
  setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
  clearVehicle: () => void;
  makes: VehicleMake[];
  models: VehicleModel[];
  variants: VehicleVariant[];
  selectedMakeId: string;
  setSelectedMakeId: (id: string) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  isLoading: boolean;
}

const VEHICLE_STORAGE_KEY = 'vahn_selected_vehicle_v1';

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedVehicle, setSelectedVehicleState] = useState<SelectedVehicle | null>(() => {
    try {
      const stored = localStorage.getItem(VEHICLE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);

  const [selectedMakeId, setSelectedMakeId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    vehicleRepository
      .getMakes()
      .then((m) => {
        setMakes(m);
        setIsLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedMakeId) {
      vehicleRepository.getModelsByMake(selectedMakeId).then(setModels).catch(console.error);
    } else {
      setModels([]);
    }
    setSelectedModelId('');
    setVariants([]);
  }, [selectedMakeId]);

  useEffect(() => {
    if (selectedModelId) {
      vehicleRepository.getVariantsByModel(selectedModelId).then(setVariants).catch(console.error);
    } else {
      setVariants([]);
    }
  }, [selectedModelId]);

  const setSelectedVehicle = (vehicle: SelectedVehicle | null) => {
    setSelectedVehicleState(vehicle);
    try {
      if (vehicle) {
        localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicle));
      } else {
        localStorage.removeItem(VEHICLE_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to save vehicle selection', err);
    }
  };

  const clearVehicle = () => {
    setSelectedVehicle(null);
    setSelectedMakeId('');
    setSelectedModelId('');
  };

  return (
    <VehicleContext.Provider
      value={{
        selectedVehicle,
        setSelectedVehicle,
        clearVehicle,
        makes,
        models,
        variants,
        selectedMakeId,
        setSelectedMakeId,
        selectedModelId,
        setSelectedModelId,
        isLoading,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};
