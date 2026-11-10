import type { ReactNode } from "react";
import { BatteryFull, Signal, Wifi } from "lucide-react";
import "@/styles/iphone.css";

interface IPhoneFrameProps {
  children: ReactNode;
}

export default function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="iphone-frame relative isolate mx-auto w-full max-w-[300px] rounded-[48px] p-[9px]">
      <span aria-hidden="true" className="iphone-button iphone-mute" />
      <span aria-hidden="true" className="iphone-button iphone-volume-up" />
      <span aria-hidden="true" className="iphone-button iphone-volume-down" />
      <span aria-hidden="true" className="iphone-button iphone-power" />
      <div className="iphone-screen relative flex aspect-[9/19.5] flex-col overflow-hidden rounded-[39px]">
        <div aria-hidden="true" className="iphone-status relative flex h-14 shrink-0 items-center justify-between px-5 pt-1">
          <span className="text-xs font-semibold">9:41</span>
          <span className="iphone-island absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full" />
          <span className="flex items-center gap-1"><Signal size={12} /><Wifi size={12} /><BatteryFull size={17} /></span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        <div aria-hidden="true" className="iphone-home-zone flex h-6 shrink-0 items-center justify-center">
          <span className="iphone-home h-1 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
