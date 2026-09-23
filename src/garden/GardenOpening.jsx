import { ArrowUpRight } from "lucide-react";

export default function GardenOpening({ opening, animated }) {
  return <div className="garden-opening" data-status={opening.status}>
    <div className="garden-opening-loading" hidden={opening.status !== "loading"}>
      <div className="garden-opening-label"><span role="status">preparing the garden…</span><span aria-hidden="true">{opening.progress}%</span></div>
      <div className="garden-opening-track" role="progressbar" aria-label="Opening scene readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={opening.progress}>
        <span style={{ width: `${opening.progress}%` }} />
      </div>
      <p>Preparing the opening scene</p>
    </div>
    {opening.status === "static" && opening.reason === "timeout" && <p className="garden-opening-slow" role="status">The garden is taking a moment.<br />You can head straight to my work.</p>}
    <a href="#experience" data-journey={animated ? "true" : undefined} className={`camera-cta${opening.status === "loading" ? " garden-opening-skip" : ""}`}>
      {opening.status === "loading" ? "Skip to experience" : animated ? "Explore my work" : "View my experience"}<ArrowUpRight size={19} aria-hidden="true" />
    </a>
  </div>;
}
