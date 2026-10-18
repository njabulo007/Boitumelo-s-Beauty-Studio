export type Category = string;
export type Photo = {
  id: string;
  url: string;
  alt: string;
  category: Category;
  caption: string;
  source: string;
  placeholder: boolean;
};
export type Service = {
  id: string;
  name: string;
  category: Category;
  description: string;
  duration: number;
  price: number;
  archived: boolean;
};
export type Promotion = {
  id: string;
  title: string;
  description: string;
  serviceId: string;
  price: number;
  start: string;
  end: string;
  photoId: string;
  published: boolean;
};
export const business = {
  name: "Boitumelo’s",
  whatsapp: import.meta.env.VITE_SALON_WHATSAPP || "",
  address:
    import.meta.env.VITE_SALON_ADDRESS ||
    "13074 Lehole Street, Tsakane, Brakpan",
  hours: import.meta.env.VITE_SALON_HOURS || "",
  loyalty: {
    visits: 5,
    reward: "20% off one treatment",
    label: "Loyalty reward",
  },
};
export const photos: Photo[] = [
  {
    id: "nails",
    url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=85",
    alt: "Close-up of an elegant pink manicure",
    category: "Nails",
    caption: "A soft touch of pink",
    source: "Unsplash",
    placeholder: true,
  },
  {
    id: "hair",
    url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
    alt: "Hairstylist carefully styling hair in a salon",
    category: "Hair",
    caption: "Good hair, good mood",
    source: "Unsplash",
    placeholder: true,
  },
  {
    id: "beauty",
    url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
    alt: "A relaxing facial treatment",
    category: "Beauty",
    caption: "A moment just for you",
    source: "Unsplash",
    placeholder: true,
  },
  {
    id: "polish",
    url: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=80",
    alt: "Detailed nail art and polished nails",
    category: "Nails",
    caption: "The little details",
    source: "Unsplash",
    placeholder: true,
  },
];
export const services: Service[] = [
  {
    id: "gel",
    name: "Gel manicure",
    category: "Nails",
    description:
      "Beautifully shaped nails, a little cuticle care and your favourite gel colour.",
    duration: 60,
    price: 250,
    archived: false,
  },
  {
    id: "pedi",
    name: "Classic pedicure",
    category: "Nails",
    description: "A soothing soak, careful grooming and a fresh pop of colour.",
    duration: 60,
    price: 280,
    archived: false,
  },
  {
    id: "braids",
    name: "Protective styling",
    category: "Hair",
    description:
      "Thoughtful styling for a fresh look. Enquire about your preferred style.",
    duration: 180,
    price: 450,
    archived: false,
  },
  {
    id: "wash",
    name: "Wash & style",
    category: "Hair",
    description: "A refreshing wash and a finish that feels like you.",
    duration: 60,
    price: 200,
    archived: false,
  },
  {
    id: "facial",
    name: "Refreshing facial",
    category: "Beauty",
    description: "A gentle cleanse and a quiet moment to reset and recharge.",
    duration: 45,
    price: 320,
    archived: false,
  },
  {
    id: "brows",
    name: "Brow shaping",
    category: "Beauty",
    description: "A little definition to frame your natural beauty.",
    duration: 20,
    price: 90,
    archived: false,
  },
];
export const categories: Category[] = ["Nails", "Hair", "Beauty"];
export const money = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
export function saDateInput(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function enquiryLink(subject: string) {
  const number = business.whatsapp.replace(/\D/g, "");
  return /^[1-9]\d{7,14}$/.test(number)
    ? `https://wa.me/${number}?text=${encodeURIComponent(`Hello Boitumelo! I’d like to enquire about ${subject}. Please let me know availability and the confirmed price.`)}`
    : null;
}
