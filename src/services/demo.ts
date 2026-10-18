import { apply, seed } from "./model";
import type { Actor, Command, State, EventName } from "./model";
const KEY = "boitumelo-demo-v1",
  SESSION = "boitumelo-demo-session";
let current: State;
let storageError = "";
try {
  const raw = localStorage.getItem(KEY);
  const stored = raw ? JSON.parse(raw) : null;
  if (stored && stored.version !== 1) throw new Error("Incompatible demo");
  current = stored || seed();
  current.categories ??= seed().categories;
  const starterCustomer = current.customers.find(
    (c) => c.id === "sample" && c.name === "Lerato (sample)",
  );
  if (starterCustomer) starterCustomer.name = "Lerato";
} catch {
  current = seed();
  storageError =
    "Saved data could not be read. Reset the workspace to start again.";
}
let actor: Actor = null;
try {
  actor = JSON.parse(sessionStorage.getItem(SESSION) || "null");
  if (
    actor &&
    actor.role !== "admin" &&
    !current.customers.some((c) => c.id === actor!.id)
  )
    actor = null;
} catch {
  actor = null;
}
const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const snapshot = () => current;
export const getActor = () => actor;
export const getStorageError = () => storageError;
const notify = () => listeners.forEach((fn) => fn());
function persist(next: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error(
      "Browser storage is full or unavailable. Remove a photo or reset the workspace. Your last change was not saved.",
    );
  }
  current = next;
  notify();
}
export function run(command: Command) {
  persist(apply(current, actor, command));
}
export function setActor(next: Actor) {
  sessionStorage.setItem(SESSION, JSON.stringify(next));
  actor = next;
  notify();
}
export function resetDemo() {
  localStorage.removeItem(KEY);
  current = seed();
  storageError = "";
  setActor(null);
  persist(current);
}
export function track(name: EventName, subject?: string) {
  const next = {
    ...current,
    events: [
      ...current.events,
      { name, subject, at: new Date().toISOString() },
    ].slice(-2000),
  };
  try {
    persist(next);
  } catch {
    /* Measurement must not interrupt browsing. */
  }
}
async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function register(
  name: string,
  email: string,
  password: string,
  marketing: boolean,
) {
  email = email.trim().toLowerCase();
  if (
    !name.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8
  )
    throw new Error(
      "Add your name, a valid email and a password with at least 8 characters.",
    );
  if (current.customers.some((c) => c.email === email))
    throw new Error("This email already has an account. Please sign in.");
  const salt = crypto.randomUUID(),
    passwordHash = await hash(password, salt);
  if (current.customers.some((c) => c.email === email))
    throw new Error("This email already has an account.");
  const customer = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email,
    passwordHash,
    salt,
    marketing,
  };
  persist({ ...current, customers: [...current.customers, customer] });
  setActor({ role: "customer", id: customer.id });
  track("registration");
}
export async function login(email: string, password: string) {
  const customer = current.customers.find(
    (c) => c.email === email.trim().toLowerCase(),
  );
  if (
    !customer?.salt ||
    !customer.passwordHash ||
    (await hash(password, customer.salt)) !== customer.passwordHash
  )
    throw new Error("Email or password is incorrect. Please try again.");
  setActor({ role: "customer", id: customer.id });
}
export function updateProfile(name: string, marketing: boolean) {
  if (actor?.role !== "customer") throw new Error("Please sign in.");
  if (!name.trim()) throw new Error("Please add your name.");
  persist({
    ...current,
    customers: current.customers.map((c) =>
      c.id === actor!.id ? { ...c, name: name.trim(), marketing } : c,
    ),
  });
}
export async function compressPhoto(
  file: File,
  onProgress: (n: number) => void,
) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 8 * 1024 * 1024)
    throw new Error("Choose an image smaller than 8 MB.");
  onProgress(15);
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Image processing is unavailable in this browser.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    onProgress(70);
    const result = canvas.toDataURL("image/webp", 0.8);
    if (result.length > 1200000)
      throw new Error(
        "This image is still too large. Please choose a smaller image.",
      );
    onProgress(100);
    return result;
  } finally {
    bitmap.close();
  }
}
