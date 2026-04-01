import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const REGION = 'europe-west1';
const ADMIN_USERS_COLLECTION = 'admin_users';
const USER_COLLECTION = 'users'; // <-- set to your canonical Nuria users collection
const USER_EMAIL_LOWER_FIELD = 'email_lc'; // <-- preferred normalized email field
const USER_EMAIL_RAW_FIELD = 'email';

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function assertAffiliateAdmin(uid: string): Promise<void> {
  const snap = await db.collection(ADMIN_USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError('permission-denied', 'admin_access_required');
  }

  const data = snap.data() || {};
  const active = data.active !== false;
  const role = String(data.role || '').trim().toLowerCase();
  const roles = Array.isArray(data.roles) ? data.roles.map((v: unknown) => String(v || '').trim().toLowerCase()) : [];
  const hasRole = role === 'affiliate_admin' || roles.includes('affiliate_admin');

  if (!active) {
    throw new HttpsError('permission-denied', 'admin_access_disabled');
  }
  if (!hasRole) {
    throw new HttpsError('permission-denied', 'admin_role_required');
  }
}

async function findUserByEmail(normalizedEmail: string) {
  let snapshot = await db
    .collection(USER_COLLECTION)
    .where(USER_EMAIL_LOWER_FIELD, '==', normalizedEmail)
    .limit(1)
    .get();

  if (snapshot.empty && USER_EMAIL_RAW_FIELD !== USER_EMAIL_LOWER_FIELD) {
    snapshot = await db
      .collection(USER_COLLECTION)
      .where(USER_EMAIL_RAW_FIELD, '==', normalizedEmail)
      .limit(1)
      .get();
  }

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data() || {};
  return {
    uid: String(data.uid || doc.id),
    email: normalizeEmail(data[USER_EMAIL_RAW_FIELD] || normalizedEmail),
    displayName: String(data.displayName || data.name || '').trim(),
    disabled: data.disabled === true,
  };
}

export const lookupNuriaPartnerByEmailAdmin = onCall({ region: REGION }, async (request) => {
  const authUid = request.auth?.uid;
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'admin_access_required');
  }

  await assertAffiliateAdmin(authUid);

  const normalizedEmail = normalizeEmail(request.data?.email);
  if (!isValidEmail(normalizedEmail)) {
    throw new HttpsError('invalid-argument', 'invalid_email');
  }

  try {
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return {
        found: false,
        email: normalizedEmail,
        source: 'users_exact',
      };
    }

    // Strict behavior: disabled users are treated as not found.
    if (user.disabled) {
      return {
        found: false,
        email: normalizedEmail,
        source: 'users_exact_disabled',
      };
    }

    return {
      found: true,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      source: 'users_exact',
    };
  } catch (error) {
    logger.error('lookupNuriaPartnerByEmailAdmin failed', {
      email: normalizedEmail,
      actorUid: authUid,
      error,
      atIso: new Date().toISOString(),
    });
    throw new HttpsError('internal', 'partner_lookup_failed');
  }
});

// Legacy callable alias for older frontend compatibility.
export const findNuriaPartnerByEmailAdmin = lookupNuriaPartnerByEmailAdmin;

