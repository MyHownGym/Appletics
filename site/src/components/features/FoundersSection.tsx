import { useState } from "react";
import { Star, UserCheck, Users, CheckCircle, Instagram, Phone, Mail, User } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { OFFER_COPY } from "@/constants/offers";

const content = {
  fr: {
    badge: "Programme fondateurs",
    title: "Devenez Coach ou Club Fondateur",
    subtitle: "Rejoignez les premiers à façonner Appletics. Places limitées — uniquement pendant la phase de lancement.",
    perks: [
      OFFER_COPY.fr.founders,
      "Badge exclusif « Fondateur » sur votre profil",
      "Accès anticipé avant la sortie officielle",
      "Influence directe sur les fonctionnalités",
      "Mise en avant sur le site et les réseaux",
    ],
    form: {
      title: "Rejoindre le programme",
      typeLabel: "Je suis…",
      typeCoach: "Coach",
      typeClub: "Club / Association",
      firstName: "Prénom *",
      lastName: "Nom *",
      email: "E-mail *",
      club: "Club / Association",
      phone: "Natel (optionnel)",
      instagram: "Instagram (optionnel)",
      language: "Langue",
      langFr: "Français",
      langDe: "Deutsch",
      langIt: "Italiano",
      message: "Quelques mots sur vous ou votre club (optionnel)",
      submit: "Envoyer ma candidature →",
      success: "Merci ! Votre candidature a été envoyée. Nous revenons vers vous très vite.",
      required: "* Champs obligatoires",
    },
    foundersTitle: "Coachs & Clubs fondateurs",
    foundersEmpty: "Soyez parmi les premiers — les places sont limitées !",
    foundersCoaches: [
      { name: "Sophie M.", role: "Coach demi-fond", location: "Lausanne", lang: "FR" },
      { name: "Markus B.", role: "Coach sprint", location: "Zurich", lang: "DE" },
      { name: "Marco R.", role: "Allenatore salti", location: "Lugano", lang: "IT" },
    ],
    spotsLeft: "places restantes",
  },
  de: {
    badge: "Gründerprogramm",
    title: "Werden Sie Gründer-Coach oder Gründer-Verein",
    subtitle: "Gehören Sie zu den Ersten, die Appletics mitgestalten. Begrenzte Plätze — nur während der Startphase.",
    perks: [
      OFFER_COPY.de.founders,
      "Exklusives «Gründer»-Badge auf Ihrem Profil",
      "Frühzeitiger Zugang vor der offiziellen Veröffentlichung",
      "Direkten Einfluss auf Funktionen",
      "Präsentation auf der Website und in sozialen Medien",
    ],
    form: {
      title: "Am Programm teilnehmen",
      typeLabel: "Ich bin…",
      typeCoach: "Coach",
      typeClub: "Verein / Verband",
      firstName: "Vorname *",
      lastName: "Nachname *",
      email: "E-Mail *",
      club: "Verein / Verband",
      phone: "Telefon (optional)",
      instagram: "Instagram (optional)",
      language: "Sprache",
      langFr: "Français",
      langDe: "Deutsch",
      langIt: "Italiano",
      message: "Ein paar Worte über Sie oder Ihren Verein (optional)",
      submit: "Bewerbung absenden →",
      success: "Danke! Ihre Bewerbung wurde gesendet. Wir melden uns schnellstmöglich.",
      required: "* Pflichtfelder",
    },
    foundersTitle: "Gründer-Coaches & Gründer-Vereine",
    foundersEmpty: "Seien Sie unter den Ersten — die Plätze sind begrenzt!",
    foundersCoaches: [
      { name: "Sophie M.", role: "Mittelstrecken-Trainerin", location: "Lausanne", lang: "FR" },
      { name: "Markus B.", role: "Sprint-Trainer", location: "Zürich", lang: "DE" },
      { name: "Marco R.", role: "Sprung-Trainer", location: "Lugano", lang: "IT" },
    ],
    spotsLeft: "Plätze übrig",
  },
  it: {
    badge: "Programma fondatori",
    title: "Diventa Coach o Club Fondatore",
    subtitle: "Unisciti ai primi che plasmano Appletics. Posti limitati — solo durante la fase di lancio.",
    perks: [
      OFFER_COPY.it.founders,
      "Badge esclusivo «Fondatore» sul tuo profilo",
      "Accesso anticipato prima del lancio ufficiale",
      "Influenza diretta sulle funzionalità",
      "Presentazione sul sito e sui social",
    ],
    form: {
      title: "Unirsi al programma",
      typeLabel: "Sono…",
      typeCoach: "Coach",
      typeClub: "Club / Associazione",
      firstName: "Nome *",
      lastName: "Cognome *",
      email: "E-mail *",
      club: "Club / Associazione",
      phone: "Telefono (opzionale)",
      instagram: "Instagram (opzionale)",
      language: "Lingua",
      langFr: "Français",
      langDe: "Deutsch",
      langIt: "Italiano",
      message: "Qualche parola su di te o sul tuo club (opzionale)",
      submit: "Invia la mia candidatura →",
      success: "Grazie! La tua candidatura è stata inviata. Ti ricontatteremo presto.",
      required: "* Campi obbligatori",
    },
    foundersTitle: "Coach e Club fondatori",
    foundersEmpty: "Sii tra i primi — i posti sono limitati!",
    foundersCoaches: [
      { name: "Sophie M.", role: "Coach mezzofondo", location: "Losanna", lang: "FR" },
      { name: "Markus B.", role: "Coach sprint", location: "Zurigo", lang: "DE" },
      { name: "Marco R.", role: "Allenatore salti", location: "Lugano", lang: "IT" },
    ],
    spotsLeft: "posti rimasti",
  },
};

const LANG_FLAGS: Record<string, string> = { FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹" };
const TOTAL_SPOTS = 15;
const TAKEN_SPOTS = 3;

export default function FoundersSection() {
  const { language } = useLanguage();
  const t = content[language];
  const f = t.form;

  const [type, setType] = useState<"coach" | "club">("coach");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    club: "",
    phone: "",
    instagram: "",
    lang: language,
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      type === "coach" ? "Coach Fondateur Appletics" : "Club Fondateur Appletics"
    );
    const body = encodeURIComponent(
      `Type: ${type === "coach" ? f.typeCoach : f.typeClub}\nPrénom: ${form.firstName}\nNom: ${form.lastName}\nE-mail: ${form.email}\nClub: ${form.club}\nNatel: ${form.phone}\nInstagram: ${form.instagram}\nLangue: ${form.lang}\nMessage: ${form.message}`
    );
    window.location.href = `mailto:contact@appletics.ch?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const spotsLeft = TOTAL_SPOTS - TAKEN_SPOTS;

  return (
    <section id="founders" className="py-20 lg:py-28 bg-[#FFF4EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div data-scroll-reveal="left" className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block bg-yellow-50 text-yellow-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-yellow-200">
            ⭐ {t.badge}
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
            {t.title}
          </h2>
          <p className="text-lg text-gray-500">{t.subtitle}</p>

          {/* Spots counter */}
          <div className="mt-6 inline-flex items-center gap-3 bg-white border border-primary-100 rounded-full px-5 py-2.5 shadow-sm">
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_SPOTS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${i < TAKEN_SPOTS ? "bg-primary-500" : "bg-gray-200"}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              <span className="text-primary-500">{spotsLeft}</span> {t.spotsLeft}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Perks + Founders wall */}
          <div className="space-y-8">
            {/* Perks */}
            <div data-scroll-reveal="left" className="bg-white rounded-2xl p-7 border border-orange-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Star size={20} className="text-yellow-400" fill="currentColor" />
                <h3 className="font-bold text-gray-900 text-lg">
                  {language === "fr" ? "Vos avantages fondateurs" : language === "de" ? "Ihre Gründervorteile" : "I tuoi vantaggi da fondatore"}
                </h3>
              </div>
              <ul className="space-y-3.5">
                {t.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{perk}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">{OFFER_COPY[language].foundersDuration}</p>
            </div>

            {/* Founders wall */}
            <div data-scroll-reveal="left" className="bg-white rounded-2xl p-7 border border-orange-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-5">{t.foundersTitle}</h3>
              <div className="space-y-3">
                {t.foundersCoaches.map((coach, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {coach.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{coach.name}</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          ⭐ Fondateur
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {coach.role} · {coach.location}
                      </div>
                    </div>
                    <span className="text-lg flex-shrink-0">{LANG_FLAGS[coach.lang]}</span>
                  </div>
                ))}
                {/* Empty slot teaser */}
                <div className="flex items-center gap-4 p-3.5 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-xl font-light">?</span>
                  </div>
                  <span className="text-sm text-gray-400 italic">{t.foundersEmpty}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div id="founders-form" tabIndex={-1} aria-labelledby="founders-form-title" data-scroll-reveal="right" className="scroll-mt-24 bg-white rounded-2xl p-7 border border-orange-100 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">
            <h3 id="founders-form-title" className="font-bold text-gray-900 text-xl mb-6">{f.title}</h3>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="text-gray-700 font-medium text-base max-w-xs">{f.success}</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm text-primary-500 hover:underline"
                >
                  {language === "fr" ? "Envoyer une autre candidature" : language === "de" ? "Weitere Bewerbung senden" : "Invia un'altra candidatura"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    {f.typeLabel}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setType("coach")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        type === "coach"
                          ? "bg-primary-500 text-white border-primary-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <UserCheck size={15} />
                      {f.typeCoach}
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("club")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        type === "club"
                          ? "bg-primary-500 text-white border-primary-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Users size={15} />
                      {f.typeClub}
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.firstName}</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                        placeholder="Sophie"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.lastName}</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                        placeholder="Müller"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.email}</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                      placeholder="coach@monclub.ch"
                    />
                  </div>
                </div>

                {/* Club */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.club}</label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.club}
                      onChange={(e) => setForm({ ...form, club: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                      placeholder="Athletics Club Zürich"
                    />
                  </div>
                </div>

                {/* Optional fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.phone}</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                        placeholder="+41 79 000 00 00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.instagram}</label>
                    <div className="relative">
                      <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={form.instagram}
                        onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                        placeholder="@moncompte"
                      />
                    </div>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.language}</label>
                  <select
                    value={form.lang}
                    onChange={(e) => setForm({ ...form, lang: e.target.value as typeof language })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition bg-white"
                  >
                    <option value="fr">🇫🇷 {f.langFr}</option>
                    <option value="de">🇩🇪 {f.langDe}</option>
                    <option value="it">🇮🇹 {f.langIt}</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.message}</label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none"
                    placeholder={
                      language === "fr"
                        ? "Je coach le sprint depuis 8 ans au LC Lausanne..."
                        : language === "de"
                        ? "Ich trainiere seit 8 Jahren Sprint beim LC Zürich..."
                        : "Alleno lo sprint da 8 anni all'AC Lugano..."
                    }
                  />
                </div>

                <p className="text-xs text-gray-400">{f.required}</p>

                <button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md text-sm"
                >
                  {f.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
