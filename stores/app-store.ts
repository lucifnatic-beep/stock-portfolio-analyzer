import { create } from 'zustand';
import type { Timeframe, IndicatorType, ChartType, Locale, SupportedCurrency } from '@/types';

interface AppState {
  // Active stock
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;

  // Active broker tab ('all' | 't212' | 'bcr' | 'investimental' | string)
  activeBroker: string;
  setActiveBroker: (broker: string) => void;

  // Currency
  baseCurrency: SupportedCurrency;
  setBaseCurrency: (currency: SupportedCurrency) => void;

  // Chart settings
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  activeIndicators: Set<IndicatorType>;
  toggleIndicator: (indicator: IndicatorType) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // i18n
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSymbol: 'AAPL',
  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),

  activeBroker: 'all',
  setActiveBroker: (activeBroker) => set({ activeBroker }),

  baseCurrency: 'USD',
  setBaseCurrency: (baseCurrency) => set({ baseCurrency }),

  timeframe: '1y',
  setTimeframe: (timeframe) => set({ timeframe }),
  chartType: 'candlestick',
  setChartType: (chartType) => set({ chartType }),
  activeIndicators: new Set<IndicatorType>(['volume']),
  toggleIndicator: (indicator) =>
    set((state) => {
      const next = new Set(state.activeIndicators);
      if (next.has(indicator)) {
        next.delete(indicator);
      } else {
        next.add(indicator);
      }
      return { activeIndicators: next };
    }),

  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),

  locale: 'en',
  setLocale: (locale) => set({ locale }),
}));
