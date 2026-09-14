import CameraPortfolio from "./garden/CameraPortfolio";
import { lazy, Suspense } from "react";
const Studio = import.meta.env.DEV ? lazy(() => import("./garden/world/GardenStudio")) : null;
const Film = import.meta.env.DEV ? lazy(() => import("./garden/FilmReview")) : null;

export default function App() {
  if (Studio && new URLSearchParams(window.location.search).has("studio")) return <Suspense fallback="Loading garden studio…"><Studio /></Suspense>;
  if (Film && new URLSearchParams(window.location.search).has("film")) return <Suspense fallback="Loading film…"><Film /></Suspense>;
  return <CameraPortfolio />;
}
