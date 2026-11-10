import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { faqData } from "@/components/features/FAQ";

type Lang = "fr" | "de" | "it";
interface Entry { q: string; a: string; k?: string[] }
interface Msg { from: "bot" | "me"; text: string; link?: boolean }

// Quick answers on top of the FAQ (keywords in all three languages).
const EXTRA: Record<Lang, Entry[]> = {
  fr: [
    { q: "Combien ça coûte ?", a: "30 jours gratuits avec toutes les fonctions Pro, sans carte bancaire. Ensuite : Basic dès CHF 5.90/mois, Pro et Elite pour aller plus loin, et des formules Club. Les athlètes utilisent l'app gratuitement.", k: ["prix", "tarif", "cout", "combien", "chf", "payer", "abonnement", "gratuit", "essai"] },
    { q: "Sur quels appareils ?", a: "Appletics est une web app : ouvre app.appletics.ch sur iPhone, iPad, Android ou ordinateur. Pas d'App Store : sur iPhone/iPad, Safari → Partager → « Sur l'écran d'accueil » ; sur Android, Chrome → menu → « Installer l'application ».", k: ["iphone", "ipad", "android", "ordinateur", "telecharger", "installer", "app", "store", "appareil", "mobile"] },
    { q: "Quand est le lancement ?", a: "Le lancement officiel est le mardi 1er décembre 2026, sur app.appletics.ch.", k: ["quand", "lancement", "date", "disponible", "sortie", "decembre"] },
    { q: "Comment vous contacter ?", a: "Écris-nous à contact@appletics.ch ou sur Instagram @appletics.ch. On répond vite !", k: ["contact", "mail", "email", "aide", "support", "question", "instagram"] },
  ],
  de: [
    { q: "Was kostet es?", a: "30 Tage gratis mit allen Pro-Funktionen, ohne Kreditkarte. Danach: Basic ab CHF 5.90/Monat, Pro und Elite für mehr, sowie Vereinsabos. Für Athleten ist die App kostenlos.", k: ["preis", "kosten", "kostet", "chf", "abo", "gratis", "kostenlos", "testen"] },
    { q: "Auf welchen Geräten?", a: "Appletics ist eine Web-App: Öffne app.appletics.ch auf iPhone, iPad, Android oder Computer. Kein App Store nötig: auf iPhone/iPad Safari → Teilen → «Zum Home-Bildschirm»; auf Android Chrome → Menü → «App installieren».", k: ["iphone", "ipad", "android", "computer", "download", "installieren", "app", "store", "gerat", "handy"] },
    { q: "Wann ist der Start?", a: "Offizieller Start ist am Dienstag, 1. Dezember 2026, auf app.appletics.ch.", k: ["wann", "start", "datum", "verfugbar", "dezember"] },
    { q: "Wie erreiche ich euch?", a: "Schreib uns an contact@appletics.ch oder auf Instagram @appletics.ch.", k: ["kontakt", "mail", "email", "hilfe", "support", "frage", "instagram"] },
  ],
  it: [
    { q: "Quanto costa?", a: "30 giorni gratis con tutte le funzioni Pro, senza carta. Poi: Basic da CHF 5.90/mese, Pro ed Elite per fare di più, e piani Club. Per gli atleti l'app è gratuita.", k: ["prezzo", "costo", "costa", "quanto", "chf", "abbonamento", "gratis", "gratuito", "prova"] },
    { q: "Su quali dispositivi?", a: "Appletics è una web app: apri app.appletics.ch su iPhone, iPad, Android o computer. Niente App Store: su iPhone/iPad Safari → Condividi → «Aggiungi alla schermata Home»; su Android Chrome → menu → «Installa app».", k: ["iphone", "ipad", "android", "computer", "scaricare", "installare", "app", "store", "dispositivo", "telefono"] },
    { q: "Quando è il lancio?", a: "Il lancio ufficiale è martedì 1° dicembre 2026, su app.appletics.ch.", k: ["quando", "lancio", "data", "disponibile", "dicembre"] },
    { q: "Come contattarvi?", a: "Scrivici a contact@appletics.ch o su Instagram @appletics.ch.", k: ["contatto", "mail", "email", "aiuto", "supporto", "domanda", "instagram"] },
  ],
};
const UI = {
  fr: { title: "Assistant Appletics", hello: "Salut ! 👋 Une question sur Appletics ? Choisis un sujet ou écris-la.", ph: "Écris ta question…", none: "Je n'ai pas la réponse à ça. Écris-nous à contact@appletics.ch, on te répond vite.", open: "Poser une question", app: "Ouvrir l'app" },
  de: { title: "Appletics-Assistent", hello: "Hallo! 👋 Eine Frage zu Appletics? Wähle ein Thema oder schreib sie.", ph: "Deine Frage…", none: "Darauf habe ich keine Antwort. Schreib uns an contact@appletics.ch.", open: "Frage stellen", app: "App öffnen" },
  it: { title: "Assistente Appletics", hello: "Ciao! 👋 Una domanda su Appletics? Scegli un tema o scrivila.", ph: "Scrivi la tua domanda…", none: "Non ho la risposta. Scrivici a contact@appletics.ch.", open: "Fai una domanda", app: "Apri l'app" },
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ");
const words = (s: string) => norm(s).split(/\s+/).filter(w => w.length > 2);

function answer(lang: Lang, question: string): string | null {
  const entries: Entry[] = [...EXTRA[lang], ...(faqData[lang]?.items ?? [])];
  const qw = words(question);
  let best: Entry | null = null, bestScore = 0;
  for (const e of entries) {
    const kw = new Set((e.k ?? []).map(norm)), tq = new Set(words(e.q)), ta = new Set(words(e.a));
    let score = 0;
    for (const w of qw) { if ([...kw].some(k => w.startsWith(k) || k.startsWith(w))) score += 3; if (tq.has(w)) score += 2; else if (ta.has(w)) score += 0.5; }
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return best && bestScore >= 2 ? best.a : null;
}

// Floating help bubble (bottom right): instant answers from the FAQ, in FR / DE / IT.
export default function HelpBot() {
  const { language } = useLanguage();
  const lang = (["fr", "de", "it"].includes(language) ? language : "fr") as Lang;
  const t = UI[lang];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { setMsgs([{ from: "bot", text: t.hello }]); }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);
  const ask = (question: string) => {
    const q = question.trim(); if (!q) return;
    setMsgs(m => [...m, { from: "me", text: q }, { from: "bot", text: answer(lang, q) ?? t.none }]);
    setText("");
  };
  const chips = [...EXTRA[lang].map(e => e.q), ...(faqData[lang]?.items ?? []).slice(0, 2).map(i => i.q)];
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div role="dialog" aria-label={t.title} className="w-[min(92vw,380px)] h-[min(70vh,540px)] bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 flex flex-col overflow-hidden">
          <div className="gradient-orange px-5 py-4 flex items-center justify-between text-white">
            <div className="font-bold">{t.title}</div>
            <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/20"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.from === "me" ? "ml-auto bg-primary-500 text-white rounded-br-md" : "bg-white text-gray-800 shadow-sm rounded-bl-md"}`}>{m.text}</div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              {chips.map(c => <button key={c} type="button" onClick={() => ask(c)} className="text-xs font-semibold text-primary-600 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 hover:bg-orange-100 text-left">{c}</button>)}
            </div>
            <div ref={end} />
          </div>
          <form onSubmit={e => { e.preventDefault(); ask(text); }} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
            <input value={text} onChange={e => setText(e.target.value)} placeholder={t.ph} aria-label={t.ph} className="flex-1 min-w-0 rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <button type="submit" aria-label="Envoyer" className="w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600"><Send size={18} /></button>
          </form>
        </div>
      )}
      <button type="button" aria-label={open ? "Fermer" : t.open} onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full gradient-orange text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}
