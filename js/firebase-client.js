import {
  initializeApp,
  getApps,
  getApp,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
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
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const config = window.NURIA_SITE_CONFIG || {};
const firebaseConfig = config.firebase || {};
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
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

setPersistence(auth, browserLocalPersistence).catch(() => {});

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

export async function callFirebaseFunction(name, data) {
  const callable = httpsCallable(functions, name);
  const result = await callable(data || {});
  return result.data;
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

export { auth, db, functions, firebaseApp };
