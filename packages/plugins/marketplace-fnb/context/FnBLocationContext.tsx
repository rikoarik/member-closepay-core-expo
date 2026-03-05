/**
 * FnBLocationContext – Shared delivery address for FnB (pill on home + checkout).
 */

import React, { createContext, useContext, useState, useCallback } from "react";

export interface FnBLocationContextValue {
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
}

const defaultValue: FnBLocationContextValue = {
  deliveryAddress: "",
  setDeliveryAddress: () => {},
};

export const FnBLocationContext = createContext<FnBLocationContextValue>(defaultValue);

export function useFnBLocation(): FnBLocationContextValue {
  const ctx = useContext(FnBLocationContext);
  return ctx ?? defaultValue;
}

export const FnBLocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [deliveryAddress, setDeliveryAddressState] = useState("");
  const setDeliveryAddress = useCallback((address: string) => {
    setDeliveryAddressState(address);
  }, []);
  const value: FnBLocationContextValue = {
    deliveryAddress,
    setDeliveryAddress,
  };
  return (
    <FnBLocationContext.Provider value={value}>
      {children}
    </FnBLocationContext.Provider>
  );
};
