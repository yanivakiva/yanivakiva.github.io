import { ArrowUpRight, RotateCw } from "lucide-react";

export default function GardenOpening({ opening, onExplore, onRetry }) {
  const preparing = opening.status === "loading" || opening.status === "slow";
  return <div className="garden-opening" data-status={opening.status}>
    {preparing && <div className="garden-opening-loading">
      <div className="garden-opening-label"><span role="status">{opening.status === "slow" ? "still preparing the garden…" : "preparing the garden…"}</span><span aria-hidden="true">{opening.progress}%</span></div>
      <div className="garden-opening-track" role="progressbar" aria-label="Garden journey loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={opening.progress}>
        <span style={{ width: `${opening.progress}%` }} />
      </div>
      <p>The whole journey, ready before you scroll.</p>
    </div>}
    {opening.status === "error" && <div className="garden-opening-error">
      <p role="alert">The garden couldn’t finish loading.<br />Check your connection and try again.</p>
      <button type="button" className="camera-cta" onClick={onRetry}>Retry loading <RotateCw size={16} aria-hidden="true" /></button>
    </div>}
    {opening.status === "ready" && <button type="button" className="camera-cta" data-journey="true" onClick={onExplore}>Explore my work <ArrowUpRight size={19} aria-hidden="true" /></button>}
  </div>;
}
