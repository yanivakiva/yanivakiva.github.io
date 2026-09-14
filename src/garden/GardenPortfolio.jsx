import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  ArrowUpRight,
  Github,
  Linkedin,
  MoveUpRight,
  Plus,
  Printer,
  Wind,
} from "lucide-react";
import GardenJourney, { SceneImage } from "./GardenJourney";
import { activeCareerIndex, printDisclosures } from "./journey-state";

const roles = [
  {
    company: "Sygnia",
    companyUrl: "https://www.sygnia.co/",
    role: "Senior Backend Engineer",
    dates: "Dec 2022 — Present",
    years: "2022—",
    focus: "Security, at scale.",
    description:
      "Distributed backend systems processing more than 3 petabytes of security telemetry every month.",
    points: [
      "Building and scaling FastAPI services on Kubernetes for high-volume security workloads.",
      "Developing EDR agents in Rust, connecting low-level OS telemetry to centralized detection pipelines.",
    ],
    more: [
      "End-to-end observability with Datadog: metrics, logs, tracing, and alerts.",
      "CI/CD pipelines with Azure DevOps and ArgoCD for automated deployment and rollout.",
    ],
    skills: ["Python", "Rust", "Kubernetes", "Datadog"],
  },
  {
    company: "DOKKA",
    companyUrl: "https://www.dokka.com/",
    role: "Backend Engineer",
    dates: "Nov 2020 — Oct 2022",
    years: "2020—22",
    focus: "Making sense of documents.",
    description:
      "Backend services and asynchronous workflows for document understanding and enterprise automation.",
    points: [
      "Built a RabbitMQ processing framework that improved throughput by approximately 30%.",
      "Developed key-phrase extraction, table parsing, document matching, and asynchronous batch analysis.",
    ],
    more: [
      "Built services and middleware with Python, Flask, and SQLAlchemy.",
      "Integrated the platform with SAP ERP systems to support enterprise customers.",
    ],
    skills: ["Python", "RabbitMQ", "Flask", "SQLAlchemy"],
  },
  {
    company: "IDF Intelligence",
    companyUrl: null,
    role: "Backend Engineer",
    dates: "Feb 2018 — Nov 2020",
    years: "2018—20",
    focus: "Reliable systems, from the start.",
    description:
      "Distributed data-processing systems for intelligence workloads, across relational and non-relational datasets.",
    points: [
      "Built Python microservices deployed to Kubernetes with automated CI/CD.",
      "Worked with research and operational teams to turn complex requirements into reliable backend systems.",
    ],
    more: [],
    skills: ["Python", "SQL", "Flask", "Kubernetes"],
  },
];

function Chapter({ number, children, end }) {
  return (
    <div className="chapter">
      <span>
        {number} / {children}
      </span>
      <span className="chapter-rule" />
      <span className="chapter-end">{end}</span>
    </div>
  );
}

function Experience({ onActiveRole, activeRole }) {
  const section = useRef(null);
  useEffect(() => {
    let frame = 0;
    const element = section.current;
    const stops = [...element.querySelectorAll(".career-stop")];
    function measure() {
      frame = 0;
      const readingLine = Math.min(300, window.innerHeight * 0.35);
      onActiveRole(
        activeCareerIndex(
          stops.map((stop) => stop.getBoundingClientRect().top),
          readingLine,
        ),
      );
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [onActiveRole]);

  // Print every achievement, then restore exactly the reader's disclosure state.
  useEffect(() => {
    const disclosure = printDisclosures(() =>
      section.current.querySelectorAll("details"),
    );
    window.addEventListener("beforeprint", disclosure.before);
    window.addEventListener("afterprint", disclosure.after);
    return () => {
      disclosure.after();
      window.removeEventListener("beforeprint", disclosure.before);
      window.removeEventListener("afterprint", disclosure.after);
    };
  }, []);
  return (
    <section
      id="experience"
      className="experience-section"
      ref={section}
      aria-labelledby="experience-title"
    >
      <div className="experience-reading">
        <p className="eyebrow experience-eyebrow">THE WORK / 2018 — NOW</p>
        <div className="section-intro">
          <h2 id="experience-title">
            Experience<em>.</em>
          </h2>
          <p>
            From document workflows to security telemetry, I build the systems
            behind the scenes.
          </p>
        </div>
        <div className="career-path">
          <div className="career-track" aria-hidden="true" />
          {roles.map((role, index) => (
            <article
              className="career-stop"
              key={role.company}
              id={`role-${index}`}
              data-active={activeRole === index}
            >
              <span className="career-node" aria-hidden="true" />
              <div className="career-company">
                <h3>
                  {role.companyUrl ? (
                    <a href={role.companyUrl} target="_blank" rel="noreferrer">
                      {role.company}
                      <ArrowUpRight size={21} aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  ) : (
                    role.company
                  )}
                </h3>
                <p className="role-title">{role.role}</p>
                <p className="role-dates">{role.dates}</p>
              </div>
              <div
                className="mobile-career-scene"
                data-scene={["workshop", "bridge", "arrival"][index]}
              >
                <SceneImage
                  scene={["workshop", "bridge", "arrival"][index]}
                  lazy
                />
              </div>
              <div className="career-story">
                <h4>{role.focus}</h4>
                <p className="role-description">{role.description}</p>
                <ul className="role-points">
                  {role.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {role.more.length > 0 && (
                  <details className="role-details">
                    <summary>
                      A little more detail <Plus size={16} aria-hidden="true" />
                    </summary>
                    <ul className="role-points">
                      {role.more.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <ul className="role-skills" aria-label="Technologies">
                  {role.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
      <nav className="chapter-navigation" aria-label="Career chapters">
        {roles.map((role, index) => (
          <a
            key={role.company}
            href={`#role-${index}`}
            aria-current={activeRole === index ? "step" : undefined}
          >
            <span className="chapter-dot" />
            {role.company}
          </a>
        ))}
      </nav>
    </section>
  );
}

export default function GardenPortfolio() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [motionOff, setMotionOff] = useState(() => {
    try {
      return localStorage.getItem("garden.motion") === "off";
    } catch {
      return false;
    }
  });
  const [foxGreeting, setFoxGreeting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 36));
  const motionEnabled = !reducedMotion && !motionOff;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("garden.motion", motionOff ? "off" : "on");
    } catch {
      /* Private browsing can disable storage. */
    }
  }, [motionOff]);
  useEffect(() => {
    if (!foxGreeting) return;
    const timeout = setTimeout(() => setFoxGreeting(false), 3500);
    return () => clearTimeout(timeout);
  }, [foxGreeting]);

  const motionControl = (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={motionEnabled}
      aria-label={`Motion ${motionEnabled ? "on" : "off"}`}
      disabled={reducedMotion}
      onClick={() => setMotionOff((value) => !value)}
      title={
        reducedMotion
          ? "Following your system reduced-motion preference"
          : "Turn decorative motion on or off"
      }
    >
      <Wind size={16} aria-hidden="true" />
      <span>
        {reducedMotion
          ? "Motion off"
          : `Motion ${motionEnabled ? "on" : "off"}`}
      </span>
    </button>
  );

  return (
    <div className="garden-page" data-motion={motionEnabled ? "on" : "off"}>
      <a className="skip-link" href="#experience">
        Skip to experience
      </a>
      <header className="garden-header" data-scrolled={scrolled}>
        <a className="wordmark" href="#home" aria-label="Yaniv Akiva, home">
          YA <span>/</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#experience">Experience</a>
          <a href="#about">About</a>
          <button
            type="button"
            className="cv-button"
            onClick={() => window.print()}
            aria-label="Print or save CV"
          >
            <Printer size={16} aria-hidden="true" />
            <span className="cv-label-wide">Print CV</span>
            <span className="cv-label-small">CV</span>
          </button>
          {motionControl}
        </nav>
      </header>
      <main>
        <GardenJourney motionEnabled={motionEnabled}>
          {(onActiveRole, activeRole) => (
            <Experience
              motionEnabled={motionEnabled}
              onActiveRole={onActiveRole}
              activeRole={activeRole}
            />
          )}
        </GardenJourney>
        <section
          id="about"
          className="about-section section-shell"
          aria-labelledby="about-title"
        >
          <Chapter number="03" end="BEYOND THE CODE">
            A LITTLE ABOUT ME
          </Chapter>
          <div className="about-layout">
            <div className="about-portrait">
              <img
                src="/garden/yaniv.webp"
                alt="Yaniv by the turquoise sea on a trip."
                width="640"
                height="780"
                loading="lazy"
              />
              <span className="portrait-caption">
                Usually curious. Occasionally outdoors.
              </span>
            </div>
            <div className="about-copy">
              <h2 id="about-title">
                An engineer. <br />
                And a few <br />
                <em>other things.</em>
              </h2>
              <p>
                I’m Yaniv, a software engineer based in Israel. I’m drawn to
                problems that need both careful thinking and a little
                imagination.
              </p>
              <p>
                My work spans distributed systems, backend services, and
                security infrastructure. Outside of it, you’ll often find me
                cooking, travelling, or getting out into nature.
              </p>
              <p className="about-note">
                There’s always something new to figure out.
              </p>
              <div className="about-links">
                <a
                  href="https://github.com/yanivakiva"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={18} aria-hidden="true" /> GitHub{" "}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
                <a
                  href="https://www.linkedin.com/in/yanivakiva"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin size={18} aria-hidden="true" /> LinkedIn{" "}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>
        <section
          id="contact"
          className="contact-section section-shell"
          aria-labelledby="contact-title"
        >
          <Chapter number="04" end="SAY HELLO">
            THE NEXT CHAPTER
          </Chapter>
          <div className="contact-layout">
            <div>
              <h2 id="contact-title">
                Good things start <br />
                with a <em>hello.</em>
              </h2>
              <a className="contact-email" href="mailto:contact@yanivakiva.com">
                contact@yanivakiva.com{" "}
                <MoveUpRight size={23} aria-hidden="true" />
              </a>
            </div>
            <div className="contact-companion">
              <motion.button
                className="contact-fox-button"
                type="button"
                aria-label="Say hello to the paper fox"
                onClick={() => setFoxGreeting((value) => !value)}
                animate={
                  foxGreeting && motionEnabled
                    ? { y: [0, -14, 0], rotate: [0, -5, 3, 0] }
                    : { y: 0, rotate: 0 }
                }
                transition={{ duration: motionEnabled ? 0.55 : 0 }}
              >
                <img
                  className="contact-fox"
                  src="/garden/fox.webp"
                  alt=""
                  width="640"
                  height="640"
                  loading="lazy"
                />
              </motion.button>
              <p className="companion-invitation">
                A familiar face. Say hello.
              </p>
              <p className="companion-reply" role="status">
                {foxGreeting ? "You made it. Glad you’re here." : ""}
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="garden-footer section-shell">
        <span>
          Yaniv Akiva <span className="footer-slash">/</span>{" "}
          {new Date().getFullYear()}
        </span>
        {motionControl}
        <a href="#home">
          Back to the garden <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </footer>
      <div className="print-heading">
        <h1>Yaniv Akiva</h1>
        <p>
          Senior Software Engineer · contact@yanivakiva.com · yanivakiva.com
        </p>
      </div>
    </div>
  );
}
