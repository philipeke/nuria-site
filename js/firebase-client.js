import {
  initializeApp,
  getApps,
  getApp,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFunctions,
  httpsCallable,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const config = window.NURIA_SITE_CONFIG || {};
const firebaseConfig = config.firebase || {};
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const appCheckSiteKey = String(config.firebaseAppCheckSiteKey || '').trim();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const functions = getFunctions(
  firebaseApp,
  config.firebaseFunctionsRegion || 'us-central1'
);
const googleProvider = new GoogleAuthProvider();
const complianceMode = String(config.affiliateAdminComplianceMode || 'callable_only').trim().toLowerCase();
const callableOnlyMode = complianceMode === 'callable_only';

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => {});
let appCheckReady = Promise.resolve(null);

if (appCheckSiteKey) {
  try {
    const appCheck = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckReady = Promise.resolve(appCheck);
  } catch (error) {
    console.warn('[firebase-client] App Check initialization failed', error);
    appCheckReady = Promise.resolve(null);
  }
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmailPassword(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function waitForAuthPersistenceReady() {
  await authPersistenceReady;
}

export function isAppCheckConfigured() {
  return Boolean(appCheckSiteKey);
}

export async function waitForAppCheckReady() {
  await appCheckReady;
}

export async function callFirebaseFunction(name, data) {
  await appCheckReady;
  const callable = httpsCallable(functions, name);
  try {
    const result = await callable(data || {});
    return result.data;
  } catch (error) {
    error.adminCallable = name;
    throw error;
  }
}

function makeComplianceError(feature, cause) {
  const error = new Error(
    `Callable-only compliance is enabled. Backend callable for "${feature}" is missing or inaccessible.`
  );
  error.code = 'failed-precondition';
  error.cause = cause;
  return error;
}

function isMissingCallableError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return (
    code.includes('unimplemented')
    || message.includes('unimplemented')
    || message.includes('not found')
    || message.includes('no function')
  );
}

async function callWithCompat(callableNames, data) {
  let lastError = null;
  for (const callableName of callableNames) {
    try {
      return await callFirebaseFunction(callableName, data);
    } catch (error) {
      lastError = error;
      if (!isMissingCallableError(error)) {
        throw error;
      }
    }
  }
  throw lastError || new Error('callable_not_found');
}

function toIsoTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return null;
}

export async function addAffiliateAdminAuditLog(entry) {
  const payload = Object.assign({}, entry || {});

  try {
    await callWithCompat(
      ['writeAffiliateAdminAuditLog', 'addAffiliateAdminAuditLog'],
      payload
    );
    return;
  } catch (error) {
    if (callableOnlyMode) {
      throw makeComplianceError('writeAffiliateAdminAuditLog', error);
    }
  }

  const firestorePayload = Object.assign({}, payload, {
    createdAt: serverTimestamp(),
  });
  await addDoc(collection(db, 'internal_admin_affiliate_audit_logs'), firestorePayload);
}

export async function listAffiliateAdminAuditLogs(limitCount) {
  const safeLimit = Number(limitCount) > 0 ? Number(limitCount) : 60;

  try {
    const data = await callWithCompat(
      ['listAffiliateAdminAuditLogs'],
      { limit: safeLimit }
    );
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((item) => {
      return Object.assign({}, item, {
        createdAtIso: item.createdAtIso || item.createdAt || null,
      });
    });
  } catch (error) {
    if (callableOnlyMode) {
      throw makeComplianceError('listAffiliateAdminAuditLogs', error);
    }
  }

  const snapshot = await getDocs(
    query(
      collection(db, 'internal_admin_affiliate_audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(safeLimit)
    )
  );

  return snapshot.docs.map((row) => {
    const data = row.data() || {};
    return Object.assign({}, data, {
      id: row.id,
      createdAtIso: toIsoTimestamp(data.createdAt),
    });
  });
}

export async function getAffiliateAdminSettings() {
  try {
    const data = await callWithCompat(
      ['getAffiliateAdminSettings'],
      {}
    );
    return data || {};
  } catch (error) {
    if (callableOnlyMode) {
      throw makeComplianceError('getAffiliateAdminSettings', error);
    }
  }

  const ref = doc(db, 'internal_admin', 'affiliate_admin_settings');
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() || {}) : {};
}

export async function saveAffiliateAdminSettings(patch) {
  try {
    await callWithCompat(
      ['setAffiliateAdminSettings', 'setAffiliateReportRecipientsAdmin'],
      patch || {}
    );
    return;
  } catch (error) {
    if (callableOnlyMode) {
      throw makeComplianceError('setAffiliateAdminSettings', error);
    }
  }

  const ref = doc(db, 'internal_admin', 'affiliate_admin_settings');
  await setDoc(
    ref,
    Object.assign({}, patch || {}, {
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );
}

async function lookupPartnerInCollection(collectionName, email) {
  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      where('email', '==', email),
      limit(1)
    )
  );
  if (!snapshot.empty) {
    const row = snapshot.docs[0];
    const data = row.data() || {};
    return {
      found: true,
      uid: data.uid || row.id,
      email: data.email || email,
      displayName: data.displayName || data.name || '',
      source: `firestore:${collectionName}`,
    };
  }
  return null;
}

export async function lookupNuriaPartnerByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return { found: false, source: 'invalid_email' };
  }

  try {
    const data = await callWithCompat(
      ['lookupNuriaPartnerByEmailAdmin', 'findNuriaPartnerByEmailAdmin'],
      { email: normalizedEmail }
    );
    return Object.assign({ found: false, source: 'callable' }, data || {});
  } catch (error) {
    if (callableOnlyMode) {
      throw makeComplianceError('lookupNuriaPartnerByEmailAdmin', error);
    }
  }

  const collectionsToProbe = ['users', 'profiles', 'accounts'];
  for (const collectionName of collectionsToProbe) {
    try {
      const result = await lookupPartnerInCollection(collectionName, normalizedEmail);
      if (result) return result;
    } catch (_error) {
      // ignore fallback probe errors; continue next candidate
    }
  }

  return {
    found: false,
    email: normalizedEmail,
    source: 'firestore:fallback',
  };
}

export async function getSubscriberStatsByCode() {
  try {
    const data = await callWithCompat(
      ['getSubscriberStatsByCodeAdmin'],
      {}
    );
    return Array.isArray(data?.codes) ? data.codes : [];
  } catch (error) {
    if (callableOnlyMode) {
      throw makeComplianceError('getSubscriberStatsByCodeAdmin', error);
    }
  }

  const snapshot = await getDocs(
    query(
      collection(db, 'referral_subscriber_stats'),
      orderBy('code', 'asc'),
      limit(500)
    )
  );

  return snapshot.docs.map((row) => {
    const data = row.data() || {};
    return {
      code: data.code || row.id,
      activeNow: data.activeNow ?? 0,
      totalCurrent: data.totalCurrent ?? 0,
      totalHistorical: data.totalHistorical ?? 0,
      churned: data.churned ?? 0,
      trialActive: data.trialActive ?? 0,
      lastUpdatedIso: toIsoTimestamp(data.lastUpdated) || data.lastUpdatedIso || null,
    };
  });
}

export { auth, db, functions, firebaseApp };
