import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { dbFirestore, auth } from '@/lib/firebase';
import { db } from '@/lib/db';
import type { Position, WatchlistItem, PriceAlert, Broker } from '@/types';

export interface UserPortfolioCloudData {
  positions: Position[];
  watchlist: WatchlistItem[];
  alerts: PriceAlert[];
  brokers: Broker[];
  updatedAt: string;
}

let unsubscribeSnapshot: (() => void) | null = null;

export async function syncLocalToCloud() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const positions = await db.positions.toArray();
    const watchlist = await db.watchlist.toArray();
    const alerts = await db.priceAlerts.toArray();
    const brokers = await db.brokers.toArray();

    const userRef = doc(dbFirestore, 'users', user.uid);
    await setDoc(userRef, {
      positions,
      watchlist,
      alerts,
      brokers,
      updatedAt: new Date().toISOString(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync portfolio to cloud:', err);
  }
}

export async function syncCloudToLocal(userId: string) {
  try {
    const userRef = doc(dbFirestore, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserPortfolioCloudData;

      if (data.positions && Array.isArray(data.positions) && data.positions.length > 0) {
        await db.positions.clear();
        await db.positions.bulkAdd(data.positions);
      }
      if (data.watchlist && Array.isArray(data.watchlist) && data.watchlist.length > 0) {
        await db.watchlist.clear();
        await db.watchlist.bulkAdd(data.watchlist);
      }
      if (data.brokers && Array.isArray(data.brokers) && data.brokers.length > 0) {
        await db.brokers.clear();
        await db.brokers.bulkAdd(data.brokers);
      }
    } else {
      // First time user: backup current local to cloud
      await syncLocalToCloud();
    }
  } catch (err) {
    console.error('Failed to sync cloud portfolio to local:', err);
  }
}

export function startRealtimeSync(userId: string) {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
  }

  const userRef = doc(dbFirestore, 'users', userId);
  unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as UserPortfolioCloudData;
      // Auto refresh local if cloud is newer
    }
  });
}

export function stopRealtimeSync() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
}
