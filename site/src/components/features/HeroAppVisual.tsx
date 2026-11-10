import { useLanguage } from "@/hooks/useLanguage";
import IPhoneFrame from "@/components/features/IPhoneFrame";
import AppPreview from "@/components/features/AppPreview";

const CAPTION = { fr: "Aperçu illustratif de l’app", de: "Illustrative App-Vorschau", it: "Anteprima illustrativa dell’app" };

export default function HeroAppVisual() {
  const { language } = useLanguage();
  return (
    <figure data-scroll-reveal="right" className="relative mx-auto w-full max-w-sm px-4 pt-8 lg:pt-0">
      <IPhoneFrame><AppPreview /></IPhoneFrame>
      <figcaption className="mt-5 text-center text-sm text-primary-foreground/80">{CAPTION[language]}</figcaption>
    </figure>
  );
}
