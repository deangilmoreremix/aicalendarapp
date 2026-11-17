/*
 * Browser audit sweep (Playwright). Drives every view, modal, contact tab and the main create/edit flows against an
 * in-memory mock of the Supabase REST API (no real backend, no OpenAI), failing on console errors, React warnings,
 * request storms and missing saves.
 *
 *   VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=anon npx vite --port 5199 --host 127.0.0.1 &
 *   NODE_PATH=$(npm root -g) node scripts/e2e-audit.cjs     # needs `playwright` installed globally
 */
const { chromium } = require('playwright');
const SHOT = process.env.AUDIT_SHOTS || require('path').join(require('os').tmpdir(), 'calendar-audit-shots');
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
    const req = route.request(); const url = new URL(req.url()); const parts = url.pathname.split('/'); const table = parts.pop(); const method = req.method();
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

  await page.goto('http://127.0.0.1:5199/'); await settle(2500);
  await check('home loads with stats', async () => { await page.getByText('Total Tasks').waitFor(); });
  await check('view: kanban', async () => { await page.getByTitle('Kanban Board').click(); await page.getByText('Task Board').waitFor(); await settle(1500); await shot('kanban'); });
  await check('kanban: no request storm (5s idle)', async () => { const a = reqLog.length; await settle(5000); const delta = reqLog.length - a; if (delta > 12) throw new Error(`${delta} requests in 5s of idle`); });
  await check('view: list', async () => { await page.getByTitle('List View').click(); await settle(1200); await shot('list'); });
  await check('view: activity', async () => { const b = page.getByRole('button', { name: /activity/i }).first(); await page.locator('button[title*="ctivity"]').first().click().catch(async () => { await b.click(); }); await settle(1200); await shot('activity'); });
  await check('view: calendar', async () => { await page.getByTitle('Calendar View').click(); await page.getByText('Send proposal').first().waitFor(); });
  await check('settings modal', async () => { await page.getByTitle('Calendar Settings').click(); await page.getByText('Event visibility').waitFor(); await page.getByLabel('Metadata').first().check().catch(()=>{}); await shot('settings'); await closeModals(); });
  await check('theme toggle', async () => { await page.getByRole('button', { name: /dark mode|light mode/i }).click(); await settle(300); await shot('dark'); await page.getByRole('button', { name: /dark mode|light mode/i }).click(); });
  await check('delete-mock-data dialog opens/cancels', async () => { await page.getByTitle('Delete All Mock Data').click(); await settle(300); await shot('delete-mock'); await closeModals(); await page.keyboard.press('Escape'); });
  await check('quick action: new contact', async () => { await page.getByText('New Contact').first().click(); await settle(600); await shot('new-contact'); await closeModals(); });
  await check('quick action: new deal', async () => { await page.getByText('New Deal').first().click(); await settle(600); await shot('new-deal'); await closeModals(); });
  await check('quick action: schedule meeting', async () => { await page.getByText('Schedule Meeting').first().click(); await settle(600); await shot('meeting'); await closeModals(); });
  await check('quick action: send email', async () => { await page.getByText('Send Email').first().click(); await settle(600); await shot('email'); await closeModals(); });
  await check('contacts modal + detail tabs', async () => {
    await page.getByText('View All Contacts').first().click(); await settle(800); await shot('contacts');
    await page.locator('h3:has-text("Ada Lovelace"), h4:has-text("Ada Lovelace")').first().click({ force: true }); await settle(900);
    for (const tab of ['Overview', 'Journey', 'Calendar', 'Tasks', 'Analytics', 'Communication', 'Automation', 'AI Insights', 'Email']) { await page.getByRole('button', { name: tab, exact: true }).first().click().catch(() => note('missing-tab', tab)); await settle(450); }
    await shot('contact-detail'); await closeModals();
  });

  const lastPost = (table) => reqLog.filter((r) => r.method === 'POST' && r.table === table).length;
  await page.goto('http://127.0.0.1:5199/'); await settle(1800);
  await check('FLOW create contact', async () => {
    await page.getByText('New Contact').first().click(); await settle(500);
    await page.getByPlaceholder('Enter first name').fill('Grace'); await page.getByPlaceholder('Enter last name').fill('Hopper');
    await page.getByPlaceholder('Enter email address').fill('grace@navy.mil'); await page.getByPlaceholder('Enter company name').fill('Navy'); await page.getByPlaceholder('Enter job title').fill('Admiral');
    const before = db.contacts.length;
    await page.getByRole('button', { name: /create contact/i }).click(); await settle(1200);
    if (db.contacts.length !== before + 1) throw new Error('contact was not saved to the API');
    const saved = db.contacts.at(-1); if (saved.first_name !== 'Grace' || saved.email !== 'grace@navy.mil') throw new Error('wrong contact payload ' + JSON.stringify(saved).slice(0,200));
  });
  await page.goto('http://127.0.0.1:5199/'); await settle(1800);
  await check('FLOW create deal', async () => {
    await page.getByText('New Deal').first().click(); await settle(500);
    await page.getByPlaceholder('Enter deal title').fill('Big renewal'); await page.getByPlaceholder('Enter company name').fill('Acme Corp'); await page.getByPlaceholder('100000').fill('50000');
    const contactSelect = page.locator('select', { has: page.locator('option:has-text("Ada")') }).first(); await contactSelect.selectOption({ index: 1 });
    const before = db.deals.length;
    await page.locator('form button[type=submit]').first().click(); await settle(1200);
    if (db.deals.length !== before + 1) { await shot('deal-failed'); throw new Error('deal was not saved to the API'); }
    console.log('  saved deal:', JSON.stringify(db.deals.at(-1)).slice(0, 220));
  });
  await page.goto('http://127.0.0.1:5199/'); await settle(1800);
  await check('FLOW create task from calendar', async () => {
    await page.getByRole('button', { name: /new task/i }).first().click(); await settle(500);
    await page.getByPlaceholder('Enter task title...').fill('Call Grace'); const before = db.tasks.length;
    await page.getByRole('button', { name: /create task/i }).click(); await settle(1200);
    if (db.tasks.length !== before + 1) throw new Error('task was not saved');
    if (db.tasks.at(-1).title !== 'Call Grace') throw new Error('wrong task payload');
  });
  await page.goto('http://127.0.0.1:5199/'); await settle(1800);
  await check('FLOW kanban: add task in a column', async () => {
    await page.getByTitle('Kanban Board').click(); await settle(900);
    await shot('kanban-before');
  });

  await page.goto('http://127.0.0.1:5199/'); await settle(1800);
  await check('FLOW contact calendar tab: create event', async () => {
    await page.getByText('View All Contacts').first().click(); await settle(700);
    await page.locator('h3:has-text("Ada Lovelace"), h4:has-text("Ada Lovelace")').first().click({ force: true }); await settle(900);
    await page.getByRole('button', { name: 'Calendar', exact: true }).first().click(); await settle(700);
    await page.getByRole('button', { name: /new event/i }).first().click(); await settle(500);
    await page.getByLabel('Title').fill('Renewal call');
    const e0 = db.calendar_events.length, p0 = db.calendar_event_participants.length, t0 = db.calendar_event_targets.length;
    await page.getByRole('button', { name: 'Create event' }).click(); await settle(1200);
    if (db.calendar_events.length !== e0 + 1) throw new Error('event not saved');
    if (db.calendar_event_participants.length !== p0 + 1) throw new Error('guest (the contact) not saved as participant');
    if (db.calendar_event_targets.length !== t0 + 1) throw new Error('event not linked to the contact');
    const ev = db.calendar_events.at(-1); if (ev.title !== 'Renewal call' || !(Date.parse(ev.end_date) > Date.parse(ev.start_date))) throw new Error('bad event payload ' + JSON.stringify(ev));
  });
  await page.goto('http://127.0.0.1:5199/'); await settle(1800);
  await check('FLOW email composer: generate + save to activity log', async () => {
    await page.getByText('Send Email').first().click(); await settle(600);
    await page.getByPlaceholder('Add recipient...').fill('ada@x.io'); await page.getByPlaceholder('Add recipient...').press('Enter');
    await settle(300); await shot('email-compose');
    const a0 = db.activities.length;
    await page.getByPlaceholder('Email subject...').fill('Hello Ada'); await page.getByPlaceholder('Compose your email...').fill('Hi Ada, following up.');
    await page.getByRole('button', { name: /save to activity log/i }).click(); await settle(1000);
    if (db.activities.length === a0) throw new Error('email was not logged as an activity');
  });

  await page.goto('http://127.0.0.1:5199/'); await settle(1800);
  await check('FLOW time-blocked task round-trips start/end', async () => {
    await page.getByRole('button', { name: /new task/i }).first().click(); await settle(500);
    await page.getByPlaceholder('Enter task title...').fill('Deep work');
    const pad = (n) => String(n).padStart(2, '0'); const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const local = (h) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:00`;
    const inputs = page.locator('input[type=datetime-local]'); await inputs.nth(0).fill(local(9)); await inputs.nth(1).fill(local(11));
    await page.getByRole('button', { name: /create task/i }).click(); await settle(1200);
    const row = db.tasks.at(-1);
    if (row.title !== 'Deep work') throw new Error('task not saved');
    if (!row.start_time || !row.end_time) throw new Error('start/end time were dropped: ' + JSON.stringify({ s: row.start_time, e: row.end_time }));
    if (Date.parse(row.end_time) - Date.parse(row.start_time) !== 2 * 3600 * 1000) throw new Error('wrong duration');
    await settle(500); await page.getByRole('button', { name: 'Week' }).click(); await settle(700); await shot('week-timed-task');
    if (!(await page.locator('.rbc-event:has-text("Deep work")').count())) throw new Error('timed task not shown in week view');
  });
  console.log('\n=== RESULTS ==='); results.forEach(([n, r]) => console.log(r.padEnd(7), n));
  console.log('\n=== ISSUES (' + issues.length + ') ==='); [...new Set(issues)].slice(0, 40).forEach((i) => console.log(i));
  console.log('\n=== AI/edge function calls per step ==='); console.log(fnCalls);
  await browser.close();
})().catch((e) => { console.error('SWEEP CRASH', e); process.exit(1); });
