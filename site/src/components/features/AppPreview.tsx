import { CalendarDays, Home, MessageCircle, Trophy, Users } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import logoIcon from "@/assets/logo-icon.png";

const COPY = {
  fr: { greeting: "Votre espace club", athletes: "Athlètes", plans: "Plans actifs", meets: "Compétitions", calendar: "Calendrier", sessions: ["Sprint 100 m · 18h00", "Sauts · 17h30", "Demi-fond · 19h00"], next: "Prochaine séance", group: "Groupe sprint", today: "Aujourd’hui · 18h00" },
  de: { greeting: "Ihr Vereinsbereich", athletes: "Athleten", plans: "Aktive Pläne", meets: "Wettkämpfe", calendar: "Kalender", sessions: ["Sprint 100 m · 18:00", "Sprung · 17:30", "Mittelstrecke · 19:00"], next: "Nächstes Training", group: "Sprintgruppe", today: "Heute · 18:00" },
  it: { greeting: "Il tuo spazio club", athletes: "Atleti", plans: "Piani attivi", meets: "Gare", calendar: "Calendario", sessions: ["Sprint 100 m · 18:00", "Salti · 17:30", "Mezzofondo · 19:00"], next: "Prossimo allenamento", group: "Gruppo sprint", today: "Oggi · 18:00" },
};

export default function AppPreview() {
  const { language } = useLanguage();
  const t = COPY[language];
  return (
    <div aria-hidden="true" className="iphone-preview flex h-full flex-col gap-2 px-3 pb-2">
      <div className="flex items-center gap-2 pb-1"><img src={logoIcon} alt="" className="h-8 w-8 rounded-lg" /><span className="text-base font-bold">Appletics</span></div>
      <div className="iphone-card rounded-2xl p-3">
        <p className="iphone-subtle text-[11px]">{t.greeting}</p><p className="mb-3 text-sm font-bold">Athletics Club</p>
        <div className="grid grid-cols-3 gap-1">
          {[{ value: "28", label: t.athletes }, { value: "5", label: t.plans }, { value: "3", label: t.meets }].map((stat) => (
            <div key={stat.label} className="iphone-stat rounded-lg px-1 py-2 text-center"><p className="iphone-accent text-lg font-bold">{stat.value}</p><p className="iphone-subtle text-[9px]">{stat.label}</p></div>
          ))}
        </div>
      </div>
      <div className="iphone-card rounded-2xl p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold"><CalendarDays size={15} className="iphone-accent" />{t.calendar}</p>
        {t.sessions.map((session) => <p key={session} className="iphone-session flex items-center gap-2 py-2 text-[11px]"><span className="iphone-dot h-1.5 w-1.5 shrink-0 rounded-full" />{session}</p>)}
      </div>
      <div className="iphone-card mt-auto flex justify-around rounded-2xl p-3">
        <Home size={19} className="iphone-accent" /><Users size={19} /><Trophy size={19} /><MessageCircle size={19} />
      </div>
    </div>
  );
}
