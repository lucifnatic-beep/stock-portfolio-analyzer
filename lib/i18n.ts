import type { Locale } from '@/types';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.hotPicks': '🔥 Hot Picks',
    'nav.watchlist': 'Watchlist',
    'nav.alerts': 'Price Alerts',
    'nav.search': 'Search stocks...',
    'nav.settings': 'Settings',

    // Portfolio
    'portfolio.title': 'Portfolio Overview',
    'portfolio.totalValue': 'Total Value',
    'portfolio.totalPL': 'Total P&L',
    'portfolio.dayChange': 'Day Change',
    'portfolio.positions': 'Positions',
    'portfolio.addPosition': 'Add Position',
    'portfolio.symbol': 'Symbol',
    'portfolio.shares': 'Shares',
    'portfolio.avgCost': 'Avg Cost',
    'portfolio.currentPrice': 'Current Price',
    'portfolio.marketValue': 'Market Value',
    'portfolio.profitLoss': 'P&L',
    'portfolio.allocation': 'Allocation',
    'portfolio.noPositions': 'No positions yet. Add your first stock!',
    'portfolio.buyPrice': 'Buy Price',
    'portfolio.buyDate': 'Buy Date',
    'portfolio.currency': 'Currency',
    'portfolio.notes': 'Notes (optional)',
    'portfolio.exchange': 'Exchange',
    'portfolio.delete': 'Delete',
    'portfolio.edit': 'Edit',
    'portfolio.importT212': 'Import Trading 212',
    'portfolio.importT212Desc': 'Upload or paste your Trading 212 CSV export to calculate and import open positions.',
    'portfolio.pasteCSV': 'Paste CSV content',
    'portfolio.uploadCSV': 'Upload CSV file',
    'portfolio.previewPositions': 'Positions Preview',
    'portfolio.importSuccess': 'Positions imported successfully!',

    // Charts
    'chart.timeframe': 'Timeframe',
    'chart.indicators': 'Indicators',
    'chart.candlestick': 'Candlestick',
    'chart.line': 'Line',

    // Analysis
    'analysis.technical': 'Technical Analysis',
    'analysis.fundamental': 'Fundamental Analysis',
    'analysis.comparison': 'Performance Comparison',
    'analysis.signal': 'Signal',
    'analysis.buy': 'Buy',
    'analysis.sell': 'Sell',
    'analysis.neutral': 'Neutral',

    // Alerts
    'alerts.title': 'Price Alerts',
    'alerts.addAlert': 'Add Alert',
    'alerts.above': 'Above',
    'alerts.below': 'Below',
    'alerts.targetPrice': 'Target Price',
    'alerts.active': 'Active',
    'alerts.triggered': 'Triggered',
    'alerts.noAlerts': 'No price alerts set.',

    // Watchlist
    'watchlist.title': 'Watchlist',
    'watchlist.add': 'Add to Watchlist',
    'watchlist.remove': 'Remove',
    'watchlist.empty': 'Your watchlist is empty.',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.noData': 'No data available',
    'common.exportJSON': 'Export JSON',
    'common.importJSON': 'Import JSON',
    'common.darkMode': 'Dark Mode',
    'common.language': 'Language',
  },
  ro: {
    // Navigation
    'nav.dashboard': 'Panou Principal',
    'nav.hotPicks': '🔥 Acțiuni HOT',
    'nav.watchlist': 'Listă Urmărire',
    'nav.alerts': 'Alerte Preț',
    'nav.search': 'Caută acțiuni...',
    'nav.settings': 'Setări',

    // Portfolio
    'portfolio.title': 'Prezentare Portofoliu',
    'portfolio.totalValue': 'Valoare Totală',
    'portfolio.totalPL': 'Profit/Pierdere',
    'portfolio.dayChange': 'Variație Zilnică',
    'portfolio.positions': 'Poziții',
    'portfolio.addPosition': 'Adaugă Poziție',
    'portfolio.symbol': 'Simbol',
    'portfolio.shares': 'Acțiuni',
    'portfolio.avgCost': 'Cost Mediu',
    'portfolio.currentPrice': 'Preț Curent',
    'portfolio.marketValue': 'Valoare Piață',
    'portfolio.profitLoss': 'P/P',
    'portfolio.allocation': 'Alocare',
    'portfolio.noPositions': 'Nicio poziție încă. Adaugă prima acțiune!',
    'portfolio.buyPrice': 'Preț Cumpărare',
    'portfolio.buyDate': 'Data Cumpărării',
    'portfolio.currency': 'Monedă',
    'portfolio.notes': 'Note (opțional)',
    'portfolio.exchange': 'Bursă',
    'portfolio.delete': 'Șterge',
    'portfolio.edit': 'Editează',
    'portfolio.importT212': 'Importă Trading 212',
    'portfolio.importT212Desc': 'Încarcă sau lipește exportul CSV din Trading 212 pentru a calcula și importa pozițiile deschise.',
    'portfolio.pasteCSV': 'Lipește conținutul CSV',
    'portfolio.uploadCSV': 'Încarcă fișier CSV',
    'portfolio.previewPositions': 'Previzualizare Poziții',
    'portfolio.importSuccess': 'Pozițiile au fost importate cu succes!',

    // Charts
    'chart.timeframe': 'Perioadă',
    'chart.indicators': 'Indicatori',
    'chart.candlestick': 'Lumânări',
    'chart.line': 'Linie',

    // Analysis
    'analysis.technical': 'Analiză Tehnică',
    'analysis.fundamental': 'Analiză Fundamentală',
    'analysis.comparison': 'Comparație Performanță',
    'analysis.signal': 'Semnal',
    'analysis.buy': 'Cumpără',
    'analysis.sell': 'Vinde',
    'analysis.neutral': 'Neutru',

    // Alerts
    'alerts.title': 'Alerte de Preț',
    'alerts.addAlert': 'Adaugă Alertă',
    'alerts.above': 'Peste',
    'alerts.below': 'Sub',
    'alerts.targetPrice': 'Preț Țintă',
    'alerts.active': 'Activă',
    'alerts.triggered': 'Declanșată',
    'alerts.noAlerts': 'Nicio alertă de preț setată.',

    // Watchlist
    'watchlist.title': 'Listă Urmărire',
    'watchlist.add': 'Adaugă la Urmărire',
    'watchlist.remove': 'Elimină',
    'watchlist.empty': 'Lista de urmărire este goală.',

    // Common
    'common.save': 'Salvează',
    'common.cancel': 'Anulează',
    'common.delete': 'Șterge',
    'common.confirm': 'Confirmă',
    'common.loading': 'Se încarcă...',
    'common.error': 'Eroare',
    'common.noData': 'Nu există date disponibile',
    'common.exportJSON': 'Exportă JSON',
    'common.importJSON': 'Importă JSON',
    'common.darkMode': 'Mod Întunecat',
    'common.language': 'Limbă',
  },
};

export function t(key: string, locale: Locale = 'en'): string {
  return translations[locale]?.[key] ?? key;
}

export function useTranslation(locale: Locale) {
  return (key: string) => t(key, locale);
}
