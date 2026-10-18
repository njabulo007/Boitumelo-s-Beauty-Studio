import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  Sparkles,
  Flower2,
  Scissors,
  Heart,
  MapPin,
  Clock,
  Instagram,
  Plus,
  Minus,
} from "lucide-react";
import { business, categories, dateLabel, money } from "./data/content";
import type { Category, Photo } from "./data/content";
import { activePromotions, displayedPrice } from "./services/model";
import { track } from "./services/demo";
import { Enquire, Modal, PhotoImage, useSalon } from "./ui";
export default function Public() {
  const measured = useRef(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  const { state } = useSalon();
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState<Category>("Nails");
  const [galleryCategory, setGalleryCategory] = useState("All");
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [faq, setFaq] = useState<number | null>(null);
  useEffect(() => {
    if (!state.categories.includes(category) && state.categories[0])
      setCategory(state.categories[0]);
  }, [state.categories, category]);
  const offers = activePromotions(state);
  const gallery = state.photos.filter(
    (p) => galleryCategory === "All" || p.category === galleryCategory,
  );
  const hero =
    state.photos.find((p) => p.category === "Nails") || state.photos[0];
  useEffect(() => {
    if (!measured.current) {
      track("page_view", "home");
      measured.current = true;
    }
  }, []);
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPhoto(1);
      if (e.key === "ArrowLeft") nextPhoto(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  function nextPhoto(direction: number) {
    if (!lightbox || !gallery.length) return;
    setLightbox(
      gallery[
        (gallery.findIndex((p) => p.id === lightbox.id) +
          direction +
          gallery.length) %
          gallery.length
      ],
    );
  }
  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="Boitumelo’s home">
          Boitumelo’s<span>BEAUTY SALON</span>
        </a>
        <nav aria-label="Main navigation" className={menu ? "nav open" : "nav"}>
          {["Home", "Services", "Gallery", "Offers", "Contact"].map((item) => (
            <a
              href={`#${item.toLowerCase()}`}
              key={item}
              onClick={() => setMenu(false)}
            >
              {item}
            </a>
          ))}
          <a className="mobile-rewards" href="#rewards">
            My Rewards <ArrowUpRight size={15} />
          </a>
        </nav>
        <a className="rewards-link" href="#rewards">
          <Heart size={16} /> My Rewards <ArrowUpRight size={15} />
        </a>
        <button
          className="menu-toggle icon-button"
          aria-label={menu ? "Close navigation" : "Open navigation"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> YOUR TIME. YOUR BEAUTY. YOUR MOMENT.
            </div>
            <h1>
              A little care.
              <br />A beautiful
              <br />
              <em>feeling.</em>
            </h1>
            <p>
              Beautiful nails, fresh hair, and a little time for you.
              <br className="desktop-break" /> Welcome to your feel-good place.
            </p>
            <div className="hero-actions">
              <Enquire />
              <a className="text-link" href="#services">
                Explore our services <ArrowRight size={16} />
              </a>
            </div>
            <div className="hero-footnote">
              <Flower2 size={20} />
              <span>Thoughtful care. Beautiful little details.</span>
            </div>
          </div>
          <div className="hero-visual">
            {hero && (
              <PhotoImage photo={hero} priority className="hero-image" />
            )}
            <div className="hero-stamp">
              <Flower2 size={32} strokeWidth={1} />
              <span>
                MADE FOR
                <br />
                <em>your moment</em>
              </span>
            </div>
            <span className="vertical-note">
              BEAUTY BEGINS WITH A LITTLE SELF-CARE
            </span>
          </div>
          <div className="hero-index">
            <span>01 / A MOMENT FOR YOU</span>
            <a href="#services">
              SCROLL TO EXPLORE <span>↓</span>
            </a>
          </div>
        </section>
        <div className="values-strip">
          <span>
            <Flower2 /> Beauty, your way
          </span>
          <i>✦</i>
          <span>
            <Heart /> A little time for yourself
          </span>
          <i>✦</i>
          <span>
            <Sparkles /> Care in every detail
          </span>
        </div>
        <section className="section services-section" id="services">
          <div className="section-intro">
            <div>
              <span className="eyebrow">01 / THE TREATMENT MENU</span>
              <h2>
                A fresh look.
                <br />A <em>fresh feeling.</em>
              </h2>
            </div>
            <div className="intro-aside">
              <p>
                From everyday favourites to a well-deserved treat,
                <br />
                find a little something that’s just for you.
              </p>
            </div>
          </div>
          <div className="services-layout">
            <div
              className="service-tabs"
              role="tablist"
              aria-label="Service categories"
            >
              {state.categories.map((c, i) => {
                const Icon = [Flower2, Scissors, Sparkles][i % 3];
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={category === c}
                    aria-controls="service-panel"
                    id={`tab-${c}`}
                    className={category === c ? "active" : ""}
                    onClick={() => {
                      setCategory(c);
                      track("service_view", c);
                    }}
                  >
                    <Icon size={22} strokeWidth={1} />
                    <span>
                      {c}
                      <small>
                        {
                          [
                            "Polished to perfection",
                            "A good hair day starts here",
                            "Glow in your own way",
                          ][i % 3]
                        }
                      </small>
                    </span>
                    <ArrowUpRight size={21} />
                  </button>
                );
              })}
              <p>
                Not sure what to choose?
                <br />
                <a href="#contact">
                  Let’s chat about it <ArrowUpRight size={13} />
                </a>
              </p>
            </div>
            <div
              className="service-list"
              id="service-panel"
              role="tabpanel"
              aria-labelledby={`tab-${category}`}
            >
              {state.services
                .filter((s) => !s.archived && s.category === category)
                .map((s) => (
                  <article className="service-row" key={s.id}>
                    <div>
                      <div className="service-title">
                        <h3>{s.name}</h3>
                        <span className="duration">{s.duration} MIN</span>
                      </div>
                      <p>{s.description}</p>
                      <Enquire subject={s.name} className="small-link">
                        Enquire about this service <ArrowUpRight size={13} />
                      </Enquire>
                    </div>
                    <div className="service-price">
                      {displayedPrice(state, s) < s.price && (
                        <del>{money(s.price)}</del>
                      )}
                      <span>{money(displayedPrice(state, s))}</span>
                    </div>
                  </article>
                ))}
              {!state.services.some(
                (s) => !s.archived && s.category === category,
              ) && (
                <p className="empty">
                  This menu is being refreshed. Check back soon.
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="about-section">
          <div className="about-image">
            {state.photos.find((p) => p.category === "Hair") && (
              <PhotoImage
                photo={state.photos.find((p) => p.category === "Hair")!}
              />
            )}
          </div>
          <div className="about-copy">
            <span className="eyebrow">HELLO, BEAUTIFUL</span>
            <h2>
              More than a look.
              <br />
              <em>A little lift.</em>
            </h2>
            <p>
              There’s something about taking a moment for yourself. The fresh
              nails. The new hairstyle. That feeling when you look in the mirror
              and smile.
            </p>
            <p>
              That’s the feeling we’re creating at Boitumelo’s. A welcoming
              space for beauty, care, and a little everyday confidence.
            </p>
            <a className="text-link" href="#contact">
              Let’s make time for you <ArrowUpRight size={16} />
            </a>
            <div className="signature">
              With care, Boitumelo <Heart size={17} strokeWidth={1} />
            </div>
          </div>
        </section>
        <section className="section offers-section" id="offers">
          <div className="section-intro">
            <div>
              <span className="eyebrow">02 / A LITTLE EXTRA TO LOVE</span>
              <h2>
                Good things.
                <br />
                <em>Lovely little offers.</em>
              </h2>
            </div>
            <p className="intro-aside">
              A little treat to brighten your routine.
              <br />
              Make a little time for yourself.
            </p>
          </div>
          {offers.length ? (
            offers.map((p) => {
              const s = state.services.find((s) => s.id === p.serviceId)!;
              const photo = state.photos.find((x) => x.id === p.photoId);
              return (
                <article className="offer-feature" key={p.id}>
                  <div className="offer-photo">
                    {photo && <PhotoImage photo={photo} />}
                    <span className="offer-badge">
                      A LITTLE
                      <br />
                      <em>self-love</em>
                    </span>
                  </div>
                  <div className="offer-copy">
                    <span className="eyebrow">THE FEEL-GOOD EDIT</span>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <div className="offer-price">
                      <strong>{money(p.price)}</strong>
                      <del>{money(s.price)}</del>
                      <span>{s.name}</span>
                    </div>
                    <span className="offer-date">
                      {dateLabel(p.start)} – {dateLabel(p.end)} · South African
                      time
                    </span>
                    <Enquire
                      subject={`${p.title} (${s.name})`}
                      className="button dark"
                    >
                      Enquire about this offer <ArrowUpRight size={16} />
                    </Enquire>
                    <small>
                      Enquiries are subject to availability. An enquiry is not a
                      booking.
                    </small>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty">
              A fresh little treat is on its way. Explore our service menu in
              the meantime.
            </div>
          )}
        </section>
        <section className="section gallery-section" id="gallery">
          <div className="section-intro">
            <div>
              <span className="eyebrow">03 / THE INSPIRATION BOARD</span>
              <h2>
                Beauty in the <em>details.</em>
              </h2>
            </div>
            <p className="intro-aside">
              A mood, a colour, a little inspiration.
              <br />
              Find inspiration for your next visit.
            </p>
          </div>
          <div className="filter-tabs" aria-label="Gallery categories">
            {["All", ...state.categories].map((c) => (
              <button
                key={c}
                aria-pressed={c === galleryCategory}
                className={c === galleryCategory ? "active" : ""}
                onClick={() => setGalleryCategory(c)}
              >
                {c === "All" ? "All inspiration" : c}
              </button>
            ))}
          </div>
          <div className="gallery-grid">
            {gallery.map((p, i) => (
              <button
                key={p.id}
                className={`gallery-item item-${i % 4}`}
                onClick={() => setLightbox(p)}
                aria-label={`View ${p.caption}`}
              >
                <div className="gallery-image">
                  <PhotoImage photo={p} />
                  <span className="gallery-expand">
                    <ArrowUpRight size={21} />
                  </span>
                </div>
                <span className="gallery-caption">
                  {p.caption}
                  <small>{p.category}</small>
                </span>
              </button>
            ))}
          </div>
          {!gallery.length && (
            <p className="empty">No photographs in this category yet.</p>
          )}
        </section>
        <section className="loyalty-banner">
          <div className="loyalty-art">
            <Flower2 strokeWidth={0.7} />
            <span>
              A LITTLE
              <br />
              THANK YOU
            </span>
          </div>
          <div>
            <span className="eyebrow">YOUR SELF-CARE, WITH A LITTLE EXTRA</span>
            <h2>
              Come for the care.
              <br />
              <em>Stay for the little rewards.</em>
            </h2>
            <p>
              Keep your feel-good moments in one place. Your visits,
              <br className="desktop-break" /> your progress, and something
              lovely to look forward to.
            </p>
            <a href="#rewards" className="button dark">
              Discover My Rewards <ArrowUpRight size={16} />
            </a>
            <small>
              {business.loyalty.visits} completed visits →{" "}
              {business.loyalty.reward.toLowerCase()}.
            </small>
          </div>
          <Heart className="loyalty-heart" size={100} strokeWidth={0.5} />
        </section>
        <section className="section faq-section">
          <span className="eyebrow">A FEW LITTLE THINGS TO KNOW</span>
          <h2>
            Before your <em>moment.</em>
          </h2>
          <div className="faq-list">
            {[
              {
                q: "How do I enquire about an appointment?",
                a: "Browse the services and use the WhatsApp enquiry button once our number is confirmed. Tell us your preferred service and day. An enquiry does not confirm an appointment — the salon will confirm the details with you.",
              },
              {
                q: "Do I need an account to enquire?",
                a: "No. You can browse the menu and enquire without an account. My Rewards is optional, for keeping track of your completed visits and rewards.",
              },
              {
                q: "How do loyalty rewards work?",
                a: "Completed visits recorded by the salon count towards your rewards. Sign in to My Rewards to see your progress, and speak to the owner when you are ready to redeem a reward.",
              },
            ].map((f, i) => (
              <div className="faq" key={f.q}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                >
                  {f.q}
                  {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                {faq === i && <p id={`faq-${i}`}>{f.a}</p>}
              </div>
            ))}
          </div>
        </section>
        <section className="contact-section" id="contact">
          <div className="contact-heading">
            <span className="eyebrow">04 / LET’S MAKE TIME FOR YOU</span>
            <h2>
              Your next
              <br />
              <em>feel-good moment</em>
              <br />
              starts here.
            </h2>
            <Enquire />
          </div>
          <div className="contact-details">
            <div>
              <MapPin size={22} strokeWidth={1} />
              <span>
                <h3>Find your feel-good place</h3>
                <p>{business.address || "Salon location to be confirmed."}</p>
                <a
                  className="small-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions <ArrowUpRight size={13} />
                </a>
              </span>
            </div>
            <div>
              <Clock size={22} strokeWidth={1} />
              <span>
                <h3>A little time for you</h3>
                <p>{business.hours || "Operating hours to be confirmed."}</p>
                <small>Enquire for availability before visiting.</small>
              </span>
            </div>
            <div className="contact-note">
              <Heart size={18} />
              <p>
                No online checkout. Just a friendly conversation
                <br />
                to find the right service and time for you.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="footer-top">
          <a className="wordmark" href="#home">
            Boitumelo’s<span>BEAUTY SALON</span>
          </a>
          <p>A little care. A beautiful feeling.</p>
          <a href="#owner">
            Owner dashboard <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Boitumelo’s Beauty Salon</span>
          <span>Website by Khulisa Media</span>
        </div>
      </footer>
      {lightbox && (
        <Modal title={lightbox.caption} wide onClose={() => setLightbox(null)}>
          <div className="lightbox">
            <PhotoImage photo={lightbox} />
            <div className="lightbox-controls">
              <button
                className="icon-button"
                aria-label="Previous photograph"
                onClick={() => nextPhoto(-1)}
              >
                <ArrowLeft />
              </button>
              <p>
                {lightbox.category}
                <small>
                  {lightbox.placeholder
                    ? "Photography: Unsplash"
                    : lightbox.source}
                </small>
              </p>
              <button
                className="icon-button"
                aria-label="Next photograph"
                onClick={() => nextPhoto(1)}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
