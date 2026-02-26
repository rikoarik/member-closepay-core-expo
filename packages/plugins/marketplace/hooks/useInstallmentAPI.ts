/**
 * useInstallmentAPI
 * Config cicilan dari backend + calculator adaptif (DP, tenor/count, bunga)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { installmentApiService, DEFAULT_INSTALLMENT_CONFIG } from '../services/installmentApiService';
import type { InstallmentConfig } from '../models/MarketplaceInstallment';
import type { CreateInstallmentOrderParams, CreateInstallmentOrderResult } from '../services/installmentApiService';
import type { InstallmentTransaction } from '../services/installmentApiService';

export interface InstallmentCalculateResult {
  monthlyAmount: number;
  totalInterest: number;
  totalPayment: number;
  remaining: number;
  interestRatePerMonth: number;
}

export function useInstallmentAPI() {
  const [config, setConfig] = useState<InstallmentConfig>(DEFAULT_INSTALLMENT_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setLoadingConfig(true);
    installmentApiService.getConfig().then((c) => {
      if (!cancelledRef.current) {
        setConfig(c);
      }
    }).finally(() => {
      if (!cancelledRef.current) {
        setLoadingConfig(false);
      }
    });
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  /**
   * Calculator — adaptif berdasarkan config backend.
   * sisa = total - dp; totalInterest = sisa * interest * count; monthly = (sisa + totalInterest) / count
   */
  const calculate = useCallback(
    (
      total: number,
      dp: number,
      count: number,
      options?: { interestRatePerMonth?: number }
    ): InstallmentCalculateResult => {
      const sisa = Math.max(0, total - dp);
      const interest = options?.interestRatePerMonth ?? config.interestRatePerMonth ?? 0;
      const totalInterest = sisa * interest * count;
      const monthlyAmount = count > 0 ? Math.ceil((sisa + totalInterest) / count) : 0;
      const totalPayment = dp + sisa + totalInterest;
      return {
        monthlyAmount,
        totalInterest,
        totalPayment,
        remaining: sisa,
        interestRatePerMonth: interest,
      };
    },
    [config.interestRatePerMonth]
  );

  const submitOrder = useCallback(
    async (params: CreateInstallmentOrderParams): Promise<CreateInstallmentOrderResult> => {
      return installmentApiService.createOrder(params);
    },
    []
  );

  const getTransactions = useCallback(
    async (status: 'NOT_PAID' | 'PAID'): Promise<InstallmentTransaction[]> => {
      return installmentApiService.getTransactions(status);
    },
    []
  );

  const payInstallment = useCallback(
    async (installmentId: string): Promise<{ checkoutLink: string }> => {
      return installmentApiService.checkoutInstallment(installmentId);
    },
    []
  );

  const checkoutDP = useCallback(
    async (transactionId: string): Promise<{ checkoutLink: string }> => {
      return installmentApiService.checkoutDP(transactionId);
    },
    []
  );

  const checkStatus = useCallback(
    async (orderId: string) => {
      return installmentApiService.checkStatus(orderId);
    },
    []
  );

  return {
    config,
    loadingConfig,
    calculate,
    submitOrder,
    getTransactions,
    payInstallment,
    checkoutDP,
    checkStatus,
  };
}
