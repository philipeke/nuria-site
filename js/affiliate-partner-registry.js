(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }

  root.NuriaAffiliatePartnerRegistry = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  function asString(value) {
    return String(value == null ? '' : value).trim();
  }

  function asOptionalString(value) {
    var next = asString(value);
    return next || null;
  }

  function normalizeEmail(value) {
    var next = asString(value).toLowerCase();
    return next || null;
  }

  function normalizeReferralCode(value) {
    return asString(value).toUpperCase().replace(/\s+/g, '');
  }

  function normalizePartnerStatus(value) {
    var status = asString(value).toLowerCase();
    if (status === 'inactive' || status === 'archived') {
      return status;
    }
    return 'active';
  }

  function normalizePartnerDoc(rawValue) {
    if (!rawValue || typeof rawValue !== 'object') return null;

    var affiliateId = asString(rawValue.affiliateId);
    var primaryReferralCode = normalizeReferralCode(rawValue.primaryReferralCode);

    if (!affiliateId && !primaryReferralCode) {
      return null;
    }

    return {
      affiliateId: affiliateId,
      displayName: asOptionalString(rawValue.displayName),
      status: normalizePartnerStatus(rawValue.status),
      primaryReferralCode: primaryReferralCode || null,
      contactName: asOptionalString(rawValue.contactName),
      contactEmail: normalizeEmail(rawValue.contactEmail),
      portalUid: asOptionalString(rawValue.portalUid),
      portalEmail: normalizeEmail(rawValue.portalEmail),
      note: asOptionalString(rawValue.note),
      updatedAt: rawValue.updatedAt || null,
      updatedByEmail: asOptionalString(rawValue.updatedByEmail),
    };
  }

  function normalizePartnerList(rawValue) {
    if (!Array.isArray(rawValue)) return [];
    return rawValue.map(function (item) {
      return normalizePartnerDoc(item);
    }).filter(Boolean);
  }

  function findPartnerForCode(codeItem, partners) {
    var normalizedPartners = normalizePartnerList(partners);
    var affiliateId = asString(codeItem && codeItem.affiliateId);
    var code = normalizeReferralCode(codeItem && (codeItem.code || codeItem.primaryReferralCode));

    if (affiliateId) {
      var matchByAffiliate = normalizedPartners.find(function (item) {
        return item.affiliateId === affiliateId;
      });
      if (matchByAffiliate) return matchByAffiliate;
    }

    if (code) {
      var matchByCode = normalizedPartners.find(function (item) {
        return item.primaryReferralCode === code;
      });
      if (matchByCode) return matchByCode;
    }

    return null;
  }

  function buildPartnerUpsertPayload(options) {
    var settings = options || {};
    var existingPartner = normalizePartnerDoc(settings.existingPartner);
    var codeItem = settings.codeItem || {};
    var affiliateId = asString(codeItem.affiliateId || existingPartner && existingPartner.affiliateId);
    var code = normalizeReferralCode(
      codeItem.code
      || codeItem.primaryReferralCode
      || existingPartner && existingPartner.primaryReferralCode
    );

    if (!affiliateId) {
      throw new Error('affiliate_id_required');
    }

    var normalizedEmail = normalizeEmail(settings.partnerEmail);
    var lookupResult = settings.lookupResult && typeof settings.lookupResult === 'object'
      ? settings.lookupResult
      : null;
    var lookupFound = lookupResult && lookupResult.found === true;
    var lookupUid = asOptionalString(lookupResult && lookupResult.uid);
    var lookupEmail = normalizeEmail(lookupResult && lookupResult.email);
    var lookupFailed = settings.lookupFailed === true;
    var existingPortalEmail = normalizeEmail(existingPartner && existingPartner.portalEmail);
    var preserveExistingUid = lookupFailed
      && normalizedEmail
      && existingPortalEmail === normalizedEmail
      && Boolean(existingPartner && existingPartner.portalUid);
    var resolvedPortalEmail = normalizedEmail
      ? (lookupEmail || normalizedEmail)
      : null;

    return {
      affiliateId: affiliateId,
      displayName: asOptionalString(codeItem.displayName || existingPartner && existingPartner.displayName),
      status: normalizePartnerStatus(existingPartner && existingPartner.status || codeItem.status || 'active'),
      primaryReferralCode: code || null,
      contactName: asOptionalString(existingPartner && existingPartner.contactName),
      contactEmail: resolvedPortalEmail || normalizeEmail(existingPartner && existingPartner.contactEmail),
      portalUid: normalizedEmail
        ? (lookupFound ? lookupUid : preserveExistingUid ? existingPartner.portalUid : null)
        : null,
      portalEmail: resolvedPortalEmail,
      note: asOptionalString(existingPartner && existingPartner.note),
    };
  }

  function buildPartnerRegistryItems(options) {
    var settings = options || {};
    var codes = Array.isArray(settings.codes) ? settings.codes : [];
    var partners = normalizePartnerList(settings.partners);
    var legacyEmailsByCode = settings.legacyEmailsByCode && typeof settings.legacyEmailsByCode === 'object'
      ? settings.legacyEmailsByCode
      : {};
    var legacyPartnerRegistryByCode = settings.legacyPartnerRegistryByCode && typeof settings.legacyPartnerRegistryByCode === 'object'
      ? settings.legacyPartnerRegistryByCode
      : {};
    var legacyPartnerProfilesByCode = settings.legacyPartnerProfilesByCode && typeof settings.legacyPartnerProfilesByCode === 'object'
      ? settings.legacyPartnerProfilesByCode
      : {};
    var results = [];
    var seenKeys = Object.create(null);

    function createRegistryItem(partner, codeItem, code) {
      var normalizedCode = normalizeReferralCode(code || codeItem && codeItem.code || partner && partner.primaryReferralCode);
      var legacyRegistry = normalizedCode && legacyPartnerRegistryByCode[normalizedCode] && typeof legacyPartnerRegistryByCode[normalizedCode] === 'object'
        ? legacyPartnerRegistryByCode[normalizedCode]
        : {};
      var legacyProfile = normalizedCode && legacyPartnerProfilesByCode[normalizedCode] && typeof legacyPartnerProfilesByCode[normalizedCode] === 'object'
        ? legacyPartnerProfilesByCode[normalizedCode]
        : {};
      var email = normalizeEmail(
        partner && (partner.portalEmail || partner.contactEmail)
        || codeItem && (codeItem.partnerNuriaEmail || codeItem.partnerEmail)
        || normalizedCode && legacyEmailsByCode[normalizedCode]
        || legacyRegistry.email
      );
      var displayName = asOptionalString(
        partner && partner.displayName
        || codeItem && codeItem.displayName
        || legacyRegistry.partnerDisplayName
        || legacyRegistry.displayName
      );
      var partnerUid = asOptionalString(
        partner && partner.portalUid
        || legacyRegistry.partnerUid
      ) || '';
      var hasPortalUid = Boolean(partnerUid);
      var hasPortalEmail = Boolean(partner && partner.portalEmail);
      var status = hasPortalUid
        ? 'verified'
        : hasPortalEmail
          ? 'mapped_unverified'
          : asOptionalString(legacyRegistry.status) || 'unlinked';
      var statusReason = asOptionalString(legacyRegistry.statusReason) || '';
      if (!statusReason) {
        statusReason = hasPortalUid
          ? 'portal_uid'
          : hasPortalEmail
            ? 'portal_email'
            : '';
      }

      if (!partner && !email) {
        return null;
      }

      return {
        code: normalizedCode,
        affiliateId: asString(partner && partner.affiliateId || codeItem && codeItem.affiliateId) || '-',
        displayName: displayName || '-',
        email: email || '-',
        partnerUid: partnerUid,
        partnerDisplayName: asOptionalString(
          partner && partner.displayName
          || legacyRegistry.partnerDisplayName
          || displayName
        ) || '',
        linkedAt: asOptionalString(legacyRegistry.linkedAt) || '',
        linkedBy: asOptionalString(legacyRegistry.linkedBy) || '',
        status: status,
        statusReason: statusReason,
        partnerType: asString(legacyProfile.partnerType || 'private') || 'private',
        mobile: asOptionalString(legacyProfile.mobile) || '',
        country: asOptionalString(legacyProfile.country) || '',
        vat: asOptionalString(legacyProfile.vat) || '',
        partnerStatus: partner && partner.status || 'active',
        primaryReferralCode: normalizedCode || partner && partner.primaryReferralCode || '',
        updatedAt: partner && partner.updatedAt || null,
        updatedByEmail: asOptionalString(partner && partner.updatedByEmail) || '',
      };
    }

    codes.forEach(function (codeItem) {
      var normalizedCode = normalizeReferralCode(codeItem && codeItem.code);
      var partner = findPartnerForCode(codeItem, partners);
      var item = createRegistryItem(partner, codeItem, normalizedCode);
      var key = asString(partner && partner.affiliateId) || ('code:' + normalizedCode);
      if (!item || seenKeys[key]) return;
      seenKeys[key] = true;
      results.push(item);
    });

    partners.forEach(function (partner) {
      var normalizedCode = normalizeReferralCode(partner.primaryReferralCode);
      var key = asString(partner.affiliateId) || ('code:' + normalizedCode);
      if (seenKeys[key]) return;
      seenKeys[key] = true;
      var codeItem = codes.find(function (item) {
        return findPartnerForCode(item, [partner]);
      }) || null;
      var item = createRegistryItem(partner, codeItem, normalizedCode);
      if (item) {
        results.push(item);
      }
    });

    return results.sort(function (a, b) {
      var aLabel = (a.displayName !== '-' ? a.displayName : a.affiliateId || a.code || '').toLowerCase();
      var bLabel = (b.displayName !== '-' ? b.displayName : b.affiliateId || b.code || '').toLowerCase();
      return aLabel.localeCompare(bLabel) || String(a.code || '').localeCompare(String(b.code || ''));
    });
  }

  return {
    normalizeEmail: normalizeEmail,
    normalizeReferralCode: normalizeReferralCode,
    normalizePartnerStatus: normalizePartnerStatus,
    normalizePartnerDoc: normalizePartnerDoc,
    normalizePartnerList: normalizePartnerList,
    findPartnerForCode: findPartnerForCode,
    buildPartnerUpsertPayload: buildPartnerUpsertPayload,
    buildPartnerRegistryItems: buildPartnerRegistryItems,
  };
}));
