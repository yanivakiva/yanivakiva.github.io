import { ArrowUpRight } from "lucide-react";

export default function GardenOpening({ opening, animated }) {
  const preparing = opening.status === "loading" || opening.status === "slow";
  return <div className="garden-opening" data-status={opening.status}>
    <div className="garden-opening-loading" hidden={!preparing}>
      <div className="garden-opening-label"><span role="status">{opening.status === "slow" ? "still preparing the garden…" : "preparing the garden…"}</span><span aria-hidden="true">{opening.progress}%</span></div>
      <div className="garden-opening-track" role="progressbar" aria-label="Opening scene readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={opening.progress}>
        <span style={{ width: `${opening.progress}%` }} />
      </div>
      <p>{opening.status === "slow" ? "You can keep browsing while it loads." : "Preparing the opening scene"}</p>
    </div>
    <a href="#experience" data-journey={animated ? "true" : undefined} className={`camera-cta${preparing ? " garden-opening-skip" : ""}`}>
      {preparing ? "Skip to experience" : animated ? "Explore my work" : "View my experience"}<ArrowUpRight size={19} aria-hidden="true" />
    </a>
  </div>;
}
