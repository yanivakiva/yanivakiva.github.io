import { useRef, useState } from "react";
export default function FilmReview() {
  const [variant, setVariant] = useState("wide");
  const video = useRef(null);
  return <main style={{ background: "#18231f", color: "#e8e7d9", minHeight: "100vh", padding: "28px 4vw", fontFamily: "system-ui" }}>
    <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><a href="/">← The website</a><span>GARDEN / CONTINUOUS MOTION REVIEW</span></header>
    <style>{`.film-review-controls button { color:#e8e7d9; background:#2c3c30; border:1px solid #718364; border-radius:6px; padding:12px 16px; min-height:44px; cursor:pointer; }`}</style>
    <nav className="film-review-controls" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
      <button onClick={() => setVariant("wide")}>Desktop film</button><button onClick={() => setVariant("portrait")}>Phone film</button>
      <button onClick={() => { video.current.currentTime = 0; video.current.play(); }}>Play from beginning</button>
      <button onClick={() => { video.current.currentTime = 7; video.current.play(); }}>Review bridge join</button>
      <button onClick={() => { video.current.currentTime = 13; video.current.play(); }}>Review screen approach</button>
    </nav>
    <video ref={video} key={variant} src={`/output/garden-film/review-movies/${variant}.mp4`} controls playsInline preload="metadata" style={{ display: "block", width: "100%", height: "76vh", objectFit: "contain" }} />
    <p>Generated footage, played continuously. The website adds a screen-aligned HTML handoff after the camera reaches the desk.</p>
  </main>;
}
