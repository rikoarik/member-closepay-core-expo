/**
 * useInstallmentSimulation
 * Simulasi cicilan: tenor 3/6/12 bulan, bunga, admin, jadwal pembayaran
 */

import { useMemo, useState, useCallback } from 'react';

export interface TenorOption {
  months: number;
  interestRatePerMonth: number; // e.g. 0.015 = 1.5%
  adminFee: number;
  label: string;
}

const DEFAULT_TENORS: TenorOption[] = [
  { months: 3, interestRatePerMonth: 0, adminFee: 0, label: '3 Bulan' },
  { months: 6, interestRatePerMonth: 0.015, adminFee: 15000, label: '6 Bulan' },
  { months: 12, interestRatePerMonth: 0.025, adminFee: 25000, label: '12 Bulan' },
];

export interface InstallmentScheduleItem {
  sequenceNumber: number;
  dueDate: string; // ISO
  amount: number;
}

export interface InstallmentSimulation {
  tenor: number;
  principalAmount: number;
  totalInterest: number;
  adminFee: number;
  totalAmount: number;
  monthlyPayment: number;
  schedule: InstallmentScheduleItem[];
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function useInstallmentSimulation(principalAmount: number) {
  const [selectedTenorMonths, setSelectedTenorMonths] = useState<number>(3);

  const simulation: InstallmentSimulation | null = useMemo(() => {
    if (principalAmount <= 0) return null;
    const option = DEFAULT_TENORS.find((t) => t.months === selectedTenorMonths) ?? DEFAULT_TENORS[0];
    const { months, interestRatePerMonth, adminFee } = option;
    const totalInterest = months * interestRatePerMonth * principalAmount;
    const totalWithInterest = principalAmount + totalInterest;
    const monthlyPayment = Math.ceil(totalWithInterest / months);
    const totalAmount = monthlyPayment * months + adminFee;
    const schedule: InstallmentScheduleItem[] = [];
    const start = new Date();
    for (let i = 0; i < months; i++) {
      const dueDate = addMonths(start, i + 1);
      const isLast = i === months - 1;
      const amount = isLast ? totalWithInterest - monthlyPayment * (months - 1) : monthlyPayment;
      schedule.push({
        sequenceNumber: i + 1,
        dueDate: dueDate.toISOString(),
        amount,
      });
    }
    return {
      tenor: months,
      principalAmount,
      totalInterest,
      adminFee,
      totalAmount,
      monthlyPayment,
      schedule,
    };
  }, [principalAmount, selectedTenorMonths]);

  const tenorOptions = DEFAULT_TENORS;
  const setTenor = useCallback((months: number) => {
    setSelectedTenorMonths(months);
  }, []);

  return {
    simulation,
    selectedTenorMonths,
    tenorOptions,
    setTenor,
  };
}
