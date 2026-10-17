import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Heart,
  Gift,
  Check,
  LogOut,
  Flower2,
  Clock,
  UserRound,
} from "lucide-react";
import { business, dateLabel } from "./data/content";
import { customerView } from "./services/model";
import * as demo from "./services/demo";
import { Field, Notice, useSalon, useToast } from "./ui";
export default function Rewards() {
  const measured = useRef(false);
  const { state, actor } = useSalon();
  const toast = useToast();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!measured.current) {
      demo.track("page_view", "rewards");
      demo.track("loyalty_view");
      measured.current = true;
    }
  }, []);
  const view = actor?.role === "customer" ? customerView(state, actor) : null;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      if (mode === "reset") {
        await new Promise((r) => setTimeout(r, 350));
        setSuccess(
          "Demo mode cannot send password reset emails. Use the sample account or register a new demo email. Firebase Authentication will send reset emails after live setup.",
        );
      } else if (mode === "login")
        await demo.login(
          String(data.get("email")),
          String(data.get("password")),
        );
      else
        await demo.register(
          String(data.get("name")),
          String(data.get("email")),
          String(data.get("password")),
          data.get("marketing") === "on",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="account-page">
      <header className="simple-header">
        <a href="#home" className="wordmark">
          Boitumelo’s<span>BEAUTY SALON</span>
        </a>
        <a href="#home" className="text-link">
          <ArrowLeft size={16} /> Back to the salon
        </a>
      </header>
      <div className="account-demo">
        <span className="status-dot" /> DEMO REWARDS · SAMPLE RULES · THIS
        BROWSER ONLY
      </div>
      {view?.customer ? (
        <main className="rewards-content">
          <div className="account-title">
            <div>
              <span className="eyebrow">YOUR LITTLE CORNER OF SELF-CARE</span>
              <h1>
                Hello, <em>{view.customer.name.split(" ")[0]}.</em>
              </h1>
              <p>Every little visit is a moment worth keeping.</p>
            </div>
            <button
              className="button outline"
              onClick={() => demo.setActor(null)}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
          <div className="rewards-grid">
            <section className="reward-card">
              <div className="reward-card-title">
                <Heart size={24} strokeWidth={1} />
                <span>THE FEEL-GOOD CLUB</span>
              </div>
              <h2>
                A little closer to
                <br />
                <em>something lovely.</em>
              </h2>
              <div className="loyalty-stamps">
                {Array.from({ length: business.loyalty.visits }, (_, i) => (
                  <div
                    className={i < view.progress.towards ? "filled" : ""}
                    key={i}
                  >
                    {i < view.progress.towards ? (
                      <Check size={22} />
                    ) : i === business.loyalty.visits - 1 ? (
                      <Gift size={23} />
                    ) : (
                      <Flower2 size={23} strokeWidth={1} />
                    )}
                  </div>
                ))}
              </div>
              <p>
                {view.progress.available > 0
                  ? `${view.progress.available} sample reward${view.progress.available > 1 ? "s" : ""} ready to redeem with the owner.`
                  : `${view.progress.towards} of ${business.loyalty.visits} visits towards your next reward`}
              </p>
              <div className="reward-rule">
                <strong>{business.loyalty.reward}</strong>
                <span>
                  Sample rule: every {business.loyalty.visits} completed visits
                  earns one reward. No expiry in this demo. One reward per
                  treatment; no cash value. Final terms need owner approval.
                </span>
              </div>
              <small>
                Only the owner can record completed visits and redeem rewards.
                Enquiry clicks do not count as visits.
              </small>
            </section>
            <section className="profile-card">
              <UserRound size={24} strokeWidth={1} />
              <h2>Your details</h2>
              <p>Keep things simple. Just the essentials.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  try {
                    demo.updateProfile(
                      String(data.get("name")),
                      data.get("marketing") === "on",
                    );
                    toast("Your demo profile has been saved.");
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                <Field label="Your name">
                  <input
                    name="name"
                    defaultValue={view.customer.name}
                    required
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="Email address">
                  <input value={view.customer.email} readOnly type="email" />
                </Field>
                <label className="checkbox">
                  <input
                    name="marketing"
                    type="checkbox"
                    defaultChecked={view.customer.marketing}
                  />
                  I’d like to hear about offers. Optional; no messages are sent
                  in this demo.
                </label>
                <button className="button dark">
                  Save details <ArrowUpRight size={16} />
                </button>
              </form>
            </section>
          </div>
          <section className="history-panel">
            <h2>Your little moments</h2>
            <p>Recorded visits and rewards, all in one place.</p>
            {view.visits.length + view.redemptions.length === 0 ? (
              <div className="empty">
                <Clock size={28} />
                <h3>Your story starts with your first visit.</h3>
                <p>
                  Once the owner records a completed visit, you’ll see it here.
                </p>
                <a href="#services" className="text-link">
                  Explore the sample menu <ArrowUpRight size={15} />
                </a>
              </div>
            ) : (
              <div className="history-list">
                {[
                  ...view.visits.map((v) => ({
                    id: v.id,
                    at: v.at,
                    title:
                      state.services.find((s) => s.id === v.serviceId)?.name ||
                      "Completed visit",
                    detail: v.voided
                      ? "Corrected by the owner — does not count"
                      : "Completed visit · counts towards rewards",
                  })),
                  ...view.redemptions.map((r) => ({
                    id: r.id,
                    at: r.at,
                    title: "Sample reward redeemed",
                    detail: business.loyalty.reward,
                  })),
                ]
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((v) => (
                    <div key={v.id}>
                      <Flower2 size={20} />
                      <span>
                        <strong>{v.title}</strong>
                        <small>{v.detail}</small>
                      </span>
                      <time>{dateLabel(v.at)}</time>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </main>
      ) : (
        <main className="auth-layout">
          <div className="auth-story">
            <span className="eyebrow">THE FEEL-GOOD CLUB</span>
            <h1>
              A little care.
              <br />A little <em>thank you.</em>
            </h1>
            <p>
              Your visits, your rewards, and something lovely to look forward
              to. A little corner that’s all yours.
            </p>
            <div className="auth-flower">
              <Flower2 size={160} strokeWidth={0.5} />
            </div>
            <span className="sample-label">
              SAMPLE PROGRAMME · NO REAL REWARDS PROMISED
            </span>
          </div>
          <div className="auth-card">
            <span className="eyebrow">MY REWARDS</span>
            <h2>
              {mode === "register"
                ? "Make yourself at home."
                : mode === "reset"
                  ? "A fresh start."
                  : "Welcome back, beautiful."}
            </h2>
            <p>
              {mode === "register"
                ? "Create a demo account to try the rewards experience."
                : mode === "reset"
                  ? "Password reset is available with live Firebase setup."
                  : "Sign in to see your little moments add up."}
            </p>
            {mode !== "reset" && (
              <div className="auth-tabs">
                <button
                  className={mode === "login" ? "active" : ""}
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Sign in
                </button>
                <button
                  className={mode === "register" ? "active" : ""}
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Create account
                </button>
              </div>
            )}
            <form onSubmit={submit} key={mode}>
              {mode === "register" && (
                <Field label="Your first name">
                  <input
                    name="name"
                    required
                    autoComplete="given-name"
                    maxLength={60}
                  />
                </Field>
              )}
              <Field label="Email address">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.test"
                  autoComplete="email"
                  maxLength={150}
                />
              </Field>
              {mode !== "reset" && (
                <Field
                  label="Demo password"
                  hint="Use a demo-only password, at least 8 characters."
                >
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                  />
                </Field>
              )}
              {mode === "register" && (
                <label className="checkbox">
                  <input name="marketing" type="checkbox" />
                  Keep me posted about offers (optional). No messages are sent
                  in demo mode.
                </label>
              )}
              {error && <Notice error>{error}</Notice>}
              {success && <Notice>{success}</Notice>}
              <button className="button dark full" disabled={busy}>
                {busy
                  ? "Just a moment…"
                  : mode === "register"
                    ? "Create demo account"
                    : mode === "reset"
                      ? "Show reset options"
                      : "Sign in"}
                <ArrowUpRight size={16} />
              </button>
            </form>
            <button
              className="small-link auth-reset"
              onClick={() => {
                setMode(mode === "reset" ? "login" : "reset");
                setError("");
                setSuccess("");
              }}
            >
              {mode === "reset" ? "Back to sign in" : "Forgot your password?"}
            </button>
            <div className="auth-divider">
              <span>JUST EXPLORING?</span>
            </div>
            <button
              className="button outline full"
              onClick={() => {
                demo.setActor({ role: "customer", id: "sample" });
                toast("You’re viewing a synthetic sample account.");
              }}
            >
              Explore the sample account <ArrowRightIcon />
            </button>
            <p className="privacy-note">
              This is a local demo, not secure live authentication. Please use
              synthetic details. You can browse and enquire without an account.
            </p>
          </div>
        </main>
      )}
      <footer className="account-footer">
        A little care. A beautiful feeling.{" "}
        <a href="#home">Back to Boitumelo’s ↗</a>
      </footer>
    </div>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={16} />;
}
