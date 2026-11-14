import posts from "../public/carousels/log.json";

export function Blogs() {
  return <section id="blogs" data-motion-chapter="blogs" className="section wrap two-column" aria-labelledby="blogs-title">
    <div className="section-aside">
      <span className="eyebrow">WRITING</span>
      <h2 id="blogs-title">Blogs</h2>
      <p>Notes on technology, AI, and engineering.</p>
      <a className="text-link" href="https://medium.com/@bhardwajhimanshu2515" target="_blank" rel="noreferrer">More on Medium ↗</a>
    </div>
    <div className="career-log">
      {[...posts].sort((a, b) => b.date.localeCompare(a.date)).map(post => <article className="role" key={post.slug}>
        <div className="role-meta"><time dateTime={post.date}>{new Date(post.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time><span>PDF CAROUSEL</span></div>
        <h3><a href={`/carousels/${encodeURIComponent(post.file)}`} target="_blank" rel="noreferrer">{post.title}</a></h3>
        <a className="text-link" href={`/carousels/${encodeURIComponent(post.file)}`} target="_blank" rel="noreferrer">Read the carousel ↗</a>
      </article>)}
    </div>
  </section>;
}
