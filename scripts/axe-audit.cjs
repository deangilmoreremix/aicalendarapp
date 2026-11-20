/*
 * Accessibility sweep (axe-core in Playwright) over the main views and modals, desktop and phone width, against an
 * in-memory mock of the Supabase REST API. Prints violation types per view (critical/serious first) and horizontal overflow.
 *
 *   VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=anon npx vite --port 5199 --host 127.0.0.1 &
 *   NODE_PATH=$(npm root -g) node scripts/axe-audit.cjs
 */
const { chromium } = require('playwright');
const SHOT = process.env.AXE_SHOTS || require('path').join(require('os').tmpdir(), 'calendar-axe-shots');
require('fs').mkdirSync(SHOT, { recursive: true });
const now = new Date();
const day = (n, h = 12) => new Date(now.getFullYear(), now.getMonth(), 15 + n, h);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
let seq = 100;
const db = {
  tasks: [
    { id: 't1', title: 'Send proposal', description: 'Draft', due_date: day(0).toISOString(), priority: 'high', status: 'pending', category: 'other', type: 'other', completed: false, created_at: now.toISOString(), tags: ['sales'], attachments: [], subtasks: [], assigned_user_id: 'u1', assigned_user_name: 'Sam Lee' },
    { id: 't2', title: 'Ship release', description: '', due_date: day(2).toISOString(), priority: 'urgent', status: 'in-progress', category: 'meeting', type: 'meeting', completed: false, created_at: now.toISOString(), tags: [], attachments: [], subtasks: [], related_to: { type: 'contact', id: 'c1', name: 'Ada Lovelace' } },
    { id: 't3', title: 'Old chore', description: '', due_date: day(-3).toISOString(), priority: 'low', status: 'completed', category: 'other', type: 'other', completed: true, created_at: now.toISOString(), tags: [], attachments: [], subtasks: [] }
  ],
  deals: [{ id: 'd1', company: 'TechCorp', value: '$85,000', probability: '85', due_date: ymd(day(1)), contact_id: 'c1', status: 'online', stage: 'negotiation', priority: 'high', created_at: now.toISOString(), updated_at: now.toISOString() }],
  contacts: [{ id: 'c1', first_name: 'Ada', last_name: 'Lovelace', name: 'Ada Lovelace', email: 'ada@x.io', phone: '555', title: 'CTO', company: 'Analytical', sources: ['Website'], interest_level: 'hot', status: 'lead', tags: ['vip'], is_favorite: false, created_at: now.toISOString(), updated_at: now.toISOString(), next_follow_up: ymd(day(2)), social_profiles: {}, custom_fields: {} }],
  calendar_events: [{ id: 'e1', title: 'Kickoff', start_date: day(3, 10).toISOString(), end_date: day(3, 11).toISOString(), is_all_day: false, visibility: 'SHARE_EVERYTHING', location: 'Room 4' }],
  activities: [{ id: 'a1', type: 'email_sent', title: 'Email: Hello', description: 'x', user_id: 'u', user_name: 'Sam', entity_type: 'contact', entity_id: 'c1', created_at: now.toISOString() }],
  calendar_views: [], calendar_settings: [], calendar_event_participants: [], calendar_event_targets: []
};
const reqLog = []; const fnCalls = {};
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let step = 'boot'; const issues = [];
  const note = (kind, msg) => issues.push(`[${step}] ${kind}: ${String(msg).slice(0, 220)}`);
  page.on('pageerror', (e) => note('PAGEERROR', e));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) note('console.error', m.text()); if (m.type() === 'warning' && /Warning:/.test(m.text())) note('react-warning', m.text().split('\n')[0]); });
  await page.route('http://127.0.0.1:54321/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const parts = url.pathname.split('/'); const table = parts.pop().replace(/^crm_tasks$/, 'tasks'); const method = req.method();
    const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    reqLog.push({ step, method, table });
    if (url.pathname.includes('/functions/v1/')) {
      fnCalls[`${step}:${table}`] = (fnCalls[`${step}:${table}`] || 0) + 1;
      const body = { predict_deal_success: '72', generate_ai_insights: '[]', generate_task_suggestions: JSON.stringify([{ id: 's1', title: 'AI task', description: 'd', priority: 'high', subtasks: [], tags: [], category: 'call', type: 'call', reasoning: 'r', confidence: 80 }]), contacts_score: JSON.stringify({ score: 77, reasoning: 'ok', nextBestAction: 'Call', fitScore: 70, engagementScore: 60, conversionProbability: 65, urgencyScore: 50 }), contacts_enrich: JSON.stringify({ title: 'CTO', company: 'Analytical', bio: 'bio', summary: 'sum', confidence: 80, sources: [] }), email_compose: JSON.stringify({ text: 'Subject: Hi\n\nHello Ada' }), generate_meeting_agenda: '["Intro","Demo"]', optimize_meeting_time: JSON.stringify([day(5).toISOString()]) }[table] ?? '{}';
      return route.fulfill({ status: 200, headers, body });
    }
    if (url.pathname.includes('/rpc/')) return route.fulfill({ status: 200, headers, body: JSON.stringify({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] }) });
    const rows = db[table]; const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    if (!rows) return route.fulfill({ status: 404, headers, body: '{"message":"no table"}' });
    const idq = (url.searchParams.get('id') || '').replace('eq.', '');
    if (method === 'GET') return route.fulfill({ status: 200, headers, body: JSON.stringify(idq ? rows.filter((r) => r.id === idq) : rows) });
    if (method === 'POST') { const b = JSON.parse(req.postData() || '[]'); const list = Array.isArray(b) ? b : [b]; const made = list.map((x) => ({ id: `n${++seq}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...x })); rows.push(...made); return route.fulfill({ status: 201, headers, body: JSON.stringify(single ? made[0] : made) }); }
    if (method === 'PATCH') { const row = rows.find((r) => r.id === idq); if (row) Object.assign(row, JSON.parse(req.postData() || '{}')); return route.fulfill({ status: 200, headers, body: JSON.stringify(single ? row : [row]) }); }
    if (method === 'DELETE') { const i = rows.findIndex((r) => r.id === idq); if (i >= 0) rows.splice(i, 1); return route.fulfill({ status: 204, headers }); }
    return route.fulfill({ status: 204, headers });
  });
  const shot = (n) => page.screenshot({ path: `${SHOT}/${n}.png` }).catch(() => {});
  const settle = (ms = 700) => page.waitForTimeout(ms);
  const results = [];
  const check = async (name, fn) => { step = name; const before = issues.length; try { await fn(); results.push([name, issues.length === before ? 'PASS' : 'ISSUES']); } catch (e) { results.push([name, 'FAIL']); note('FAIL', e.message.split('\n')[0]); await shot('fail-' + name.replace(/\W+/g, '_')); } };
  const closeModals = async () => {
    for (let i = 0; i < 3; i++) await page.keyboard.press('Escape'); await settle(250);
    const stillOpen = await page.locator('.fixed.inset-0').count();
    if (stillOpen) { note('modal-ignores-escape', 'a modal stayed open after Escape'); await page.goto('http://127.0.0.1:5199/'); await settle(1500); }
  };


  const axeSrc = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  const scan = async (label) => {
    await page.evaluate(axeSrc);
    const res = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length, help: v.help, sample: v.nodes[0] && v.nodes[0].html.slice(0, 110), all: v.nodes.map(n => n.html.slice(0, 140)) })));
    console.log(`\n## ${label}: ${res.length} violation types`);
    res.filter(v => ['critical', 'serious'].includes(v.impact)).forEach(v => { console.log(`  [${v.impact}] ${v.id} x${v.count}: ${v.help}\n     ${v.sample}`); if (process.env.AXE_ALL) v.all.forEach(h => console.log('       - ' + h)); });
    res.filter(v => !['critical', 'serious'].includes(v.impact)).forEach(v => console.log(`  (${v.impact}) ${v.id} x${v.count}`));
  };
  const overflow = async (label) => { const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); console.log(`  overflow @${label}: scrollWidth ${o.sw} vs ${o.cw}${o.sw > o.cw + 2 ? '  <-- HORIZONTAL SCROLL' : ''}`); };
  for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    await page.setViewportSize(vp);
    await page.goto('http://127.0.0.1:5199/'); await page.waitForTimeout(2500);
    await scan(`${name} calendar view`); await overflow(name);
    await page.screenshot({ path: `${SHOT}/axe-${name}-calendar.png`, fullPage: false });
    await page.getByTitle('Kanban Board').click(); await page.waitForTimeout(1500); await scan(`${name} kanban`); await overflow(name);
    await page.getByTitle('List View').click(); await page.waitForTimeout(1000); await scan(`${name} list`);
    await page.getByTitle('Calendar View').click(); await page.waitForTimeout(800);
    await page.getByText('New Contact').first().click(); await page.waitForTimeout(700); await scan(`${name} new-contact modal`); await overflow(name); await page.keyboard.press('Escape');
    await page.getByText('Send Email').first().click(); await page.waitForTimeout(700); await scan(`${name} email modal`); await page.keyboard.press('Escape');
  }
  await browser.close();
})().catch((e) => { console.error('AXE CRASH', e); process.exit(1); });
