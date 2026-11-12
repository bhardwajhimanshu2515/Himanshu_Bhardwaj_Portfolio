"use client";
import { useEffect, useRef, useState } from "react";
import { CinematicScene } from "./cinematic";
import { useScrollChapters } from "./scroll-chapters";
import cinematicStyles from "./cinematic.module.css";
const email = "bhardwajhimanshu2515@gmail.com";
const linkedin = "https://www.linkedin.com/in/mern-full-stack-developer";
const github = "https://github.com/bhardwajhimanshu2515";
const medium = "https://medium.com/@bhardwajhimanshu2515";
const postlineRepo = "https://github.com/bhardwajhimanshu2515/postline";
const fxTargets = [
  [".hero-copy > *", "up"], [".engineering-core", "zoom"], [".impact-strip > div", "flip"],
  [".projects-head", "up"], [".postline-copy > :not(h2)", "up"], [".promo-frame", "zoom"], [".promo figcaption", "up"], ["#projects-title", "zoom"], [".postline-flow", "right"],
  [".thesis-title", "left"], [".thesis-points article", "flip"],
  [".lab-introduction > *", "left"], [".system-explorer", "right"],
  [".section-aside > *", "left"], [".career-log .role", "right"],
  [".method-heading > *", "up"], [".method-pipeline article", "flip"], [".method-return", "up"],
  [".stack-workbench", "zoom"], [".education", "up"],
  [".contact-portrait", "zoom"], [".contact > div:nth-child(2) > *", "left"], [".connection-panel", "right"],
];
function useFx3D() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const seen = new Set();
    fxTargets.forEach(([selector, kind]) => document.querySelectorAll(selector).forEach(el => {
      if (seen.has(el)) return; seen.add(el);
      const siblings = [...el.parentElement.children].filter(c => c.matches(selector));
      el.dataset.fx = kind;
      el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.09}s`);
    }));
    root.classList.add("fx");
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    seen.forEach(el => io.observe(el));
    const tiltables = document.querySelectorAll(".postline-flow, .system-explorer, .stack-workbench, .connection-panel");
    const move = event => {
      const el = event.currentTarget; if (!el.classList.contains("in")) return;
      const r = el.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5, y = (event.clientY - r.top) / r.height - 0.5;
      el.classList.add("tilting");
      el.style.transform = `perspective(1100px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(10px)`;
    };
    const leave = event => { event.currentTarget.style.transform = ""; event.currentTarget.classList.remove("tilting"); };
    if (window.matchMedia("(hover: hover)").matches) tiltables.forEach(el => { el.addEventListener("mousemove", move); el.addEventListener("mouseleave", leave); });
    return () => { io.disconnect(); root.classList.remove("fx"); tiltables.forEach(el => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); }); };
  }, []);
}
function Projects() {
  const [step, setStep] = useState(0);
  const flow = [
    ["01", "You write", "Claude", "Draft the post with Claude, then say when it should go out: now, or Monday at 9 am."],
    ["02", "Postline holds it", "Cloudflare Workers", "The post is encrypted (AES-256-GCM) and stored in D1. Claude only ever holds a Postline token, never the LinkedIn one."],
    ["03", "It goes live", "LinkedIn Posts API", "A cron runs every minute and claims due posts atomically, so nothing posts twice. Failures retry after 2, 10 and 30 minutes."],
  ];
  const facts = [["7", "tools for Claude"], ["2", "OAuth flows"], ["36", "end-to-end checks"], ["8", "post types"]];
  return <section id="projects" data-motion-chapter="projects" className={`projects wrap ${cinematicStyles.sceneSection}`} aria-labelledby="projects-title">
    <CinematicScene variant="field" className={cinematicStyles.sectionBackdrop} />
    <div className="projects-head"><span className="eyebrow">FEATURED PROJECT / 000</span><span className="projects-status"><i /> Submitted to the Claude Connectors Directory</span></div>
    <div className="postline-grid">
      <div className="postline-copy">
        <h2 id="projects-title" aria-label="Postline">{"Postline".split("").map((ch,i)=><b key={i} aria-hidden="true" className={i>3?"lime":""} style={{"--i":i}}>{ch}</b>)}</h2>
        <p className="postline-lede">A Claude connector that writes, schedules, publishes, edits and deletes LinkedIn posts. Tell Claude “post this Monday at 9 am” and close the laptop. It goes live on time.</p>
        <div className="postline-facts">{facts.map(([n,l])=><div key={l}><strong>{n}</strong><span>{l}</span></div>)}</div>
        <div className="postline-stack">{["TypeScript","Model Context Protocol","OAuth 2.1","Cloudflare Workers","D1 + KV","Cron","LinkedIn API"].map(t=><span key={t}>{t}</span>)}</div>
        <div className="actions"><a className="button" href={postlineRepo} target="_blank" rel="noreferrer">View the code <span aria-hidden="true">↗</span></a><a className="text-link" href={medium} target="_blank" rel="noreferrer">Read how I built it <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="postline-flow">
        <div className="instrument-label"><span>HOW IT WORKS</span><span>CLAUDE → POSTLINE → LINKEDIN</span></div>
        <div className="flow-rail" aria-label="Postline steps">{flow.map(([n,t],i)=><button key={n} aria-pressed={step===i} onClick={()=>setStep(i)}><span>{n}</span>{t}</button>)}</div>
        <div className="flow-readout" key={step} aria-live="polite"><span className="layer-label">{flow[step][2]}</span><h3>{flow[step][1]}</h3><p>{flow[step][3]}</p></div>
        <div className="flow-foot"><span>Supports text, articles, images, PDF carousels, video, multi-image, polls and reshares</span></div>
      </div>
    </div>
    <figure className="promo">
      <div className="promo-frame"><video controls playsInline preload="none" poster="/postline-promo-poster.jpg" aria-label="Postline promo video, 32 seconds, with music"><source src="/postline-promo.mp4" type="video/mp4" /></video></div>
      <figcaption><span className="eyebrow">WATCH / 32 SECONDS</span><p>Postline in half a minute: write in Claude, Postline holds it, it goes live on time. Every frame and every note was made in code.</p></figcaption>
    </figure>
    <div className="thesis">
      <div className="thesis-title"><span className="eyebrow">WHAT I BELIEVE</span><h2>AI is the same for everyone.<br /><em>Experience isn’t.</em></h2></div>
      <div className="thesis-points">
        {[["Context","AI raised the floor for everyone. Knowing the product, the users and the constraints is what raises the ceiling."],["The right questions","A wrong requirement gets you a beautifully tested wrong product. Deciding what “correct” means is still the engineer’s job."],["Judgment","In Postline, the tools were the easy part. OAuth, token lifetimes, retries that never double-post and LinkedIn’s rules were the real work. That part comes from experience."]].map(([t,c],i)=><article key={t}><span>0{i+1}</span><h3>{t}</h3><p>{c}</p></article>)}
      </div>
    </div>
  </section>;
}
const roles = [
  ["Jan 2025 — Present", "Senior Product Engineer — Full Stack", "Smart Energy Water Pvt. Ltd.", "Alectra Builder", "Engineer scalable applications using React, Node.js and .NET integrations. Improve component reusability, streamline MongoDB and SQL interactions, resolve production issues, and strengthen code quality through automated testing.", ["React", "Node.js", ".NET", "MongoDB", "SQL"]],
  ["Aug 2023 — Jan 2025", "Product Engineer — Full Stack", "Smart Energy Water Pvt. Ltd.", "American Water", "Reduced application load time by 20% and improved development efficiency by 30% through reusable UI components. Integrated enterprise .NET APIs, reduced testing errors by 30% using Jest and Enzyme, and reduced system crashes by 25% through targeted debugging.", ["React", "Redux", "REST APIs", "Jest", "Enzyme"]],
  ["Mar 2022 — May 2023", "React.js Developer", "Global Healthcare & Billing Partners", "Claimocity", "Built healthcare billing experiences for web, iOS, and Android with Ionic React and TypeScript in a 10-member team. Developed Node.js REST APIs and optimized MongoDB queries, reducing API response time by 20%.", ["Ionic React", "TypeScript", "Node.js", "MongoDB"]],
  ["Apr 2021 — Mar 2022", "React.js Developer", "Talentroots", "Emplify", "Led HRMS interface development with React and Redux Toolkit. Built GraphQL APIs using AWS AppSync and integrated Gusto and Slack. Developed a Slack application that improved engagement by 15%.", ["React", "Redux Toolkit", "GraphQL", "AWS AppSync"]],
  ["Feb 2021 — Apr 2021", "Platform Ops Intern", "XenonStack", "", "Built proofs of concept with React, Node.js, GraphQL, and MongoDB in a team of 10+ engineers.", ["React", "Node.js", "GraphQL"]],
  ["May 2020 — Feb 2021", "MERN Stack Developer Intern", "The Youth Project", "", "Built full-stack applications and REST APIs. Developed CI/CD pipelines and improved deployment workflows with Heroku and Netlify.", ["MERN", "CI/CD", "Heroku", "Netlify"]],
];
const expertise = [
  ["Frontend engineering", "React, Redux, Redux Toolkit, JavaScript, TypeScript, HTML, CSS, SCSS, Material UI, Ionic React"],
  ["Backend & integration", "Node.js, Express.js, REST APIs, .NET integration, GraphQL, AWS AppSync"],
  ["Data & persistence", "MongoDB, Mongoose, SQL, DynamoDB"],
  ["Quality & delivery", "Jest, Enzyme, Git, GitHub, CI/CD, Jira, Confluence, Scrum"],
];
const systems = [
  { name: "American Water", domain: "Enterprise utilities", layers: [["INTERFACE", "React + Redux", "Reusable UI components"], ["INTEGRATION", ".NET / REST APIs", "Enterprise service integration"], ["VALIDATION", "Jest + Enzyme", "Automated component testing"]], result: "20%", label: "reduction in application load time", detail: "Optimized frontend performance, built reusable components, and debugged critical integrations.", metrics: [["30%", "higher development efficiency"], ["25%", "fewer system crashes"]] },
  { name: "Claimocity", domain: "Healthcare technology", layers: [["CLIENTS", "Ionic React", "Web · iOS · Android"], ["SERVICES", "Node.js / REST", "Healthcare billing APIs"], ["DATA", "MongoDB", "Query optimization"]], result: "20%", label: "reduction in API response time", detail: "Built cross-platform experiences and optimized database queries within a 10-member engineering team.", metrics: [["3", "platforms: web, iOS, Android"], ["10", "team members"]] },
  { name: "Emplify", domain: "HR technology", layers: [["INTERFACE", "React + Redux Toolkit", "HRMS user experience"], ["API", "GraphQL / AWS AppSync", "Application APIs"], ["INTEGRATIONS", "Gusto + Slack", "Connected third-party services"]], result: "15%", label: "improvement in engagement", detail: "Led UI development, built GraphQL APIs, and developed a Slack application to support employee engagement.", metrics: [["GraphQL", "application API layer"], ["Slack", "engagement integration"]] },
];
function EngineeringCore() {
  const [layer, setLayer] = useState(0);
  const [signal, setSignal] = useState(0);
  const layers = [
    ["01", "Interface", "React / TypeScript", "Reusable interfaces. Predictable state. Cross-platform experiences."],
    ["02", "Services", "Node.js / .NET / GraphQL", "API integration that connects product experiences to backend systems."],
    ["03", "Data", "MongoDB / SQL", "Database interactions and query optimization built around application needs."],
  ];
  return <div className="engineering-core">
    <div className="core-caption"><span>ENGINEERING AT EVERY LAYER</span><span>FIG. 001</span></div>
    <CinematicScene variant="brain" burstSignal={signal} />
    <div className="core-controls" aria-label="Explore the engineering layers">{layers.map(([number,name],index)=><button key={name} aria-pressed={layer===index} onClick={() => { setLayer(index); setSignal(value => value + 1); }}><span>{number}</span>{name}</button>)}</div>
    <div className="core-readout" aria-live="polite"><span>{layers[layer][2]}</span><p>{layers[layer][3]}</p></div>
  </div>;
}
function SystemExplorer() {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState("system");
  const system = systems[selected];
  return <div className="system-explorer">
    <div className="window-bar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>engineering / selected-work</span><span className="window-symbol" aria-hidden="true">⌘</span></div>
    <div className="system-tabs" aria-label="Select a project">{systems.map((item, index) => <button key={item.name} onClick={() => setSelected(index)} aria-pressed={selected === index}>{item.name}</button>)}</div>
    <div className="view-toolbar"><span>PROJECT INSPECTOR</span><div>{["system", "outcomes"].map(mode => <button key={mode} onClick={() => setView(mode)} aria-pressed={view === mode}>{mode === "system" ? "◇ System" : "↗ Outcomes"}</button>)}</div></div>
    <div className="system-body" key={selected}>
      <div className="system-caption"><span>{system.domain}</span><span>0{selected + 1} / 03</span></div>
      {view === "system" ? <div className="architecture" aria-label={system.name + " technology overview"}>{system.layers.map(([layer,title,detail],index) => <div className="architecture-row" key={layer}><span className="node-number">0{index+1}</span><div><span className="layer-label">{layer}</span><h3>{title}</h3><p>{detail}</p></div><span className="node-mark" aria-hidden="true">{index === 0 ? "⌘" : index === 1 ? "↔" : "◇"}</span></div>)}</div> : <div className="outcomes-panel"><span className="layer-label">DOCUMENTED RESULTS</span>{system.metrics.map(([metric,label]) => <div key={metric}><strong>{metric}</strong><p>{label}</p></div>)}<p className="outcomes-note">Results and technologies from my professional résumé.</p></div>}
      <div className="system-result"><strong>{system.result}<span aria-hidden="true">{selected === 2 ? "↑" : "↓"}</span></strong><p>{system.label}</p></div>
      <p className="system-detail">{system.detail}</p>
    </div>
    <div className="system-foot"><span>Technology overview</span><span>Based on résumé experience</span></div>
  </div>;
}
function CommandPalette() {
  const ref = useRef(null);
  const [query, setQuery] = useState("");
  const actions = [["Postline project", "#projects", "Navigate"], ["Experience", "#experience", "Navigate"], ["Technical expertise", "#expertise", "Navigate"], ["Contact", "#contact", "Navigate"], ["Download PDF résumé", "/Himanshu-Bhardwaj-Resume-2026.pdf", "Download"], ["Download Word résumé", "/Himanshu-Bhardwaj-Resume-2026.docx", "Download"], ["GitHub", github, "External"], ["LinkedIn", linkedin, "External"], ["Medium blog", medium, "External"], ["Send an email", `mailto:${email}`, "Email"]];
  const open = () => { setQuery(""); if (!ref.current.open) ref.current.showModal(); };
  useEffect(() => {
    const keydown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (ref.current.open) ref.current.close(); else open();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  const matches = actions.filter(([label]) => label.toLowerCase().includes(query.toLowerCase()));
  return <>
    <button className="command-trigger" onClick={open} aria-label="Open command palette">Search <kbd>Ctrl / ⌘ K</kbd></button>
    <dialog ref={ref} className="command-dialog" aria-label="Command palette" onClick={event => { if (event.target === ref.current) ref.current.close(); }}>
      <div className="command-content"><div className="command-input"><span aria-hidden="true">›</span><input autoFocus aria-label="Search portfolio commands" placeholder="Where would you like to go?" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); ref.current.querySelector(".command-results a")?.focus(); } if (event.key === "Enter") ref.current.querySelector(".command-results a")?.click(); }} /><button onClick={() => ref.current.close()} aria-label="Close command palette"><kbd>Esc</kbd></button></div>
      <div className="command-results" onKeyDown={event => { if (!["ArrowDown", "ArrowUp"].includes(event.key)) return; event.preventDefault(); const links = Array.from(ref.current.querySelectorAll(".command-results a")); const index = links.indexOf(document.activeElement); links[(index + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus(); }}>
        {matches.length ? matches.map(([label,href,type]) => <a key={label} href={href} download={type === "Download" ? true : undefined} target={type === "External" ? "_blank" : undefined} rel={type === "External" ? "noreferrer" : undefined} onClick={() => ref.current.close()}><span>{label}</span><small>{type} ↗</small></a>) : <p>No matching commands. Try “résumé” or “contact”.</p>}
      </div><div className="command-hint">↑ ↓ Navigate <span>Enter Select · Esc Close</span></div></div>
    </dialog>
  </>;
}
function StackWorkbench() {
  const [selected, setSelected] = useState(0);
  const contexts = [
    ["American Water / Claimocity / Emplify", "Reusable enterprise interfaces, cross-platform applications, and predictable state management.", "UI components → application state → user experience"],
    ["Alectra Builder / Claimocity / Emplify", "REST and GraphQL APIs, enterprise .NET integrations, and connected third-party services.", "Client request → service integration → response"],
    ["Alectra Builder / Claimocity", "MongoDB query optimization and streamlined interactions across MongoDB and SQL.", "Application → query layer → persistence"],
    ["American Water / The Youth Project", "Component testing, critical-issue debugging, and deployment workflows with CI/CD.", "Implement → verify → release → improve"],
  ];
  return <div className="stack-workbench">
    <div className="instrument-label"><span>CAPABILITY MAP</span><span>04 DOMAINS</span></div>
    <div className="stack-selector" aria-label="Select an engineering discipline">{expertise.map(([title],index)=><button key={title} aria-pressed={selected===index} onClick={()=>setSelected(index)}><span>0{index+1}</span>{title}<b aria-hidden="true">↗</b></button>)}</div>
    <div className="stack-inspector" key={selected}>
      <div className="stack-heading"><span className="stack-symbol" aria-hidden="true">{["⌘","↔","▱","✓"][selected]}</span><div><span className="eyebrow">DISCIPLINE / 0{selected+1}</span><h3>{expertise[selected][0]}</h3></div></div>
      <div className="stack-chips">{expertise[selected][1].split(", ").map(skill=><span key={skill}>{skill}</span>)}</div>
      <div className="stack-flow">{contexts[selected][2]}</div>
      <p>{contexts[selected][1]}</p>
      <div className="stack-reference"><span>APPLIED IN</span>{contexts[selected][0]}</div>
    </div>
    <div className="print-stack">{expertise.map(([title,text])=><p key={title}><b>{title}: </b>{text}</p>)}</div>
  </div>;
}
function EngineeringMethod() {
  const stages = [
    ["01", "Interface", "Build for people.", "Reusable React components and responsive experiences across web and mobile.", "React / TypeScript"],
    ["02", "Integration", "Connect the system.", "REST and GraphQL services that connect the interface to data and third-party platforms.", "Node.js / .NET"],
    ["03", "Validation", "Verify the behavior.", "Automated component tests and hands-on debugging of production issues.", "Jest / Enzyme"],
    ["04", "Iteration", "Improve the outcome.", "Performance optimization, query improvements, and reusable foundations.", "Performance / Reuse"],
  ];
  return <section data-motion-chapter="method" className={`method-section ${cinematicStyles.sceneSection}`}><CinematicScene variant="stack" className={cinematicStyles.sectionBackdrop} /><div className="wrap">
    <div className="method-heading"><div><span className="eyebrow">ENGINEERING METHOD / 003</span><h2>Think in systems.<br /><em>Deliver in details.</em></h2></div><p>Four connected parts of how I build and improve products.</p></div>
    <div className="method-pipeline">{stages.map(([number,label,title,copy,tech])=><article key={number}>
      <div className="method-terminal"><span>{number}</span><b>{label}</b><i aria-hidden="true">→</i></div>
      <div className={`method-glyph glyph-${number}`} aria-hidden="true"><i /><i /><i /></div>
      <h3>{title}</h3><p>{copy}</p><span className="method-tech">{tech}</span>
    </article>)}</div>
    <div className="method-return"><span aria-hidden="true">↳</span> OBSERVE THE RESULT. REFINE THE SYSTEM.</div>
  </div></section>;
}
function ConnectionPanel() {
  const [status, setStatus] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setStatus("Email address copied."); }
    catch { setStatus("Copy unavailable. Use the email link or select the address below."); }
  };
  return <div className="connection-panel">
    <div className="instrument-label"><span>CONNECTION DIRECTORY</span><span>HB /</span></div>
    <div className="connection-email"><span className="eyebrow">DIRECT CHANNEL</span><a href={`mailto:${email}`}>{email}</a><button onClick={copy}>Copy address <span aria-hidden="true">⧉</span></button><p role="status">{status}</p></div>
    <div className="connection-routes"><a href={linkedin} target="_blank" rel="noreferrer"><span>01</span><div>LinkedIn<small>Professional profile</small></div><b>↗</b></a><a href={github} target="_blank" rel="noreferrer"><span>02</span><div>GitHub<small>Code & repositories</small></div><b>↗</b></a><a href={medium} target="_blank" rel="noreferrer"><span>03</span><div>Medium<small>Build stories & writing</small></div><b>↗</b></a></div>
    <div className="resume-package"><div><span className="eyebrow">RÉSUMÉ PACKAGE</span><p>Experience, skills, and results.</p></div><div><a href="/Himanshu-Bhardwaj-Resume-2026.pdf" download>PDF ↓</a><a href="/Himanshu-Bhardwaj-Resume-2026.docx" download>DOCX ↓</a></div></div>
  </div>;
}
function ThemeToggle() {
  const flip = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
  };
  return <button className="theme-toggle" onClick={flip} aria-label="Switch between light and dark theme" title="Switch theme">
    <svg className="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
    <svg className="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
  </button>;
}
export default function Home() {
  const [menu, setMenu] = useState(false);
  const mainRef = useRef(null);
  useFx3D();
  useScrollChapters(mainRef);
  return <>
    <a className="skip" href="#overview">Skip to content</a>
    <header className="header">
      <a className="brand" href="#overview" aria-label="Himanshu Bhardwaj home"><span className="brand-icon">h/</span> himanshu<span className="brand-extension">.dev</span></a>
      <nav id="navigation" className={menu ? "open" : ""} aria-label="Main navigation">{["Overview","Projects","Experience","Expertise","Contact"].map(name => <a key={name} href={`#${name.toLowerCase()}`} onClick={() => setMenu(false)}>{name}</a>)}</nav>
      <CommandPalette />
      <ThemeToggle />
      <a className="header-download" href="/Himanshu-Bhardwaj-Resume-2026.pdf" download>Download résumé <span aria-hidden="true">↓</span></a>
      <button className="menu-toggle" aria-expanded={menu} aria-controls="navigation" onClick={() => setMenu(!menu)}>{menu ? "Close" : "Menu"}</button>
    </header>
    <main ref={mainRef}>
      <section id="overview" data-motion-chapter="overview" className={`hero wrap ${cinematicStyles.hero}`}>
        <div className="workspace-path"><span><span aria-hidden="true">⌘</span> workspace</span><span>/</span><span>himanshu-bhardwaj</span><span>/</span><b>overview.tsx</b></div>
        <div className="hero-intro"><span className="eyebrow"><i /> SENIOR PRODUCT ENGINEER / FULL STACK</span><span className="location">NOIDA, INDIA · UTC +05:30</span></div>
        <div className="hero-grid">
          <div className="hero-copy"><div className="hero-id"><p className="hello">HIMANSHU BHARDWAJ</p><span className="hero-status"><i /> Open to freelance projects</span></div><h1>Engineering<br /><span>what’s next.</span></h1><p className="hero-thesis">From the first interaction<br />to the system behind it.</p><p className="intro">I connect thoughtful interfaces with dependable systems. 5+ years building full-stack products across utilities, healthcare, and HR technology.</p><div className="actions"><a className="button" href="#experience">Explore experience <span aria-hidden="true">↗</span></a><a className="text-link" href="#projects">See Postline <span aria-hidden="true">↗</span></a></div><div className="current-position"><span className="position-line" /><p>Senior Product Engineer <span>@ Smart Energy Water</span></p></div></div>
          <EngineeringCore />
        </div>
        <div className="impact-strip">{[["5+","Years of engineering experience"],["20%","Lower application load time¹"],["30%","Higher development efficiency¹"],["25%","Fewer system crashes¹"]].map(([metric,label],index) => <div key={metric}><span className="metric-index">0{index + 1} / {["EXPERIENCE","PERFORMANCE","VELOCITY","RELIABILITY"][index]}</span><strong>{metric}</strong><span>{label}</span></div>)}</div><p className="metric-note">¹ Results from my work on American Water at Smart Energy Water.</p>
      </section>
      <Projects />
      <section data-motion-chapter="lab" className="project-lab wrap" aria-labelledby="lab-title">
        <div className="lab-introduction"><span className="eyebrow">INSIDE THE WORK / 001</span><h2 id="lab-title">Systems thinking.<br /><em>Production proof.</em></h2><p>Explore the technologies and outcomes behind three products I helped build.</p><div className="lab-index"><span>01—03</span><p>UTILITIES<br />HEALTHCARE<br />HR TECHNOLOGY</p></div><a href="#experience" className="text-link">Read the engineering history ↗</a></div>
        <SystemExplorer />
      </section>
      <section id="experience" data-motion-chapter="experience" className="section wrap two-column">
        <div className="section-aside"><span className="eyebrow">ENGINEERING HISTORY / 002</span><h2>Production work.<br /><em>Proven impact.</em></h2><p>The products, teams, and technical challenges behind the numbers.</p><div className="career-map" aria-hidden="true"><span>2020</span><div><i /><i /><i /><i /><i /><i /></div><span>PRESENT</span></div><div className="career-summary"><strong>06</strong><span>ROLES<br />ONE CONTINUOUS JOURNEY</span></div><a className="text-link" href="/Himanshu-Bhardwaj-Resume-2026.pdf" download>Download full résumé ↓</a></div>
        <div className="career-log"><div className="instrument-label"><span>EXPERIENCE LOG</span><span>NEWEST FIRST</span></div>{roles.map(([date,title,company,product,text,tags], index) => <article className="role" key={date}><div className="role-meta"><span className="role-id">0{roles.length-index}</span><span>{date}</span>{index === 0 && <span className="current">Current role</span>}</div><h3>{title}</h3><p className="company">{company}</p>{product && <span className="product"><span aria-hidden="true">▱ </span> {product}</span>}<p className="role-description">{text}</p><div className="tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div></article>)}</div>
      </section>
      <EngineeringMethod />
      <section id="expertise" data-motion-chapter="expertise" className="section wrap two-column"><div className="section-aside"><span className="eyebrow">TECHNICAL EXPERTISE / 004</span><h2>Depth across<br />the <em>stack.</em></h2><p>Select a discipline to explore its tools and where I’ve applied them.</p><div className="discipline-map" aria-hidden="true"><span>UI</span><i /><span>API</span><i /><span>DB</span></div></div><div><StackWorkbench /><div className="education"><div className="education-mark" aria-hidden="true">B.TECH<br /><span>CS / 2021</span></div><div><span className="eyebrow">FOUNDATION / EDUCATION</span><h3>B.Tech in Computer Science</h3><p>Poornima University</p><span className="education-date">August 2017 — June 2021</span></div></div></div></section>
      <section id="contact" data-motion-chapter="contact" className={`contact wrap ${cinematicStyles.sceneSection}`}><CinematicScene variant="orbit" className={cinematicStyles.sectionBackdrop} /><figure className="contact-portrait"><img src="/himanshu-portrait.jpg" alt="Portrait of Himanshu Bhardwaj" width="640" height="800" loading="lazy" /><figcaption><b>Himanshu Bhardwaj</b><span>Senior Product Engineer · Noida</span></figcaption></figure><div><span className="eyebrow">NEXT CONNECTION / 005</span><h2>Complex problem?<br /><em>Let’s build<br />the solution.</em></h2><p>Tell me about your team, your product, and the engineering challenge ahead.</p><a className="button contact-cta" href={`mailto:${email}`}>Start a conversation ↗</a><div className="contact-location"><span aria-hidden="true">◎</span> NOIDA, INDIA / UTC +05:30</div></div><ConnectionPanel /></section>
    </main>
    <footer className="wrap"><span>Himanshu Bhardwaj · {new Date().getFullYear()}</span><button onClick={() => window.print()}>Print this page ↗</button><a href="#overview">Back to top ↑</a></footer>
  </>;
}
