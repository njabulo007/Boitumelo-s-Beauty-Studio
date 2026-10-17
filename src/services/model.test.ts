import { describe, it, expect } from "vitest";
import {
  activePromotions,
  apply,
  customerView,
  displayedPrice,
  progress,
  seed,
} from "./model";
import type { State } from "./model";
const admin = { role: "admin" as const, id: "owner" };
function visit(state: State, token: string = crypto.randomUUID()) {
  return apply(state, admin, {
    type: "visit",
    customerId: "sample",
    serviceId: "gel",
    token,
  });
}
describe("owner-managed shared content", () => {
  it("ends incompatible offers when a regular price is reduced", () => {
    const s = seed();
    const n = apply(s, admin, {
      type: "service",
      service: { ...s.services[0], price: 150 },
    });
    expect(activePromotions(n)).toHaveLength(0);
    expect(displayedPrice(n, n.services[0])).toBe(150);
    expect(
      n.audit.some((a) => a.reason?.includes("updated regular price")),
    ).toBe(true);
  });
  it("reflects a changed regular service price", () => {
    const s = seed();
    s.promotions = [];
    const n = apply(s, admin, {
      type: "service",
      service: { ...s.services[0], price: 375 },
    });
    expect(displayedPrice(n, n.services[0])).toBe(375);
    expect(n.audit[0].action).toBe("service");
  });
  it("shows only published current offers and restores regular prices on expiry", () => {
    const s = seed();
    const p = s.promotions[0];
    expect(activePromotions(s, Date.parse(p.start))).toHaveLength(1);
    expect(displayedPrice(s, s.services[0], Date.parse(p.end) + 1)).toBe(250);
    s.promotions[0].published = false;
    expect(activePromotions(s)).toHaveLength(0);
  });
  it("renames categories across shared services and images", () => {
    let s = seed();
    s = apply(s, admin, {
      type: "category",
      name: "Nail care",
      previous: "Nails",
    });
    expect(s.services[0].category).toBe("Nail care");
    expect(s.photos[0].category).toBe("Nail care");
    expect(() =>
      apply(s, admin, { type: "removeCategory", name: "Nail care" }),
    ).toThrow("Move services");
  });
  it("hides offers linked to archived services", () => {
    const s = seed();
    s.services[0].archived = true;
    expect(activePromotions(s)).toHaveLength(0);
  });
  it("rejects invalid offer dates and higher prices", () => {
    const s = seed();
    expect(() =>
      apply(s, admin, {
        type: "promotion",
        promotion: { ...s.promotions[0], price: 300 },
      }),
    ).toThrow();
    expect(() =>
      apply(s, admin, {
        type: "promotion",
        promotion: { ...s.promotions[0], start: "invalid" },
      }),
    ).toThrow();
  });
  it("protects images referenced by offers from deletion", () => {
    expect(() =>
      apply(seed(), admin, { type: "removePhoto", id: "polish" }),
    ).toThrow("used by an offer");
  });
});
describe("loyalty authorisation and ledger", () => {
  it("rejects customer self-awarding and anonymous writes", () => {
    for (const actor of [null, { role: "customer" as const, id: "sample" }])
      expect(() =>
        apply(seed(), actor, {
          type: "visit",
          customerId: "sample",
          serviceId: "gel",
          token: "x",
        }),
      ).toThrow("Only the owner");
  });
  it("does not double count a retried visit", () => {
    const s = visit(seed(), "same-request");
    const retried = visit(s, "same-request");
    expect(retried).toBe(s);
    expect(progress(retried, "sample").visits).toBe(1);
    expect(retried.audit).toHaveLength(1);
  });
  it("awards only after five visits and redeems once per operation", () => {
    let s = seed();
    expect(() =>
      apply(s, admin, { type: "redeem", customerId: "sample", token: "r" }),
    ).toThrow();
    for (let i = 0; i < 5; i++) s = visit(s);
    expect(progress(s, "sample").available).toBe(1);
    s = apply(s, admin, { type: "redeem", customerId: "sample", token: "r" });
    s = apply(s, admin, { type: "redeem", customerId: "sample", token: "r" });
    expect(s.redemptions).toHaveLength(1);
    expect(progress(s, "sample").available).toBe(0);
  });
  it("preserves corrections with a reason and recalculates loyalty", () => {
    let s = visit(seed());
    const id = s.visits[0].id;
    expect(() =>
      apply(s, admin, { type: "voidVisit", id, reason: "x" }),
    ).toThrow();
    s = apply(s, admin, { type: "voidVisit", id, reason: "Duplicate entry" });
    expect(s.visits[0].voided).toBe(true);
    expect(progress(s, "sample").visits).toBe(0);
    expect(s.audit[0].reason).toBe("Duplicate entry");
  });
  it("rejects corrections that would invalidate a redeemed reward", () => {
    let s = seed();
    for (let i = 0; i < 5; i++) s = visit(s);
    s = apply(s, admin, { type: "redeem", customerId: "sample", token: "r" });
    expect(() =>
      apply(s, admin, {
        type: "voidVisit",
        id: s.visits[0].id,
        reason: "Correction requested",
      }),
    ).toThrow("supports a redeemed reward");
  });
  it("filters customer history to the signed-in identity", () => {
    let s = visit(seed());
    s.customers.push({
      id: "other",
      name: "Other",
      email: "other@example.test",
      marketing: false,
    });
    const view = customerView(s, { role: "customer", id: "other" });
    expect(view.visits).toHaveLength(0);
    expect(view.customer?.email).toBe("other@example.test");
    expect(() => customerView(s, null)).toThrow();
  });
});
