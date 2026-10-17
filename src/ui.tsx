import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode, ReactElement } from "react";
import {
  X,
  ArrowUpRight,
  MessageCircle,
  ImageOff,
  Check,
  AlertCircle,
} from "lucide-react";
import * as demo from "./services/demo";
import type { Photo } from "./data/content";
import { enquiryLink } from "./data/content";
export const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
export function useSalon() {
  const state = useSyncExternalStore(demo.subscribe, demo.snapshot);
  const [, setVersion] = useState(0);
  useEffect(() => demo.subscribe(() => setVersion((n) => n + 1)), []);
  return { state, actor: demo.getActor() };
}
export function PhotoImage({
  photo,
  className = "",
  priority = false,
}: {
  photo: Photo;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo.url]);
  return failed ? (
    <div
      className={`image-fallback ${className}`}
      role="img"
      aria-label={photo.alt}
    >
      <ImageOff size={28} />
      <span>Beauty in the details</span>
      <small>Image unavailable</small>
    </div>
  ) : (
    <img
      className={className}
      src={photo.url}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
      srcSet={
        photo.url.startsWith("https://images.unsplash.com/")
          ? [480, 800, 1200]
              .map((w) => `${photo.url.replace(/w=\d+/, `w=${w}`)} ${w}w`)
              .join(", ")
          : undefined
      }
      sizes="(max-width: 600px) 90vw, (max-width: 1000px) 50vw, 700px"
    />
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = ref.current;
    root?.focus();
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const elements = root?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === root)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || document.activeElement === root)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keys);
      before?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Enquire({
  subject = "a salon service",
  className = "button dark",
  children,
}: {
  subject?: string;
  className?: string;
  children?: ReactNode;
}) {
  const toast = useToast();
  const link = enquiryLink(subject);
  return link ? (
    <a
      className={className}
      href={link}
      target="_blank"
      rel="noreferrer"
      onClick={() => demo.track("enquiry_click", subject)}
    >
      {children || (
        <>
          Enquire on WhatsApp <ArrowUpRight size={17} />
        </>
      )}
    </a>
  ) : (
    <button
      className={className}
      onClick={() =>
        toast(
          "Enquiries open once the salon’s WhatsApp number is confirmed. No appointment has been booked.",
        )
      }
      aria-label={`${subject}: WhatsApp number coming soon`}
    >
      {children || (
        <>
          Enquire on WhatsApp <MessageCircle size={17} />
        </>
      )}
    </button>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {error ? <AlertCircle size={18} /> : <Check size={18} />}
      <span>{children}</span>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-describedby": hint ? `${id}-hint` : undefined,
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
