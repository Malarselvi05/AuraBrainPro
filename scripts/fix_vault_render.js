const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf-8');

// ── FIX 1: Upgrade the vault card renderer ───────────────────────────────────
const oldRender = `(task.subtasks || []).map((st: any) => {
                                    const secs = st.title.split('\\n').map((s) => s.trim()).filter(Boolean);
                                    const header = secs[0] || st.title;
                                    const topics = secs.find((s) => s.startsWith('📚'));
                                    const project = secs.find((s) => s.startsWith('🏗️'));
                                    const outcome = secs.find((s) => s.startsWith('✅'));
                                    const isStructured = !!(topics || project || outcome);
                                    return (
                                      <div key={st.id} style={{ background: st.status === 'completed' ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', border: \`1px solid \${st.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}\`, borderRadius: '20px', padding: '1.2rem 1.6rem' }}>
                                        <div className='flex-between' style={{ marginBottom: isStructured ? '0.7rem' : 0 }}>
                                          <div className='flex-row gap-3'>{getDayIcon(st.title)}<span className='outfit' style={{ fontSize: '0.95rem', fontWeight: 800 }}>{header}</span></div>
                                          {st.status === 'completed' && <Trophy size={14} color='#10b981' />}
                                        </div>
                                        {topics  && <p style={{ fontSize: '0.76rem', color: '#a78bfa', margin: '0.25rem 0', lineHeight: 1.6 }}>{topics}</p>}
                                        {project && <p style={{ fontSize: '0.76rem', color: 'var(--accent)', margin: '0.25rem 0', lineHeight: 1.6 }}>{project}</p>}
                                        {outcome && <p style={{ fontSize: '0.73rem', color: '#10b981', margin: '0.35rem 0 0', lineHeight: 1.5, opacity: 0.9 }}>{outcome}</p>}
                                      </div>
                                    );
                                  })}`;

const newRender = `(task.subtasks || []).map((st: any) => {
                                    const secs = st.title.split('\\n').map((s) => s.trim()).filter(Boolean);
                                    const header = secs[0] || st.title;

                                    // Parse each section safely
                                    const topicsRaw  = secs.find((s) => s.startsWith('📚')) || '';
                                    const projectRaw = secs.find((s) => s.startsWith('🏗️')) || '';
                                    const outcomeRaw = secs.find((s) => s.startsWith('✅')) || '';

                                    // Strip inline noise from the 📚 line: "· Structure: ·" "· Project Milestone: ·"
                                    const topicsClean = topicsRaw
                                      .replace(/^📚\\s*/, '')
                                      .split(/\\s*[·•]\\s*Project Milestone[:\\s]*.*/i)[0]
                                      .split(/\\s*[·•]\\s*Structure[:\\s]*/i)[0]
                                      .trim();

                                    // Extract project: prefer dedicated 🏗️ line; fallback = inline "Project Milestone:" in 📚 line
                                    let projectClean = projectRaw.replace(/^🏗️\\s*/, '').trim();
                                    if (!projectClean) {
                                      const m = topicsRaw.match(/Project Milestone[:\\s]+([^·✅\\n]+)/i);
                                      if (m) projectClean = m[1].replace(/^[·•]\\s*/, '').trim();
                                    }
                                    const outcomeClean = outcomeRaw.replace(/^✅\\s*/, '').trim();
                                    const isStructured = !!(topicsClean || projectClean || outcomeClean);

                                    return (
                                      <div key={st.id} style={{ background: st.status === 'completed' ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', border: \`1px solid \${st.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}\`, borderRadius: '20px', padding: '1.2rem 1.6rem' }}>
                                        <div className="flex-between" style={{ marginBottom: isStructured ? '0.7rem' : 0 }}>
                                          <div className="flex-row gap-3">{getDayIcon(st.title)}<span className="outfit" style={{ fontSize: '0.95rem', fontWeight: 800 }}>{header}</span></div>
                                          {st.status === 'completed' && <Trophy size={14} color="#10b981" />}
                                        </div>
                                        {topicsClean  && <p style={{ fontSize: '0.76rem', color: '#a78bfa', margin: '0.25rem 0', lineHeight: 1.6 }}>📚 {topicsClean}</p>}
                                        {projectClean && <p style={{ fontSize: '0.76rem', color: 'var(--accent)', margin: '0.25rem 0', lineHeight: 1.6 }}>🏗️ {projectClean}</p>}
                                        {outcomeClean && <p style={{ fontSize: '0.73rem', color: '#10b981', margin: '0.35rem 0 0', lineHeight: 1.5, opacity: 0.9 }}>✅ {outcomeClean}</p>}
                                      </div>
                                    );
                                  })}`;

if (c.includes(oldRender)) {
  c = c.replace(oldRender, newRender);
  console.log('Render block replaced');
} else {
  // Try to find it differently - look for the map start
  const marker = '(task.subtasks || []).map((st: any) => {';
  const si = c.indexOf(marker);
  if (si !== -1) {
    const ei = c.indexOf('})}', si) + 3;
    c = c.slice(0, si) + newRender + c.slice(ei);
    console.log('Render block replaced via marker');
  } else {
    console.log('RENDER BLOCK NOT FOUND');
    process.exit(1);
  }
}

// ── FIX 2: Upgrade inject parser to handle "Project Milestone:" label ──────
// Update the sectionLabels regex and add detection for 'project milestone'
c = c.replace(
  /const sectionLabels = \/\^.*?\/i;/,
  `const sectionLabels = /^(topics|project progression|project milestone|time split|mini-project hint|structure|note)[:\\s]*/i;`
);

// Add 'project milestone' to section detection
c = c.replace(
  `if (/^project progression[:\\s]/i.test(line)){ currentSection = 'project'; continue; }`,
  `if (/^project progression[:\\s]/i.test(line) || /^project milestone[:\\s]/i.test(line)){ currentSection = 'project'; continue; }`
);

// Strip 'Structure:' lines from output
c = c.replace(
  `if (/^time split[:\\s]/i.test(line))         { currentSection = 'time'; continue; }`,
  `if (/^time split[:\\s]/i.test(line))         { currentSection = 'time'; continue; }
        if (/^structure[:\\s]*/i.test(line))         { currentSection = 'time'; continue; } // treat as skip`
);

fs.writeFileSync('src/app/page.tsx', c, 'utf-8');
console.log('DONE - all fixes applied');
