/** Live integration boundary. Never imported as a fallback by the demo store. */
import { initializeApp, getApps } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { Service, Promotion, Photo } from "../data/content";
const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;
export function createFirebaseAdapter() {
  const missing = required.filter((name) => !import.meta.env[name]);
  if (missing.length)
    throw new Error(
      `Missing Firebase configuration: ${missing.join(", ")}. Live mode cannot use demo data.`,
    );
  const app =
    getApps()[0] ||
    initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
  const auth = getAuth(app),
    db = getFirestore(app),
    storage = getStorage(app),
    functions = getFunctions(app, "europe-west1");
  const requireUser = () => {
    if (!auth.currentUser) throw new Error("Please sign in.");
    return auth.currentUser;
  };
  const requireAdmin = async () => {
    const user = requireUser();
    if ((await user.getIdTokenResult()).claims.admin !== true)
      throw new Error("Administrator access required.");
    return user;
  };
  return {
    auth,
    async register(
      name: string,
      email: string,
      password: string,
      marketing: boolean,
    ) {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await setDoc(doc(db, "profiles", credential.user.uid), {
        name,
        email: credential.user.email,
        marketing,
        createdAt: serverTimestamp(),
      });
      return credential.user;
    },
    signIn: (email: string, password: string) =>
      signInWithEmailAndPassword(auth, email, password),
    resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
    signOut: () => signOut(auth),
    async profile() {
      const user = requireUser();
      return getDoc(doc(db, "profiles", user.uid));
    },
    async saveProfile(name: string, marketing: boolean) {
      const user = requireUser();
      await updateDoc(doc(db, "profiles", user.uid), { name, marketing });
    },
    async publicContent() {
      const [services, promotions, photos] = await Promise.all([
        getDocs(
          query(collection(db, "services"), where("archived", "==", false)),
        ),
        getDocs(
          query(collection(db, "promotions"), where("published", "==", true)),
        ),
        getDocs(collection(db, "gallery")),
      ]);
      return {
        services: services.docs.map((d) => ({ id: d.id, ...d.data() })),
        promotions: promotions.docs.map((d) => ({ id: d.id, ...d.data() })),
        photos: photos.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
    },
    async customerHistory() {
      const user = requireUser();
      const [visits, rewards, loyalty] = await Promise.all([
        getDocs(
          query(collection(db, "visits"), where("customerId", "==", user.uid)),
        ),
        getDocs(
          query(
            collection(db, "redemptions"),
            where("customerId", "==", user.uid),
          ),
        ),
        getDoc(doc(db, "loyalty", user.uid)),
      ]);
      return {
        visits: visits.docs.map((d) => ({ id: d.id, ...d.data() })),
        rewards: rewards.docs.map((d) => ({ id: d.id, ...d.data() })),
        loyalty: loyalty.data(),
      };
    },
    async saveContent(
      kind: "services" | "promotions" | "gallery",
      value: Service | Promotion | Photo,
      order: number,
    ) {
      await requireAdmin();
      const { id, ...data } = value;
      await setDoc(doc(db, kind, id), {
        ...data,
        ...(kind === "promotions"
          ? {
              start: Timestamp.fromDate(new Date((value as Promotion).start)),
              end: Timestamp.fromDate(new Date((value as Promotion).end)),
            }
          : {}),
        order,
      });
    },
    async recordVisit(
      customerId: string,
      serviceId: string,
      operationId: string,
    ) {
      await requireAdmin();
      return httpsCallable(
        functions,
        "recordVisit",
      )({ customerId, serviceId, operationId });
    },
    async redeemReward(customerId: string, operationId: string) {
      await requireAdmin();
      return httpsCallable(
        functions,
        "redeemReward",
      )({ customerId, operationId });
    },
    async correctVisit(visitId: string, reason: string, operationId: string) {
      await requireAdmin();
      return httpsCallable(
        functions,
        "correctVisit",
      )({ visitId, reason, operationId });
    },
    async uploadPhoto(
      file: Blob,
      id: string,
      onProgress: (progress: number) => void,
    ) {
      await requireAdmin();
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 8 * 1024 * 1024
      )
        throw new Error("Unsupported image type or size.");
      const target = ref(storage, `gallery/${id}`);
      const task = uploadBytesResumable(target, file, {
        contentType: file.type,
      });
      await new Promise<void>((resolve, reject) =>
        task.on(
          "state_changed",
          (s) => onProgress((s.bytesTransferred / s.totalBytes) * 100),
          reject,
          resolve,
        ),
      );
      return getDownloadURL(target);
    },
    async deletePhoto(id: string) {
      await requireAdmin();
      await deleteObject(ref(storage, `gallery/${id}`));
    },
    async measure(
      name:
        | "page_view"
        | "service_view"
        | "enquiry_click"
        | "registration"
        | "loyalty_view",
      serviceId?: string,
    ) {
      return httpsCallable(
        functions,
        "recordAnalytics",
      )({ name, ...(serviceId ? { serviceId } : {}) });
    },
  };
}
