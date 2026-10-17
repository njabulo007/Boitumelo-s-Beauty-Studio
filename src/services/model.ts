import { photos, services, business, categories } from "../data/content";
import type { Photo, Service, Promotion } from "../data/content";
export type Customer = {
  id: string;
  name: string;
  email: string;
  marketing: boolean;
  passwordHash?: string;
  salt?: string;
};
export type Actor = { role: "customer" | "admin"; id: string } | null;
export type Visit = {
  id: string;
  customerId: string;
  serviceId: string;
  at: string;
  voided?: boolean;
};
export type Redemption = { id: string; customerId: string; at: string };
export type Audit = {
  id: string;
  at: string;
  action: string;
  actor: string;
  subject: string;
  reason?: string;
};
export type EventName =
  | "page_view"
  | "service_view"
  | "enquiry_click"
  | "registration"
  | "loyalty_view"
  | "visit_recorded"
  | "reward_redeemed";
export type MetricEvent = { name: EventName; at: string; subject?: string };
export type State = {
  version: 1;
  categories: string[];
  services: Service[];
  photos: Photo[];
  promotions: Promotion[];
  customers: Customer[];
  visits: Visit[];
  redemptions: Redemption[];
  audit: Audit[];
  processed: string[];
  events: MetricEvent[];
};
export function seed(): State {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 2);
  const end = new Date(now);
  end.setDate(end.getDate() + 21);
  return {
    version: 1,
    categories: [...categories],
    services: structuredClone(services),
    photos: structuredClone(photos),
    promotions: [
      {
        id: "welcome",
        title: "Your little midweek treat",
        description:
          "Make a little time for yourself with a fresh set of gel nails.",
        serviceId: "gel",
        price: 200,
        start: start.toISOString(),
        end: end.toISOString(),
        photoId: "polish",
        published: true,
      },
    ],
    customers: [
      {
        id: "sample",
        name: "Lerato (sample)",
        email: "lerato@example.test",
        marketing: false,
      },
    ],
    visits: [],
    redemptions: [],
    audit: [],
    processed: [],
    events: [],
  };
}
export function activePromotions(state: State, now = Date.now()) {
  return state.promotions.filter(
    (p) =>
      p.published &&
      Date.parse(p.start) <= now &&
      now <= Date.parse(p.end) &&
      state.services.some((s) => s.id === p.serviceId && !s.archived),
  );
}
export function displayedPrice(
  state: State,
  service: Service,
  now = Date.now(),
) {
  const offers = activePromotions(state, now).filter(
    (p) => p.serviceId === service.id,
  );
  return Math.min(service.price, ...offers.map((p) => p.price));
}
export function progress(state: State, customerId: string) {
  const visits = state.visits.filter(
    (v) => v.customerId === customerId && !v.voided,
  ).length;
  const redeemed = state.redemptions.filter(
    (r) => r.customerId === customerId,
  ).length;
  const available = Math.max(
    0,
    Math.floor(visits / business.loyalty.visits) - redeemed,
  );
  return {
    visits,
    redeemed,
    available,
    towards:
      available > 0
        ? business.loyalty.visits
        : visits % business.loyalty.visits,
  };
}
export type Command =
  | { type: "category"; name: string; previous?: string }
  | { type: "removeCategory"; name: string }
  | { type: "service"; service: Service }
  | { type: "moveService"; id: string; direction: number }
  | { type: "promotion"; promotion: Promotion }
  | { type: "photo"; photo: Photo }
  | { type: "removePhoto"; id: string }
  | { type: "movePhoto"; id: string; direction: number }
  | { type: "visit"; customerId: string; serviceId: string; token: string }
  | { type: "redeem"; customerId: string; token: string }
  | { type: "voidVisit"; id: string; reason: string };
export function apply(state: State, actor: Actor, command: Command): State {
  if (actor?.role !== "admin")
    throw new Error("Only the owner demo can make this change.");
  if ("token" in command && state.processed.includes(command.token))
    return state;
  const next = structuredClone(state);
  const id = crypto.randomUUID();
  const at = new Date().toISOString();
  let subject = "";
  let reason: string | undefined;
  switch (command.type) {
    case "category": {
      const name = command.name.trim();
      if (
        !name ||
        name.length > 30 ||
        next.categories.some(
          (c) =>
            c.toLowerCase() === name.toLowerCase() && c !== command.previous,
        )
      )
        throw new Error("Choose a unique category name, up to 30 characters.");
      if (command.previous) {
        if (!next.categories.includes(command.previous))
          throw new Error("Category not found.");
        next.categories = next.categories.map((c) =>
          c === command.previous ? name : c,
        );
        next.services = next.services.map((s) =>
          s.category === command.previous ? { ...s, category: name } : s,
        );
        next.photos = next.photos.map((p) =>
          p.category === command.previous ? { ...p, category: name } : p,
        );
      } else next.categories.push(name);
      subject = name;
      break;
    }
    case "removeCategory": {
      if (
        next.services.some((s) => s.category === command.name) ||
        next.photos.some((p) => p.category === command.name)
      )
        throw new Error(
          "Move services and photos to another category first, including archived services.",
        );
      next.categories = next.categories.filter((c) => c !== command.name);
      subject = command.name;
      break;
    }
    case "service": {
      const s = command.service;
      if (
        !next.categories.includes(s.category) ||
        s.name.length > 80 ||
        s.description.length > 400 ||
        !s.name.trim() ||
        !s.description.trim() ||
        !Number.isFinite(s.price) ||
        s.price < 0 ||
        !Number.isInteger(s.duration) ||
        s.duration < 1
      )
        throw new Error("Add a name, description, valid price and duration.");
      const i = next.services.findIndex((x) => x.id === s.id);
      if (i >= 0) next.services[i] = s;
      else next.services.push(s);
      next.promotions = next.promotions.map((p) => {
        if (p.serviceId !== s.id || !p.published || p.price < s.price) return p;
        next.audit.unshift({
          id: crypto.randomUUID(),
          at,
          action: "promotion",
          actor: actor.id,
          subject: p.id,
          reason:
            "Offer ended because its price is no longer below the updated regular price.",
        });
        return { ...p, published: false };
      });
      subject = s.id;
      break;
    }
    case "moveService":
    case "movePhoto": {
      const list = command.type === "moveService" ? next.services : next.photos;
      const i = list.findIndex((x) => x.id === command.id),
        j = i + command.direction;
      if (i >= 0 && j >= 0 && j < list.length)
        [list[i], list[j]] = [list[j], list[i]];
      subject = command.id;
      break;
    }
    case "promotion": {
      const p = command.promotion,
        s = next.services.find((s) => s.id === p.serviceId && !s.archived);
      if (
        !s ||
        !p.title.trim() ||
        !p.description.trim() ||
        !Number.isFinite(p.price) ||
        p.price < 0 ||
        p.price >= s.price ||
        !Number.isFinite(Date.parse(p.start)) ||
        !Number.isFinite(Date.parse(p.end)) ||
        Date.parse(p.start) > Date.parse(p.end) ||
        !next.photos.some((x) => x.id === p.photoId)
      )
        throw new Error(
          "Choose a service and photo, a lower price, and valid start and end dates.",
        );
      const i = next.promotions.findIndex((x) => x.id === p.id);
      if (i >= 0) next.promotions[i] = p;
      else next.promotions.push(p);
      subject = p.id;
      break;
    }
    case "photo": {
      const p = command.photo;
      if (
        !next.categories.includes(p.category) ||
        !p.caption.trim() ||
        p.caption.length > 100 ||
        !p.alt.trim() ||
        p.alt.length > 200 ||
        !p.url
      )
        throw new Error("Add a caption, image and alternative text.");
      const i = next.photos.findIndex((x) => x.id === p.id);
      if (i >= 0) next.photos[i] = p;
      else next.photos.push(p);
      subject = p.id;
      break;
    }
    case "removePhoto": {
      if (next.promotions.some((p) => p.photoId === command.id))
        throw new Error(
          "This photo is used by an offer. Choose another offer photo first.",
        );
      next.photos = next.photos.filter((x) => x.id !== command.id);
      subject = command.id;
      break;
    }
    case "visit": {
      if (
        !next.customers.some((c) => c.id === command.customerId) ||
        !next.services.some((s) => s.id === command.serviceId && !s.archived)
      )
        throw new Error("Select a customer and an available service.");
      next.visits.push({
        id,
        customerId: command.customerId,
        serviceId: command.serviceId,
        at,
      });
      subject = command.customerId;
      next.events.push({ name: "visit_recorded", at });
      break;
    }
    case "redeem": {
      if (
        !next.customers.some((c) => c.id === command.customerId) ||
        progress(next, command.customerId).available < 1
      )
        throw new Error("This customer has not earned a reward yet.");
      next.redemptions.push({ id, customerId: command.customerId, at });
      subject = command.customerId;
      next.events.push({ name: "reward_redeemed", at });
      break;
    }
    case "voidVisit": {
      if (command.reason.trim().length < 5)
        throw new Error("Explain the correction in at least 5 characters.");
      const v = next.visits.find((v) => v.id === command.id && !v.voided);
      if (!v) throw new Error("This visit has already been corrected.");
      const p = progress(next, v.customerId);
      if (Math.floor((p.visits - 1) / business.loyalty.visits) < p.redeemed)
        throw new Error(
          "This visit supports a redeemed reward. Resolve this with the owner before making a correction.",
        );
      v.voided = true;
      subject = v.id;
      reason = command.reason;
      break;
    }
  }
  if ("token" in command) next.processed.push(command.token);
  next.audit.unshift({
    id: crypto.randomUUID(),
    at,
    action: command.type,
    actor: actor.id,
    subject,
    reason,
  });
  return next;
}
export function customerView(state: State, actor: Actor) {
  if (actor?.role !== "customer")
    throw new Error("Sign in to view your rewards.");
  return {
    customer: state.customers.find((c) => c.id === actor.id),
    visits: state.visits.filter((v) => v.customerId === actor.id),
    redemptions: state.redemptions.filter((r) => r.customerId === actor.id),
    progress: progress(state, actor.id),
  };
}
