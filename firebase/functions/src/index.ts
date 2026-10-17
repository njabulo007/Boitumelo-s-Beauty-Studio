/** Reference trusted operations. Review rules, App Check and owner-approved reward policy before deployment. */
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentWrittenWithAuthContext } from "firebase-functions/v2/firestore";
initializeApp();
const db = getFirestore();
// SAMPLE POLICY: owner must approve and coordinate the matching frontend rule before launch.
const VISITS_PER_REWARD = 5;
const options = { region: "europe-west1", enforceAppCheck: true };
function id(value: unknown) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
    throw new HttpsError("invalid-argument", "Invalid identifier.");
  return value;
}
function owner(
  auth: { uid: string; token: Record<string, unknown> } | undefined,
) {
  if (!auth || auth.token.admin !== true)
    throw new HttpsError("permission-denied", "Administrator access required.");
  return auth.uid;
}
export const recordVisit = onCall(options, async (request) => {
  const actor = owner(request.auth),
    customerId = id(request.data?.customerId),
    serviceId = id(request.data?.serviceId),
    operationId = id(request.data?.operationId);
  const op = db.doc(`operations/${actor}_${operationId}`),
    loyalty = db.doc(`loyalty/${customerId}`),
    visit = db.collection("visits").doc();
  return db.runTransaction(async (tx) => {
    const [previous, profile, service, balance] = await Promise.all([
      tx.get(op),
      tx.get(db.doc(`profiles/${customerId}`)),
      tx.get(db.doc(`services/${serviceId}`)),
      tx.get(loyalty),
    ]);
    if (previous.exists) {
      if (
        previous.data()?.kind !== "visit" ||
        previous.data()?.customerId !== customerId ||
        previous.data()?.serviceId !== serviceId
      )
        throw new HttpsError(
          "already-exists",
          "Operation identifier already used.",
        );
      return previous.data();
    }
    if (!profile.exists || !service.exists || service.data()?.archived)
      throw new HttpsError("not-found", "Customer or service is unavailable.");
    const at = FieldValue.serverTimestamp();
    tx.create(visit, { customerId, serviceId, at, voided: false, actor });
    tx.set(loyalty, {
      visits: (balance.data()?.visits || 0) + 1,
      redeemed: balance.data()?.redeemed || 0,
      updatedAt: at,
    });
    const result = { kind: "visit", customerId, serviceId, id: visit.id };
    tx.create(op, result);
    tx.create(db.collection("audit").doc(), {
      action: "visit",
      subject: visit.id,
      customerId,
      actor,
      at,
    });
    return result;
  });
});
export const redeemReward = onCall(options, async (request) => {
  const actor = owner(request.auth),
    customerId = id(request.data?.customerId),
    operationId = id(request.data?.operationId),
    op = db.doc(`operations/${actor}_${operationId}`),
    loyalty = db.doc(`loyalty/${customerId}`),
    reward = db.collection("redemptions").doc();
  return db.runTransaction(async (tx) => {
    const [previous, balance] = await Promise.all([
      tx.get(op),
      tx.get(loyalty),
    ]);
    if (previous.exists) {
      if (
        previous.data()?.kind !== "redeem" ||
        previous.data()?.customerId !== customerId
      )
        throw new HttpsError(
          "already-exists",
          "Operation identifier already used.",
        );
      return previous.data();
    }
    const data = balance.data();
    if (
      !data ||
      Math.floor(data.visits / VISITS_PER_REWARD) - data.redeemed < 1
    )
      throw new HttpsError(
        "failed-precondition",
        "No earned reward available.",
      );
    const at = FieldValue.serverTimestamp();
    tx.create(reward, { customerId, at, actor, ruleVersion: "sample-v1" });
    tx.update(loyalty, { redeemed: data.redeemed + 1, updatedAt: at });
    const result = { kind: "redeem", customerId, id: reward.id };
    tx.create(op, result);
    tx.create(db.collection("audit").doc(), {
      action: "redeem",
      subject: reward.id,
      customerId,
      actor,
      at,
    });
    return result;
  });
});
export const correctVisit = onCall(options, async (request) => {
  const actor = owner(request.auth),
    visitId = id(request.data?.visitId),
    operationId = id(request.data?.operationId),
    reason = request.data?.reason;
  if (
    typeof reason !== "string" ||
    reason.trim().length < 5 ||
    reason.length > 500
  )
    throw new HttpsError(
      "invalid-argument",
      "A correction reason is required.",
    );
  const op = db.doc(`operations/${actor}_${operationId}`),
    visit = db.doc(`visits/${visitId}`);
  return db.runTransaction(async (tx) => {
    const [previous, record] = await Promise.all([tx.get(op), tx.get(visit)]);
    if (previous.exists) {
      if (
        previous.data()?.kind !== "correct" ||
        previous.data()?.id !== visitId
      )
        throw new HttpsError(
          "already-exists",
          "Operation identifier already used.",
        );
      return previous.data();
    }
    const data = record.data();
    if (!data || data.voided)
      throw new HttpsError(
        "failed-precondition",
        "Visit unavailable or already corrected.",
      );
    const loyalty = db.doc(`loyalty/${id(data.customerId)}`),
      balance = (await tx.get(loyalty)).data();
    if (
      !balance ||
      balance.visits < 1 ||
      Math.floor((balance.visits - 1) / VISITS_PER_REWARD) < balance.redeemed
    )
      throw new HttpsError(
        "failed-precondition",
        "Visit supports a redeemed reward. Owner resolution required.",
      );
    const at = FieldValue.serverTimestamp();
    tx.update(visit, {
      voided: true,
      correctionReason: reason,
      correctedAt: at,
    });
    tx.update(loyalty, { visits: balance.visits - 1, updatedAt: at });
    const result = { kind: "correct", id: visitId };
    tx.create(op, result);
    tx.create(db.collection("audit").doc(), {
      action: "correct",
      subject: visitId,
      customerId: data.customerId,
      actor,
      reason,
      at,
    });
    return result;
  });
});
export const recordAnalytics = onCall(options, async (request) => {
  const { name, serviceId, ...extra } = request.data || {};
  if (
    Object.keys(extra).length ||
    ![
      "page_view",
      "service_view",
      "enquiry_click",
      "registration",
      "loyalty_view",
    ].includes(name)
  )
    throw new HttpsError("invalid-argument", "Unsupported event.");
  if (serviceId && !(await db.doc(`services/${id(serviceId)}`).get()).exists)
    throw new HttpsError("invalid-argument", "Unknown service.");
  await db
    .collection("analytics")
    .add({
      name,
      ...(serviceId ? { serviceId } : {}),
      at: FieldValue.serverTimestamp(),
    });
  return { recorded: true };
});
// Content audit is written by the backend; clients cannot alter it. Duplicate trigger deliveries use the same ID.
export const auditContent = onDocumentWrittenWithAuthContext(
  { document: "{kind}/{documentId}", region: "europe-west1" },
  async (event) => {
    if (!["services", "promotions", "gallery"].includes(event.params.kind))
      return;
    const before = event.data?.before.data(),
      after = event.data?.after.data();
    await db
      .doc(`audit/content_${event.id}`)
      .set({
        action: `${event.params.kind}_change`,
        subject: event.params.documentId,
        at: FieldValue.serverTimestamp(),
        before: before || null,
        after: after || null,
        actor: event.authId || event.authType || "system",
      });
  },
);
