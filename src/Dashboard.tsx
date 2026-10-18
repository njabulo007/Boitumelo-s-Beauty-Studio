import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  ClipboardList,
  Eye,
  Flower2,
  Gift,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Photo, Promotion, Service } from "./data/content";
import {
  business,
  categories,
  dateLabel,
  money,
  saDateInput,
} from "./data/content";
import { activePromotions, progress } from "./services/model";
import type { Command } from "./services/model";
import * as demo from "./services/demo";
import { Field, Modal, Notice, PhotoImage, useSalon, useToast } from "./ui";
type Panel =
  | "Overview"
  | "Services & pricing"
  | "Promotions"
  | "Gallery"
  | "Customers & rewards"
  | "Activity log"
  | "Settings";
const panels: Panel[] = [
  "Overview",
  "Services & pricing",
  "Promotions",
  "Gallery",
  "Customers & rewards",
  "Activity log",
  "Settings",
];
const icons = [
  LayoutDashboard,
  ClipboardList,
  Tag,
  ImagePlus,
  Users,
  RotateCcw,
  Settings2,
];
export default function Dashboard() {
  const measured = useRef(false);
  const { state, actor } = useSalon();
  const toast = useToast();
  const [categoryEditor, setCategoryEditor] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryPrevious, setCategoryPrevious] = useState<
    string | undefined
  >();
  const [panel, setPanel] = useState<Panel>("Overview");
  const [mobile, setMobile] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("sample");
  const [visitService, setVisitService] = useState("");
  const [pendingVisit, setPendingVisit] = useState<{
    customerId: string;
    serviceId: string;
    token: string;
  } | null>(null);
  const [correction, setCorrection] = useState("");
  const [correctVisit, setCorrectVisit] = useState<string | null>(null);
  const [range, setRange] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  useEffect(() => {
    if (!measured.current) {
      demo.track("page_view", "owner");
      measured.current = true;
    }
  }, []);
  function execute(command: Command) {
    try {
      demo.run(command);
      toast("Changes saved.");
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    }
  }
  const owner = actor?.role === "admin";
  const lower =
    range === "all"
      ? -Infinity
      : range === "custom"
        ? customStart
          ? Date.parse(`${customStart}T00:00:00+02:00`)
          : -Infinity
        : Date.now() - Number(range) * 86400000;
  const upper =
    range === "custom" && customEnd
      ? Date.parse(`${customEnd}T23:59:59.999+02:00`)
      : Infinity;
  const inRange = (at: string) =>
    Date.parse(at) >= lower && Date.parse(at) <= upper;
  const visits = state.visits.filter((v) => !v.voided && inRange(v.at));
  const customers = new Set(visits.map((v) => v.customerId));
  const returning = [...customers].filter(
    (id) => visits.filter((v) => v.customerId === id).length >= 2,
  ).length;
  const redemptions = state.redemptions.filter((r) => inRange(r.at));
  const popular = state.services
    .map((s) => ({
      ...s,
      count: visits.filter((v) => v.serviceId === s.id).length,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  const selectedCustomer = state.customers.find((c) => c.id === customerId);
  const loyalty = progress(state, customerId);
  if (!owner)
    return (
      <div className="owner-gate">
        <a href="#home" className="wordmark">
          Boitumelo’s<span>BEAUTY SALON</span>
        </a>
        <div className="owner-gate-card">
          <ShieldCheck size={36} strokeWidth={1} />
          <span className="eyebrow">THE OWNER’S LITTLE CORNER</span>
          <h1>
            Behind the <em>beauty.</em>
          </h1>
          <p>
            A simple space to look after your menu, pictures, offers and
            customers.
          </p>
          <button
            className="button dark full"
            onClick={() => demo.setActor({ role: "admin", id: "demo-owner" })}
          >
            Open owner dashboard <ArrowUpRight size={17} />
          </button>
          <a href="#home" className="text-link">
            Back to the salon
          </a>
        </div>
      </div>
    );
  return (
    <div className="dashboard">
      <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}>
        <a href="#home" className="wordmark">
          Boitumelo’s<span>OWNER’S SPACE</span>
        </a>
        <div className="sidebar-label">A LITTLE CARE, BEHIND THE SCENES</div>
        <nav aria-label="Owner dashboard">
          {panels.map((p, i) => {
            const Icon = icons[i];
            return (
              <button
                key={p}
                className={p === panel ? "active" : ""}
                onClick={() => {
                  setPanel(p);
                  setMobile(false);
                }}
              >
                <Icon size={18} />
                {p}
                {p === panel && <ChevronRight size={15} />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div>
            <span className="avatar">B</span>
            <span>
              Boitumelo<small>Owner</small>
            </span>
          </div>
          <button onClick={() => demo.setActor(null)} className="small-link">
            <LogOut size={15} /> Sign out
          </button>
          <a href="#home" className="button outline">
            <Eye size={16} /> View website
          </a>
        </div>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-top">
          <button
            className="icon-button dashboard-menu"
            aria-label="Toggle dashboard menu"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
          <span>
            Owner’s space <ChevronRight size={13} /> {panel}
          </span>
        </div>
        <main className="dashboard-body">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">YOUR SALON, SIMPLY MANAGED</span>
              <h1>
                {panel === "Overview" ? (
                  <>
                    Hello, <em>Boitumelo.</em>
                  </>
                ) : (
                  panel
                )}
              </h1>
              <p>
                {
                  {
                    Overview:
                      "A clear little picture of your salon’s activity.",
                    "Services & pricing":
                      "Keep your menu fresh. Changes appear on the website straight away.",
                    Promotions:
                      "A little extra to love, at just the right time.",
                    Gallery: "Let your pictures tell your story.",
                    "Customers & rewards":
                      "Care for your customers and celebrate their visits.",
                    "Activity log": "A record of what changed, when, and why.",
                    Settings:
                      "A safe space to explore, reset, and start again.",
                  }[panel]
                }
              </p>
            </div>
            {panel === "Services & pricing" && (
              <button
                className="button dark"
                onClick={() =>
                  setService({
                    id: crypto.randomUUID(),
                    name: "",
                    category: state.categories[0] || "Nails",
                    description: "",
                    duration: 60,
                    price: 0,
                    archived: false,
                  })
                }
              >
                <Plus size={17} /> Add service
              </button>
            )}
            {panel === "Promotions" && (
              <button
                className="button dark"
                disabled={
                  !state.services.some((s) => !s.archived) ||
                  !state.photos.length
                }
                onClick={() =>
                  setPromotion({
                    id: crypto.randomUUID(),
                    title: "",
                    description: "",
                    serviceId:
                      state.services.find((s) => !s.archived)?.id || "",
                    price: 0,
                    start: new Date().toISOString(),
                    end: new Date(Date.now() + 7 * 86400000).toISOString(),
                    photoId: state.photos[0]?.id || "",
                    published: false,
                  })
                }
              >
                <Plus size={17} /> Create offer
              </button>
            )}
            {panel === "Gallery" && (
              <button
                className="button dark"
                onClick={() =>
                  setPhoto({
                    id: crypto.randomUUID(),
                    url: "",
                    alt: "",
                    caption: "",
                    category: state.categories[0] || "Nails",
                    source: "Salon upload",
                    placeholder: false,
                  })
                }
              >
                <Plus size={17} /> Add photograph
              </button>
            )}
          </div>
          {panel === "Overview" && (
            <>
              <div className="dashboard-banner">
                <Flower2 size={25} strokeWidth={1} />
                <div>
                  <strong>Your salon, at a glance.</strong>
                  <p>
                    See recorded visits, customer activity and rewards in one
                    place.
                  </p>
                </div>
              </div>
              <div className="date-filter">
                <Field label="Activity period">
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="all">All time</option>
                    <option value="custom">Custom dates</option>
                  </select>
                </Field>
                {range === "custom" && (
                  <>
                    <Field label="From (SA time)">
                      <input
                        type="date"
                        value={customStart}
                        max={customEnd || undefined}
                        onChange={(e) => setCustomStart(e.target.value)}
                      />
                    </Field>
                    <Field label="To (SA time)">
                      <input
                        type="date"
                        value={customEnd}
                        min={customStart || undefined}
                        onChange={(e) => setCustomEnd(e.target.value)}
                      />
                    </Field>
                  </>
                )}
              </div>
              <div className="stats-grid">
                {[
                  {
                    label: "Registered customers",
                    value: state.customers.length,
                    description: "All registered customer profiles.",
                    Icon: Users,
                  },
                  {
                    label: "Completed visits",
                    value: visits.length,
                    description:
                      "Owner-recorded visits in this period, excluding corrections.",
                    Icon: Check,
                  },
                  {
                    label: "Returning customers",
                    value: returning,
                    description:
                      "Customers with 2+ completed visits in this period.",
                    Icon: RotateCcw,
                  },
                  {
                    label: "Rewards redeemed",
                    value: redemptions.length,
                    description: "Rewards recorded as redeemed in this period.",
                    Icon: Gift,
                  },
                ].map((m) => (
                  <article key={m.label} className="stat">
                    <div>
                      <span>{m.label}</span>
                      <m.Icon size={19} />
                    </div>
                    <strong>{m.value}</strong>
                    <p>{m.description}</p>
                  </article>
                ))}
              </div>
              <div className="overview-grid">
                <section className="dashboard-card">
                  <h2>Most-loved services</h2>
                  <p>Based on recorded visits in the selected period.</p>
                  {popular.length ? (
                    popular.map((s) => (
                      <div className="popular-row" key={s.id}>
                        <span>{s.name}</span>
                        <div>
                          <span
                            style={{
                              width: `${(s.count / visits.length) * 100}%`,
                            }}
                          />
                        </div>
                        <strong>{s.count}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="empty">
                      <Flower2 size={32} />
                      <h3>A fresh beginning.</h3>
                      <p>
                        Record completed visits to see which services customers
                        return for.
                      </p>
                      <button
                        className="text-link"
                        onClick={() => setPanel("Customers & rewards")}
                      >
                        Record a visit <ArrowUpRight size={15} />
                      </button>
                    </div>
                  )}
                </section>
                <section className="dashboard-card">
                  <h2>The discovery picture</h2>
                  <p>Anonymous activity in this browser only.</p>
                  {[
                    { label: "Page views", name: "page_view" },
                    { label: "Service category views", name: "service_view" },
                    { label: "WhatsApp enquiry clicks", name: "enquiry_click" },
                    { label: "Account registrations", name: "registration" },
                    { label: "Rewards area views", name: "loyalty_view" },
                  ].map((m) => (
                    <div className="metric-row" key={m.name}>
                      <span>{m.label}</span>
                      <strong>
                        {
                          state.events.filter(
                            (e) => e.name === m.name && inRange(e.at),
                          ).length
                        }
                      </strong>
                    </div>
                  ))}
                  <small className="metric-note">
                    An enquiry click is not a confirmed booking. Completed
                    visits are recorded separately. Events contain no customer
                    identifiers. No retention or conversion claims are made. The
                    activity log retains the most recent 2,000 events.
                  </small>
                </section>
              </div>
              <div className="quick-actions">
                <button onClick={() => setPanel("Services & pricing")}>
                  <ClipboardList size={21} />
                  <span>
                    Refresh your menu
                    <small>Edit services and prices</small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
                <button onClick={() => setPanel("Promotions")}>
                  <Tag size={21} />
                  <span>
                    Create a little treat<small>Publish your next offer</small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </>
          )}
          {panel === "Services & pricing" && (
            <div className="dashboard-card management-list">
              <div className="category-management">
                <span>Menu categories: {state.categories.join(" · ")}</span>
                <button
                  className="small-link"
                  onClick={() => {
                    setCategoryEditor(true);
                    setCategoryName("");
                    setCategoryPrevious(undefined);
                  }}
                >
                  Manage categories <Settings2 size={14} />
                </button>
              </div>
              <Notice>
                Archiving hides a service and its offers from the public menu.
              </Notice>
              {state.services.map((s, i) => (
                <div
                  className={`management-row ${s.archived ? "archived" : ""}`}
                  key={s.id}
                >
                  <div className="order-controls">
                    <button
                      className="icon-button"
                      aria-label={`Move ${s.name} up`}
                      disabled={i === 0}
                      onClick={() =>
                        execute({
                          type: "moveService",
                          id: s.id,
                          direction: -1,
                        })
                      }
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Move ${s.name} down`}
                      disabled={i === state.services.length - 1}
                      onClick={() =>
                        execute({ type: "moveService", id: s.id, direction: 1 })
                      }
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                  <div className="management-description">
                    <strong>
                      {s.name}{" "}
                      {s.archived && <span className="tiny-tag">ARCHIVED</span>}
                    </strong>
                    <small>
                      {s.category} · {s.duration} min
                    </small>
                    <p>{s.description}</p>
                  </div>
                  <strong>{money(s.price)}</strong>
                  <div className="row-actions">
                    <button
                      className="button outline compact"
                      onClick={() => setService(s)}
                    >
                      Edit
                    </button>
                    <button
                      className="small-link"
                      onClick={() =>
                        execute({
                          type: "service",
                          service: { ...s, archived: !s.archived },
                        })
                      }
                    >
                      {s.archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {panel === "Promotions" && (
            <>
              <Notice>
                Offer dates use South African time (UTC+2). Only published
                offers within their dates appear publicly. When they expire,
                regular prices return automatically.
              </Notice>
              <div className="promotion-grid">
                {state.promotions.map((p) => {
                  const s = state.services.find((s) => s.id === p.serviceId);
                  const active = activePromotions(state).some(
                    (x) => x.id === p.id,
                  );
                  return (
                    <article className="dashboard-card promo-card" key={p.id}>
                      {state.photos.find((x) => x.id === p.photoId) && (
                        <PhotoImage
                          photo={state.photos.find((x) => x.id === p.photoId)!}
                        />
                      )}
                      <span className={`tiny-tag ${active ? "green" : ""}`}>
                        {active
                          ? "ACTIVE"
                          : !p.published
                            ? "DRAFT / ENDED"
                            : Date.parse(p.start) > Date.now()
                              ? "SCHEDULED"
                              : "EXPIRED / UNAVAILABLE"}
                      </span>
                      <h2>{p.title}</h2>
                      <p>{p.description}</p>
                      <div className="offer-price">
                        <strong>{money(p.price)}</strong>
                        <del>{money(s?.price || 0)}</del>
                      </div>
                      <p className="small">
                        {s?.name} · {dateLabel(p.start)} – {dateLabel(p.end)}
                      </p>
                      <div className="row-actions">
                        <button
                          className="button outline compact"
                          onClick={() => setPromotion(p)}
                        >
                          Edit & preview
                        </button>
                        <button
                          className="small-link"
                          onClick={() =>
                            execute({
                              type: "promotion",
                              promotion: { ...p, published: !p.published },
                            })
                          }
                        >
                          {p.published ? "End offer" : "Publish"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!state.promotions.length && (
                <div className="empty">
                  Your next offer starts here. Create a draft to preview it.
                </div>
              )}
            </>
          )}
          {panel === "Gallery" && (
            <>
              <Notice>
                JPG, PNG or WebP, up to 8 MB. Photos are compressed to 1,200 px
                and stored in this browser. Only upload images you have
                permission to use.
              </Notice>
              <div className="dashboard-gallery">
                {state.photos.map((p, i) => (
                  <article
                    className="dashboard-card gallery-admin-card"
                    key={p.id}
                  >
                    <PhotoImage photo={p} />
                    <span className="tiny-tag">
                      {p.placeholder ? "UNSPLASH" : "SALON UPLOAD"}
                    </span>
                    <h3>{p.caption}</h3>
                    <p>{p.category}</p>
                    <div className="row-actions">
                      <button
                        className="button outline compact"
                        onClick={() => setPhoto(p)}
                      >
                        Edit / replace
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${p.caption} up`}
                        disabled={i === 0}
                        onClick={() =>
                          execute({
                            type: "movePhoto",
                            id: p.id,
                            direction: -1,
                          })
                        }
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${p.caption} down`}
                        disabled={i === state.photos.length - 1}
                        onClick={() =>
                          execute({ type: "movePhoto", id: p.id, direction: 1 })
                        }
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Remove ${p.caption}`}
                        onClick={() =>
                          setConfirm({
                            title: "Remove this photograph?",
                            description:
                              "It will disappear from the public gallery. Photos linked to an offer must be replaced in that offer first.",
                            action: () =>
                              execute({ type: "removePhoto", id: p.id }),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {panel === "Customers & rewards" && (
            <div className="customers-layout">
              <section className="dashboard-card">
                <h2>Your customers</h2>
                <label className="search-input">
                  <Search size={17} />
                  <input
                    placeholder="Find by name or email"
                    aria-label="Find customers"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                {state.customers
                  .filter((c) =>
                    `${c.name} ${c.email}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      className={`customer-row ${customerId === c.id ? "active" : ""}`}
                      onClick={() => setCustomerId(c.id)}
                    >
                      <span className="avatar">{c.name[0]}</span>
                      <span>
                        <strong>{c.name}</strong>
                        <small>{c.email}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                {!state.customers.some((c) =>
                  `${c.name} ${c.email}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                ) && <p className="empty">No matching customers.</p>}
              </section>
              <section className="dashboard-card">
                {selectedCustomer && (
                  <>
                    <div className="customer-detail-heading">
                      <span className="avatar large">
                        {selectedCustomer.name[0]}
                      </span>
                      <div>
                        <h2>{selectedCustomer.name}</h2>
                        <p>{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <div className="customer-summary">
                      <div>
                        <strong>{loyalty.visits}</strong>
                        <span>Completed visits</span>
                      </div>
                      <div>
                        <strong>{loyalty.available}</strong>
                        <span>Available rewards</span>
                      </div>
                      <div>
                        <strong>{loyalty.redeemed}</strong>
                        <span>Redeemed</span>
                      </div>
                    </div>
                    <p className="small">
                      {business.loyalty.visits} visits →{" "}
                      {business.loyalty.reward}. Only record completed services.
                    </p>
                    <form
                      className="visit-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (visitService)
                          setPendingVisit({
                            customerId,
                            serviceId: visitService,
                            token: crypto.randomUUID(),
                          });
                      }}
                    >
                      <Field label="Service received">
                        <select
                          required
                          value={visitService}
                          onChange={(e) => setVisitService(e.target.value)}
                        >
                          <option value="">Choose a completed service</option>
                          {state.services
                            .filter((s) => !s.archived)
                            .map((s) => (
                              <option value={s.id} key={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <button className="button dark">
                        <Plus size={16} /> Record completed visit
                      </button>
                    </form>
                    <button
                      className="button outline"
                      disabled={loyalty.available < 1}
                      onClick={() => {
                        const token = crypto.randomUUID();
                        setConfirm({
                          title: "Redeem one reward?",
                          description: `Record ${business.loyalty.reward.toLowerCase()} for ${selectedCustomer.name}. This will use one earned reward.`,
                          action: () =>
                            execute({ type: "redeem", customerId, token }),
                        });
                      }}
                    >
                      <Gift size={16} /> Redeem reward
                    </button>
                    <h3 className="subheading">Visit history</h3>
                    {state.visits.filter((v) => v.customerId === customerId)
                      .length === 0 ? (
                      <div className="empty small">No recorded visits yet.</div>
                    ) : (
                      state.visits
                        .filter((v) => v.customerId === customerId)
                        .slice()
                        .reverse()
                        .map((v) => (
                          <div className="visit-row" key={v.id}>
                            <span>
                              <strong>
                                {
                                  state.services.find(
                                    (s) => s.id === v.serviceId,
                                  )?.name
                                }
                              </strong>
                              <small>
                                {dateLabel(v.at)} ·{" "}
                                {v.voided ? "Corrected" : "Completed"}
                              </small>
                            </span>
                            {!v.voided && (
                              <button
                                className="small-link"
                                onClick={() => {
                                  setCorrectVisit(v.id);
                                  setCorrection("");
                                }}
                              >
                                Correct
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </>
                )}
              </section>
            </div>
          )}
          {panel === "Activity log" && (
            <section className="dashboard-card">
              <h2>A little accountability</h2>
              <p>Owner changes are recorded with their time and subject.</p>
              {!state.audit.length ? (
                <div className="empty">
                  No changes yet. Saved owner actions will appear here.
                </div>
              ) : (
                <div className="audit-list">
                  {state.audit.map((a) => (
                    <div key={a.id}>
                      <RotateCcw size={16} />
                      <span>
                        <strong>
                          {(
                            {
                              service: "Service saved",
                              moveService: "Service reordered",
                              promotion: "Offer saved",
                              photo: "Photo saved",
                              removePhoto: "Photo removed",
                              movePhoto: "Photo reordered",
                              visit: "Visit recorded",
                              redeem: "Reward redeemed",
                              voidVisit: "Visit corrected",
                            } as Record<string, string>
                          )[a.action] || a.action}
                        </strong>
                        <small>
                          By {a.actor === "demo-owner" ? "Owner" : a.actor} ·
                          Subject{" "}
                          {state.customers.find((c) => c.id === a.subject)
                            ?.name ||
                            state.services.find((s) => s.id === a.subject)
                              ?.name ||
                            a.subject}
                        </small>
                        {a.reason && <p>Reason: {a.reason}</p>}
                      </span>
                      <time>
                        {new Date(a.at).toLocaleString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                        })}{" "}
                        SAST
                      </time>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {panel === "Settings" && (
            <section className="dashboard-card settings-card">
              <h2>Your workspace settings.</h2>
              <p>
                Manage the information saved in this workspace. Resetting clears
                service changes, photos, customer records and activity history.
              </p>
              <button
                className="button danger-outline"
                onClick={() =>
                  setConfirm({
                    title: "Reset workspace data?",
                    description:
                      "This removes local profiles, photos, service edits, offers, visits, events and history. You will be signed out. This cannot be undone.",
                    action: () => {
                      demo.resetDemo();
                      toast("Workspace reset.");
                    },
                  })
                }
              >
                <RotateCcw size={16} /> Reset workspace data
              </button>
            </section>
          )}
        </main>
        <div className="dashboard-footer">
          SOUTH AFRICAN TIME (UTC+2)
          <a href="#home">
            View website <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      {categoryEditor && (
        <Modal
          title="Your menu categories"
          onClose={() => setCategoryEditor(false)}
        >
          <p>
            Renaming a category updates all its services and photos. Remove a
            category only after moving its content.
          </p>
          <div className="category-list">
            {state.categories.map((c) => (
              <div key={c}>
                <span>{c}</span>
                <button
                  className="small-link"
                  onClick={() => {
                    setCategoryName(c);
                    setCategoryPrevious(c);
                  }}
                >
                  Rename
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Remove category ${c}`}
                  onClick={() => execute({ type: "removeCategory", name: c })}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                execute({
                  type: "category",
                  name: categoryName,
                  previous: categoryPrevious,
                })
              ) {
                setCategoryName("");
                setCategoryPrevious(undefined);
              }
            }}
          >
            <Field
              label={categoryPrevious ? "New category name" : "Add a category"}
            >
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                maxLength={30}
                required
              />
            </Field>
            <button className="button dark">
              {categoryPrevious ? "Rename category" : "Add category"}
            </button>
          </form>
        </Modal>
      )}
      {service && (
        <ServiceEditor
          initial={service}
          close={() => setService(null)}
          save={(s) => {
            if (execute({ type: "service", service: s })) setService(null);
          }}
        />
      )}
      {promotion && (
        <PromotionEditor
          initial={promotion}
          close={() => setPromotion(null)}
          save={(p) => {
            if (execute({ type: "promotion", promotion: p }))
              setPromotion(null);
          }}
        />
      )}
      {photo && (
        <PhotoEditor
          initial={photo}
          close={() => setPhoto(null)}
          save={(p) => {
            if (execute({ type: "photo", photo: p })) setPhoto(null);
          }}
        />
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p>{confirm.description}</p>
          <div className="modal-actions">
            <button className="button outline" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="button dark"
              onClick={() => {
                const action = confirm.action;
                setConfirm(null);
                action();
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
      {pendingVisit && (
        <Modal
          title="Record this completed visit?"
          onClose={() => setPendingVisit(null)}
        >
          <p>
            Confirm that{" "}
            {
              state.customers.find((c) => c.id === pendingVisit.customerId)
                ?.name
            }{" "}
            received{" "}
            {state.services.find((s) => s.id === pendingVisit.serviceId)?.name}.
            This adds one completed visit towards the next reward.
          </p>
          <Notice>
            This submission has a unique identifier. Repeated submissions of
            this confirmation cannot add another visit.
          </Notice>
          <div className="modal-actions">
            <button
              className="button outline"
              onClick={() => setPendingVisit(null)}
            >
              Cancel
            </button>
            <button
              className="button dark"
              onClick={() => {
                execute({ type: "visit", ...pendingVisit });
                setPendingVisit(null);
                setVisitService("");
              }}
            >
              Confirm completed visit
            </button>
          </div>
        </Modal>
      )}
      {correctVisit && (
        <Modal
          title="Correct a recorded visit"
          onClose={() => setCorrectVisit(null)}
        >
          <p>
            The visit stays in the history, marked as corrected. Its loyalty
            credit is removed.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                execute({
                  type: "voidVisit",
                  id: correctVisit,
                  reason: correction,
                })
              )
                setCorrectVisit(null);
            }}
          >
            <Field label="Reason for correction">
              <textarea
                minLength={5}
                required
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
              />
            </Field>
            <button className="button dark">Save correction</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function ServiceEditor({
  initial,
  close,
  save,
}: {
  initial: Service;
  close: () => void;
  save: (s: Service) => void;
}) {
  const { state } = useSalon();
  const [s, set] = useState(initial);
  return (
    <Modal
      title={initial.name ? "Edit service" : "A fresh addition"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(s);
        }}
      >
        <Field label="Service name">
          <input
            required
            maxLength={80}
            value={s.name}
            onChange={(e) => set({ ...s, name: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <select
            value={s.category}
            onChange={(e) =>
              set({ ...s, category: e.target.value as Service["category"] })
            }
          >
            {state.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea
            required
            maxLength={400}
            value={s.description}
            onChange={(e) => set({ ...s, description: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field
            label="Regular price (R)"
            hint="Published offers at or above the new price will end automatically."
          >
            <input
              required
              type="number"
              min="0"
              step="1"
              value={s.price}
              onChange={(e) => set({ ...s, price: Number(e.target.value) })}
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              required
              type="number"
              min="1"
              step="1"
              value={s.duration}
              onChange={(e) => set({ ...s, duration: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="modal-actions">
          <button type="button" className="button outline" onClick={close}>
            Cancel
          </button>
          <button className="button dark">
            Save service <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function PromotionEditor({
  initial,
  close,
  save,
}: {
  initial: Promotion;
  close: () => void;
  save: (p: Promotion) => void;
}) {
  const { state } = useSalon();
  const [p, set] = useState(initial);
  const [preview, setPreview] = useState(false);
  const s = state.services.find((s) => s.id === p.serviceId);
  const image = state.photos.find((x) => x.id === p.photoId);
  return (
    <Modal
      title={preview ? "Preview your little offer" : "Create a little treat"}
      onClose={close}
    >
      {preview ? (
        <div className="promo-preview">
          {image && <PhotoImage photo={image} />}
          <span className="eyebrow">OFFER PREVIEW</span>
          <h2>{p.title || "Your offer title"}</h2>
          <p>{p.description}</p>
          <div className="offer-price">
            <strong>{money(p.price)}</strong>
            <del>{money(s?.price || 0)}</del>
          </div>
          <p>
            {dateLabel(p.start)} – {dateLabel(p.end)} · SAST
          </p>
          <button className="button outline" onClick={() => setPreview(false)}>
            Back to editing
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(p);
          }}
        >
          <Field label="Offer title">
            <input
              required
              maxLength={80}
              value={p.title}
              onChange={(e) => set({ ...p, title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              required
              maxLength={400}
              value={p.description}
              onChange={(e) => set({ ...p, description: e.target.value })}
            />
          </Field>
          <Field label="Linked service">
            <select
              value={p.serviceId}
              onChange={(e) => set({ ...p, serviceId: e.target.value })}
            >
              {state.services
                .filter((s) => !s.archived)
                .map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name} — {money(s.price)}
                  </option>
                ))}
            </select>
          </Field>
          <Field
            label="Offer price (R)"
            hint="Must be less than the regular service price."
          >
            <input
              required
              type="number"
              min="0"
              max={(s?.price || 1) - 1}
              value={p.price}
              onChange={(e) => set({ ...p, price: Number(e.target.value) })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Starts (SA date)">
              <input
                required
                type="date"
                value={saDateInput(p.start)}
                onChange={(e) => {
                  if (e.target.value)
                    set({ ...p, start: `${e.target.value}T00:00:00+02:00` });
                }}
              />
            </Field>
            <Field label="Ends (SA date)">
              <input
                required
                type="date"
                min={saDateInput(p.start)}
                value={saDateInput(p.end)}
                onChange={(e) => {
                  if (e.target.value)
                    set({ ...p, end: `${e.target.value}T23:59:59.999+02:00` });
                }}
              />
            </Field>
          </div>
          <Field label="Offer photograph">
            <select
              value={p.photoId}
              onChange={(e) => set({ ...p, photoId: e.target.value })}
            >
              {state.photos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.caption}
                </option>
              ))}
            </select>
          </Field>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={p.published}
              onChange={(e) => set({ ...p, published: e.target.checked })}
            />
            Publish when within the selected dates
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button outline"
              onClick={() => setPreview(true)}
            >
              <Eye size={16} /> Preview
            </button>
            <button className="button dark">
              {p.published ? "Save & publish" : "Save draft"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
function PhotoEditor({
  initial,
  close,
  save,
}: {
  initial: Photo;
  close: () => void;
  save: (p: Photo) => void;
}) {
  const { state } = useSalon();
  const [p, set] = useState(initial);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await demo.compressPhoto(file, setProgress);
      set((old) => ({
        ...old,
        url,
        source: "Salon upload",
        placeholder: false,
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={initial.url ? "Edit your photograph" : "Add a little inspiration"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!p.url) {
            setError("Please choose a photograph first.");
            return;
          }
          save(p);
        }}
      >
        <Field
          label="Choose a photograph"
          hint="JPG, PNG or WebP · maximum 8 MB · automatically compressed"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </Field>
        {busy && (
          <div className="upload-progress" role="status">
            <progress value={progress} max="100" /> Preparing image… {progress}%
          </div>
        )}
        {p.url && (
          <div className="photo-preview">
            <PhotoImage photo={p} />
            <span>
              Preview · {p.placeholder ? "stock image" : "local upload"}
            </span>
          </div>
        )}
        <Field label="Caption">
          <input
            required
            maxLength={100}
            value={p.caption}
            onChange={(e) => set({ ...p, caption: e.target.value })}
          />
        </Field>
        <Field
          label="Alternative text"
          hint="Describe what is visible for people using screen readers."
        >
          <input
            required
            maxLength={200}
            value={p.alt}
            onChange={(e) => set({ ...p, alt: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <select
            value={p.category}
            onChange={(e) =>
              set({ ...p, category: e.target.value as Photo["category"] })
            }
          >
            {state.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        {error && <Notice error>{error}</Notice>}
        <div className="modal-actions">
          <button type="button" className="button outline" onClick={close}>
            Cancel
          </button>
          <button className="button dark" disabled={busy}>
            Save photograph
          </button>
        </div>
      </form>
    </Modal>
  );
}
