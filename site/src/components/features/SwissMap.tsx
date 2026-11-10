import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { X, MapPin, Users, Trophy } from "lucide-react";

interface Club {
  id: number;
  name: string;
  city: string;
  canton: string;
  athletes: number;
  disciplines: string[];
  cx: number; // SVG x coordinate (%)
  cy: number; // SVG y coordinate (%)
  color: string;
}

const CLUBS: Club[] = [
  { id: 1, name: "LC Zürich", city: "Zürich", canton: "ZH", athletes: 320, disciplines: ["Sprint", "Demi-fond", "Sauts"], cx: 56, cy: 22, color: "#1a56db" },
  { id: 2, name: "LC Bern", city: "Bern", canton: "BE", athletes: 280, disciplines: ["Sprint", "Lancers", "Épreuves combinées"], cx: 42, cy: 38, color: "#e3a008" },
  { id: 3, name: "Lausanne-Sports", city: "Lausanne", canton: "VD", athletes: 260, disciplines: ["Demi-fond", "Sauts", "Sprint"], cx: 28, cy: 55, color: "#e02424" },
  { id: 4, name: "SAC Lugano", city: "Lugano", canton: "TI", athletes: 140, disciplines: ["Sprint", "Sauts"], cx: 56, cy: 78, color: "#057a55" },
  { id: 5, name: "STV Basel", city: "Basel", canton: "BS", athletes: 210, disciplines: ["Sprint", "Lancers", "Fond"], cx: 36, cy: 14, color: "#7e3af2" },
  { id: 6, name: "CA Genève", city: "Genève", canton: "GE", athletes: 190, disciplines: ["Demi-fond", "Sprint", "Sauts"], cx: 18, cy: 64, color: "#e02424" },
  { id: 7, name: "TV Winterthur", city: "Winterthur", canton: "ZH", athletes: 165, disciplines: ["Fond", "Sprint"], cx: 60, cy: 16, color: "#1a56db" },
  { id: 8, name: "LV Luzern", city: "Luzern", canton: "LU", athletes: 175, disciplines: ["Sprint", "Sauts", "Lancers"], cx: 48, cy: 32, color: "#c27803" },
  { id: 9, name: "ATS St. Gallen", city: "St. Gallen", canton: "SG", athletes: 145, disciplines: ["Demi-fond", "Épreuves combinées"], cx: 72, cy: 22, color: "#6875f5" },
  { id: 10, name: "LC Sion", city: "Sion", canton: "VS", athletes: 120, disciplines: ["Sprint", "Sauts"], cx: 40, cy: 64, color: "#e02424" },
];

const content = {
  fr: {
    badge: "Athlétisme suisse",
    title: "L'athlétisme suisse en chiffres",
    subtitle: "Découvrez les clubs actifs sur Appletics à travers toute la Suisse.",
    stats: [
      { value: "524", label: "Clubs en Suisse" },
      { value: "37 200", label: "Membres actifs" },
      { value: "26", label: "Cantons couverts" },
    ],
    clickHint: "Cliquez sur un marqueur pour découvrir le club",
    athletes: "athlètes",
    disciplines: "Disciplines",
    close: "Fermer",
  },
  de: {
    badge: "Schweizer Leichtathletik",
    title: "Schweizer Leichtathletik in Zahlen",
    subtitle: "Entdecken Sie die aktiven Vereine auf Appletics in der ganzen Schweiz.",
    stats: [
      { value: "524", label: "Vereine in der Schweiz" },
      { value: "37 200", label: "Aktive Mitglieder" },
      { value: "26", label: "Abgedeckte Kantone" },
    ],
    clickHint: "Klicken Sie auf eine Markierung, um den Verein zu entdecken",
    athletes: "Athleten",
    disciplines: "Disziplinen",
    close: "Schliessen",
  },
  it: {
    badge: "Atletica svizzera",
    title: "L'atletica svizzera in numeri",
    subtitle: "Scoprite i club attivi su Appletics in tutta la Svizzera.",
    stats: [
      { value: "524", label: "Club in Svizzera" },
      { value: "37 200", label: "Membri attivi" },
      { value: "26", label: "Cantoni coperti" },
    ],
    clickHint: "Clicca su un marcatore per scoprire il club",
    athletes: "atleti",
    disciplines: "Discipline",
    close: "Chiudi",
  },
};

// Simplified Switzerland SVG path
const SWISS_PATH = "M 20 45 L 22 38 L 28 34 L 30 28 L 35 25 L 38 20 L 44 18 L 50 16 L 56 14 L 62 15 L 68 18 L 74 20 L 78 25 L 80 30 L 78 36 L 80 42 L 78 48 L 74 52 L 70 55 L 68 60 L 64 65 L 60 70 L 56 75 L 52 78 L 48 76 L 44 72 L 40 68 L 36 65 L 32 62 L 28 58 L 24 54 L 20 50 Z";

export default function SwissMap() {
  const { language } = useLanguage();
  const t = content[language];
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [hoveredClub, setHoveredClub] = useState<number | null>(null);

  return (
    <section id="map" className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block bg-primary-50 text-primary-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary-100">
            🇨🇭 {t.badge}
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
            {t.title}
          </h2>
          <p className="text-lg text-gray-500">{t.subtitle}</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          {t.stats.map((stat, i) => (
            <div key={i} className="text-center bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="text-3xl font-black text-primary-500">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Map area */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 via-gray-50 to-green-50 rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                style={{ background: "transparent" }}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Switzerland outline */}
                <path
                  d={SWISS_PATH}
                  fill="#f0f4ff"
                  stroke="#d1d5db"
                  strokeWidth="0.5"
                  className="drop-shadow-sm"
                />

                {/* Canton grid lines (subtle) */}
                <path d="M 40 25 L 38 45" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />
                <path d="M 50 20 L 48 55" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />
                <path d="M 60 22 L 58 60" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />
                <path d="M 25 40 L 70 42" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />
                <path d="M 22 50 L 68 52" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />

                {/* Swiss cross */}
                <g transform="translate(46, 36)">
                  <rect x="-1.5" y="-4" width="3" height="8" rx="0.5" fill="#FF0000" opacity="0.7" />
                  <rect x="-4" y="-1.5" width="8" height="3" rx="0.5" fill="#FF0000" opacity="0.7" />
                </g>

                {/* Club markers */}
                {CLUBS.map((club) => {
                  const isSelected = selectedClub?.id === club.id;
                  const isHovered = hoveredClub === club.id;
                  const r = isSelected ? 3.2 : isHovered ? 2.8 : 2.2;

                  return (
                    <g
                      key={club.id}
                      transform={`translate(${club.cx}, ${club.cy})`}
                      onClick={() => setSelectedClub(isSelected ? null : club)}
                      onMouseEnter={() => setHoveredClub(club.id)}
                      onMouseLeave={() => setHoveredClub(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Pulse ring */}
                      {isSelected && (
                        <circle
                          r={r + 2}
                          fill="none"
                          stroke="#e8541e"
                          strokeWidth="0.5"
                          opacity="0.4"
                        />
                      )}
                      {/* Marker */}
                      <circle
                        r={r}
                        fill={isSelected ? "#e8541e" : club.color}
                        stroke="white"
                        strokeWidth="0.8"
                        opacity={isSelected || isHovered ? 1 : 0.85}
                        style={{ transition: "all 0.2s" }}
                      />
                      {/* Label on hover/selected */}
                      {(isHovered || isSelected) && (
                        <text
                          y={-r - 1.5}
                          textAnchor="middle"
                          fontSize="3"
                          fontWeight="600"
                          fill="#1f2937"
                          style={{ pointerEvents: "none" }}
                        >
                          {club.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Click hint */}
            <div className="px-6 py-3 bg-white/80 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <MapPin size={12} className="text-primary-400" />
                {t.clickHint}
              </p>
            </div>
          </div>

          {/* Club detail card */}
          {selectedClub && (
            <div className="absolute top-4 right-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-10">
              <div
                className="h-2 w-full"
                style={{ backgroundColor: selectedClub.color }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{selectedClub.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {selectedClub.city} · {selectedClub.canton}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClub(null)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    aria-label={t.close}
                  >
                    <X size={12} className="text-gray-600" />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-3 py-2 mb-3">
                  <Users size={14} className="text-primary-500" />
                  <span className="text-sm font-bold text-primary-600">
                    {selectedClub.athletes} {t.athletes}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy size={12} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.disciplines}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClub.disciplines.map((d, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Club list grid on mobile */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CLUBS.map((club) => (
            <button
              key={club.id}
              onClick={() => setSelectedClub(selectedClub?.id === club.id ? null : club)}
              className={`text-left p-3.5 rounded-xl border transition-all hover:-translate-y-0.5 ${
                selectedClub?.id === club.id
                  ? "border-primary-300 bg-primary-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full mb-2"
                style={{ backgroundColor: club.color }}
              />
              <div className="font-semibold text-xs text-gray-900 leading-tight">{club.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{club.canton}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
