// Source: Yaniv Akiva CTO CV, supplied September 14, 2026.
// The source PDF is private. Only the public contact address belongs on the site.
export const profile = { name: "YANIV AKIVA", email: "contact@yanivakiva.com", role: "Co-Founder & CTO at Stealth Labs", portrait: "/garden/yaniv-portrait.jpg" };
export const career = [
  { company: "Stealth Labs", redacted: true, role: "Co-Founder & CTO", dates: "May 2026 — Present", years: "2026 — now", slug: "stealth", number: "01",
    title: "From a spec to a model you can ship.", description: "I co-founded the company and lead the engineering. Our platform autonomously turns customer requirements into purpose-built AI models — and we build the infrastructure to get them into production.",
    points: ["Designed the path from model development to GPU serving: reproducible builds, versioned artifacts, and monitored releases.", "Built the platform on AWS EKS with Kubernetes, Terraform, NVIDIA Triton, Prometheus, and Grafana.", "Led customer discovery and pilot delivery, turning requirements into model specifications and evaluation plans."],
    more: ["Built dynamic, specification-driven MLOps pipelines supporting multiple model types and workloads.", "Engineered Python and Rust systems with an emphasis on scalability, reproducibility, artifact integrity, observability, and controlled releases.", "Own technical strategy, architecture, the engineering roadmap, delivery planning, infrastructure, and investor-facing technical positioning."],
    proof: "Validated purpose-built models with approximately 30× lower compute requirements and comparable or better task quality than general-purpose alternatives.",
    stack: [["code", "Python / Rust"], ["platform", "AWS / Kubernetes"], ["serving", "NVIDIA Triton"], ["delivery", "Helm / Terraform"]],
    skills: ["Python", "Rust", "AWS", "Kubernetes", "NVIDIA Triton", "Terraform", "Prometheus", "Grafana"] },
  { company: "Sygnia", url: "https://www.sygnia.co/", role: "Senior Software Engineer", dates: "Dec 2022 — Aug 2026", years: "2022 — 2026", slug: "sygnia", number: "02",
    title: "A lot of data. A lot of responsibility.", description: "I helped turn a security platform used in a handful of engagements into one supporting nearly 300 companies across 29 countries, including Fortune 500 enterprises.",
    points: ["Designed and owned a production pipeline processing more than 5 PB of security telemetry every month.", "Built resilient multi-region, multi-AZ services on Kubernetes and automated releases with GitOps.", "Owned services end to end, from architecture and Rust telemetry components to on-call and incident investigation."],
    more: ["Led cross-functional projects across distributed backend systems, security analytics, and production infrastructure.", "Owned Logstash ingestion, parsing, enrichment, detection, triage, and automated response.", "Built CI/CD and GitOps workflows with Azure DevOps, ArgoCD, Helm, and Docker.", "Developed high-performance Rust components connecting low-level endpoint telemetry with centralized detection pipelines."],
    proof: "More than 5 PB of telemetry per month. Nearly 300 companies across 29 countries.",
    stack: [["code", "Python / Rust"], ["platform", "Kubernetes"], ["ingestion", "Logstash"], ["delivery", "ArgoCD / Helm"]],
    skills: ["Python", "Rust", "Kubernetes", "Logstash", "Azure DevOps", "ArgoCD"] },
  { company: "DOKKA", url: "https://www.dokka.com/", role: "Software Engineer", dates: "Nov 2020 — Oct 2022", years: "2020 — 2022", slug: "dokka", number: "03",
    title: "Making paperwork less of a thing.", description: "As an early engineer at DOKKA, I worked across document intelligence, platform architecture, cloud infrastructure, and enterprise integrations.",
    points: ["Architected and scaled asynchronous document-processing services on AKS, more than doubling throughput with queue-based processing and autoscaling workers.", "Built the Azure deployment platform from scratch, including CI/CD, secrets, and pod and node scaling.", "Worked on Hebrew and English invoice extraction, plus Redis-backed document-layout matching."],
    more: ["Built Azure DevOps CI/CD and ACR container delivery.", "Matched financial documents to learned templates using normalized OCR tokens and coordinate similarity.", "Combined machine learning, OCR, and layout analysis to classify invoices and extract financial data."],
    proof: "Queue-based processing and autoscaling workers delivered more than 2× throughput.",
    stack: [["platform", "Azure / AKS"], ["delivery", "Azure DevOps / ACR"], ["matching", "Redis"], ["documents", "OCR / ML"]],
    skills: ["Azure", "Kubernetes", "Azure DevOps", "Redis", "OCR"] },
  { company: "IDF Intelligence", role: "Engineering Team Lead", fullRole: "Software Engineering Team Lead and Commander", dates: "Feb 2018 — Nov 2020", years: "2018 — 2020", slug: "idf", number: "04",
    title: "Leading a team. Still writing the code.", description: "I led a four-person team of military personnel and civilian engineers, while staying hands-on with software, system design, and architecture.",
    points: ["Led the architecture and engineering of two mission-critical intelligence systems supporting cross-agency national-security operations.", "Owned the delivery lifecycle: requirements, roadmaps, architecture, implementation, and milestones.", "Built distributed data-processing services for security-critical intelligence workloads."],
    more: ["Owned technical mandates, Gantt planning, reporting, and delivery dates.", "Worked with Python, FastAPI, SQLAlchemy, relational and non-relational databases, Kubernetes, and automated CI/CD."],
    proof: "A four-person multidisciplinary team. Two mission-critical intelligence systems.",
    stack: [["code", "Python"], ["backend", "FastAPI / SQLAlchemy"], ["platform", "Kubernetes"], ["delivery", "Automated CI/CD"]],
    skills: ["Python", "FastAPI", "SQLAlchemy", "SQL", "Kubernetes"] },
];
export const expertise = [
  ["Languages", "Python, Rust, SQL"],
  ["Backend & data", "FastAPI, SQLAlchemy, Celery, Kafka, RabbitMQ, Redis, Elasticsearch, PostgreSQL, TimescaleDB, MongoDB"],
  ["Cloud & platform", "AWS, Azure, Kubernetes, Docker, Helm, Terraform, EKS, AKS, ArgoCD, Azure DevOps, GitHub Actions"],
  ["Reliability", "Prometheus, Grafana, Datadog, distributed tracing, performance engineering, incident response"],
];
