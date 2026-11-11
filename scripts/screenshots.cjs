/*
 * Captures screenshots of the features added to the calendar app, against an in-memory mock of the Supabase REST API.
 * AI results come from the mock (no live OpenAI key); the UI shown is the real app.
 *
 *   VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=anon npx vite --port 5199 --host 127.0.0.1 &
 *   NODE_PATH=$(npm root -g) node scripts/screenshots.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.SHOTS_DIR || path.join(__dirname, '..', 'docs', 'screenshots');
require('fs').mkdirSync(OUT, { recursive: true });

const now = new Date();
// Monday-based week containing "today"; the sample data sits inside this month so it is visible in month view
const at = (dayOfMonth, h = 12, m = 0) => new Date(now.getFullYear(), now.getMonth(), dayOfMonth, h, m);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const D = now.getDate();
const iso = (d) => d.toISOString();
let seq = 100;

const db = {
  tasks: [
    { id: 't1', title: 'Send proposal to TechCorp', description: 'Pricing + timeline', due_date: iso(at(D)), priority: 'high', status: 'pending', category: 'email', type: 'proposal', completed: false, created_at: iso(now), tags: ['sales'], attachments: [], subtasks: [{ id: 's1', title: 'Draft pricing', completed: true }, { id: 's2', title: 'Legal review', completed: false }], assigned_user_id: 'u1', assigned_user_name: 'Sam Lee', related_to: { type: 'deal', id: 'd1', name: 'TechCorp renewal' } },
    { id: 't2', title: 'Prepare demo environment', description: '', due_date: iso(at(D + 2)), priority: 'urgent', status: 'in-progress', category: 'meeting', type: 'meeting', completed: false, created_at: iso(now), tags: [], attachments: [], subtasks: [], assigned_user_id: 'u2', assigned_user_name: 'Priya Rao', related_to: { type: 'contact', id: 'c1', name: 'Ada Lovelace' } },
    { id: 't3', title: 'Deep work: roadmap', description: '', due_date: iso(at(D)), start_time: iso(at(D, 9)), end_time: iso(at(D, 11)), priority: 'medium', status: 'in-progress', category: 'other', type: 'research', completed: false, created_at: iso(now), tags: [], attachments: [], subtasks: [], assigned_user_id: 'u1', assigned_user_name: 'Sam Lee' },
    { id: 't4', title: 'Send contract to Ada', description: '', due_date: iso(at(Math.max(1, D - 3))), priority: 'low', status: 'completed', category: 'email', type: 'email', completed: true, created_at: iso(now), tags: [], attachments: [], subtasks: [], related_to: { type: 'contact', id: 'c1', name: 'Ada Lovelace' } },
    { id: 't5', title: 'Follow up with Grace', description: '', due_date: iso(at(D + 4)), priority: 'medium', status: 'pending', category: 'call', type: 'follow-up', completed: false, created_at: iso(now), tags: [], attachments: [], subtasks: [], assigned_user_id: 'u2', assigned_user_name: 'Priya Rao' }
  ],
  deals: [
    { id: 'd1', title: 'TechCorp renewal', company: 'TechCorp Solutions', value: '$85,000', probability: '85', due_date: ymd(at(D + 1)), contact_id: 'c1', status: 'online', stage: 'negotiation', priority: 'high', ai_prediction: 87, created_at: iso(now), updated_at: iso(now) },
    { id: 'd2', title: 'Globex expansion', company: 'Globex', value: '$120,000', probability: '60', due_date: ymd(at(D + 5)), contact_id: 'c2', status: 'offline', stage: 'proposal', priority: 'medium', ai_prediction: 72, created_at: iso(now), updated_at: iso(now) }
  ],
  contacts: [
    { id: 'c1', first_name: 'Ada', last_name: 'Lovelace', name: 'Ada Lovelace', email: 'ada@techcorp.io', phone: '+1 555 0100', title: 'CTO', company: 'TechCorp Solutions', industry: 'Technology', sources: ['Website'], interest_level: 'hot', status: 'prospect', tags: ['vip', 'enterprise'], is_favorite: true, ai_score: 82, created_at: iso(now), updated_at: iso(now), next_follow_up: ymd(at(D + 3)), social_profiles: { linkedin: 'https://linkedin.com/in/ada' }, custom_fields: {} },
    { id: 'c2', first_name: 'Grace', last_name: 'Hopper', name: 'Grace Hopper', email: 'grace@globex.com', phone: '+1 555 0111', title: 'VP Engineering', company: 'Globex', industry: 'Software', sources: ['Referral'], interest_level: 'medium', status: 'lead', tags: [], is_favorite: false, ai_score: 64, created_at: iso(now), updated_at: iso(now), next_follow_up: ymd(at(D + 6)), social_profiles: {}, custom_fields: {} }
  ],
  calendar_events: [
    { id: 'e1', title: 'Renewal call with Ada', description: 'Walk through pricing and the rollout plan.', start_date: iso(at(D + 1, 10)), end_date: iso(at(D + 1, 11)), is_all_day: false, visibility: 'SHARE_EVERYTHING', location: 'Zoom', conference_solution: 'Video call', conference_link: 'https://meet.example.com/abc' },
    { id: 'e2', title: 'Quarterly business review', description: '', start_date: iso(at(D + 7, 14)), end_date: iso(at(D + 7, 15, 30)), is_all_day: false, visibility: 'SHARE_EVERYTHING', location: 'Boardroom' }
  ],
  activities: [
    { id: 'a1', type: 'email_sent', title: 'Email: Pricing follow-up', description: 'Sent the revised pricing.', user_id: 'u1', user_name: 'Sam Lee', entity_type: 'contact', entity_id: 'c1', created_at: iso(at(Math.max(1, D - 2), 9)) },
    { id: 'a2', type: 'meeting_held', title: 'Discovery meeting', description: '45 min intro call', user_id: 'u1', user_name: 'Sam Lee', entity_type: 'contact', entity_id: 'c1', created_at: iso(at(Math.max(1, D - 5), 15)) },
    { id: 'a3', type: 'deal_moved', title: 'Moved to Negotiation', description: '', user_id: 'u1', user_name: 'Sam Lee', entity_type: 'deal', entity_id: 'd1', created_at: iso(at(Math.max(1, D - 1), 11)) }
  ],
  calendar_views: [{ id: 'v1', name: 'Sales pipeline', calendar_layout: 'MONTH', field_by_type: {}, filters: {}, visible_types: ['deal', 'contact', 'event'], position: 0, is_default: false }],
  calendar_settings: [], calendar_event_participants: [], calendar_event_targets: []
};

const linkedEvents = () => ({
  totalNumberOfCalendarEvents: 2,
  timelineCalendarEvents: [
    { id: 'e1', title: 'Renewal call with Ada', description: 'Walk through pricing and the rollout plan.', location: 'Zoom', isFullDay: false, startsAt: iso(at(D + 1, 10)), endsAt: iso(at(D + 1, 11)), visibility: 'SHARE_EVERYTHING', conferenceLink: { primaryLinkLabel: 'Video call', primaryLinkUrl: 'https://meet.example.com/abc' }, participants: [{ handle: 'ada@techcorp.io', displayName: 'Ada Lovelace', firstName: 'Ada', lastName: 'Lovelace', avatarUrl: '', personId: 'c1' }, { handle: 'sam@us.io', displayName: 'Sam Lee', firstName: 'Sam', lastName: 'Lee', avatarUrl: '' }] },
    { id: 'e3', title: 'Product demo', description: '', isFullDay: false, startsAt: iso(at(Math.max(1, D - 6), 16)), endsAt: iso(at(Math.max(1, D - 6), 17)), visibility: 'SHARE_EVERYTHING', participants: [{ handle: 'ada@techcorp.io', displayName: 'Ada Lovelace', firstName: 'Ada', lastName: 'Lovelace', avatarUrl: '' }] },
    { id: 'e4', title: 'Private conversation', isFullDay: false, startsAt: iso(at(Math.max(1, D - 12), 10)), endsAt: iso(at(Math.max(1, D - 12), 10, 30)), visibility: 'METADATA', participants: [{ handle: 'ada@techcorp.io', displayName: 'Ada Lovelace', firstName: 'Ada', lastName: 'Lovelace', avatarUrl: '' }] }
  ]
});

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.route('http://127.0.0.1:54321/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const table = url.pathname.split('/').pop(); const method = req.method();
    const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.includes('/functions/v1/')) {
      const out = {
        predict_deal_success: '78', generate_ai_insights: JSON.stringify([
          { id: '1', type: 'opportunity', title: 'TechCorp is ready to close', description: 'Ada replied within a day and the deal is in negotiation.', confidence: 88, actionable: true, suggestedActions: ['Send the final contract', 'Book a call this week'], createdAt: iso(now), category: 'deals' },
          { id: '2', type: 'risk', title: 'Globex has gone quiet', description: 'No activity for 9 days.', confidence: 71, actionable: true, suggestedActions: ['Re-engage Grace'], createdAt: iso(now), category: 'contacts' }]),
        contacts_score: JSON.stringify({ score: 82, reasoning: 'Senior decision maker, hot interest, referral source.', nextBestAction: 'Send the final contract and book a close call', fitScore: 85, engagementScore: 78, conversionProbability: 80, urgencyScore: 70 }),
        email_compose: JSON.stringify({ text: 'Subject: Next steps on your renewal\n\nHi Ada,\n\nThanks for the great call. I have attached the final pricing and a proposed rollout plan. Could we meet Thursday to confirm?\n\nBest,\nSam' }),
        contacts_enrich: JSON.stringify({ title: 'Chief Technology Officer', company: 'TechCorp Solutions', industry: 'Technology', city: 'London', country: 'UK', linkedin: 'https://linkedin.com/in/ada', bio: 'CTO focused on platform engineering.', summary: 'Matched on name, company and email domain.', confidence: 84, sources: [{ title: 'TechCorp leadership', url: 'https://techcorp.example/team' }] }),
        generate_task_suggestions: '[]'
      }[table] ?? '{}';
      return route.fulfill({ status: 200, headers, body: out });
    }
    if (url.pathname.includes('/rpc/')) return route.fulfill({ status: 200, headers, body: JSON.stringify(linkedEvents()) });
    const rows = db[table]; const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    if (!rows) return route.fulfill({ status: 404, headers, body: '{}' });
    const idq = (url.searchParams.get('id') || '').replace('eq.', '');
    if (method === 'GET') return route.fulfill({ status: 200, headers, body: JSON.stringify(idq ? rows.filter((r) => r.id === idq) : rows) });
    if (method === 'POST') { const b = JSON.parse(req.postData() || '[]'); const list = (Array.isArray(b) ? b : [b]).map((x) => ({ id: `n${++seq}`, created_at: iso(new Date()), updated_at: iso(new Date()), ...x })); rows.push(...list); return route.fulfill({ status: 201, headers, body: JSON.stringify(single ? list[0] : list) }); }
    if (method === 'PATCH') { const row = rows.find((r) => r.id === idq); if (row) Object.assign(row, JSON.parse(req.postData() || '{}')); return route.fulfill({ status: 200, headers, body: JSON.stringify(single ? row : [row]) }); }
    return route.fulfill({ status: 204, headers });
  });

  const wait = (ms = 700) => page.waitForTimeout(ms);
  const shot = async (name, opts = {}) => { await wait(350); await page.screenshot({ path: path.join(OUT, name + '.png'), ...opts }); console.log('saved', name); };
  const calendar = () => page.locator('.rbc-calendar').first();
  const calendarBlock = async (name) => { // the toolbar + calendar area (including open menus)
    const box = await page.locator('.rbc-calendar').first().boundingBox();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.rbc-calendar').first().scrollIntoViewIfNeeded();
    await wait(300);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('saved', name);
  };
  const open = async () => { await page.goto('http://127.0.0.1:5199/'); await page.waitForSelector('.rbc-event', { timeout: 20000 }); await wait(1200); await calendar().scrollIntoViewIfNeeded(); await wait(300); };

  // ---------------- 1. Unified calendar ----------------
  await open();
  await calendarBlock('01-unified-calendar-month');

  await page.getByRole('button', { name: 'Week' }).click(); await wait(700);
  await calendarBlock('02-week-view-timed-task');
  await page.getByRole('button', { name: 'Month' }).click(); await wait(500);

  await page.getByRole('button', { name: /filter calendar/i }).click(); await wait(400);
  await calendarBlock('03-filters');
  await page.getByRole('checkbox', { name: 'Deals' }).uncheck(); await wait(500);
  await calendarBlock('04-filters-deals-hidden');
  await page.getByRole('checkbox', { name: 'Deals' }).check();
  await page.keyboard.press('Escape'); await page.mouse.click(5, 5); await wait(300);

  await page.getByRole('button', { name: /saved views/i }).click(); await wait(400);
  await calendarBlock('05-saved-views');
  await page.mouse.click(5, 5); await wait(300);

  // right-click menu on the deal card
  await page.locator('.rbc-event:has-text("TechCorp")').first().click({ button: 'right' }); await wait(400);
  await calendarBlock('06-context-menu');
  await page.keyboard.press('Escape'); await wait(300);

  // drag: before / after
  await calendarBlock('07-drag-before');
  const cellFor = async (dayNumber) => {
    const rows = page.locator('.rbc-month-row');
    for (let r = 0; r < await rows.count(); r++) {
      const dates = rows.nth(r).locator('.rbc-date-cell:not(.rbc-off-range) button, .rbc-date-cell:not(.rbc-off-range) a');
      for (let c = 0; c < await dates.count(); c++) if ((await dates.nth(c).innerText()).trim() === String(dayNumber)) return rows.nth(r).locator('.rbc-day-bg').nth(c);
    }
  };
  const target = Math.min(D + 3, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
  await page.locator('.rbc-event:has-text("TechCorp")').first().dragTo(await cellFor(target), { force: true }); await wait(900);
  await calendarBlock('08-drag-after-deal-moved');

  await page.locator('.rbc-event:has-text("Renewal call")').first().click(); await wait(600);
  await shot('09-event-details-dialog');
  await page.keyboard.press('Escape'); await wait(300);

  // ---------------- 2. Records ----------------
  await open();
  await page.getByText('View All Contacts').first().click(); await wait(900);
  await page.locator('h3:has-text("Ada Lovelace"), h4:has-text("Ada Lovelace")').first().click({ force: true }); await wait(1000);
  await shot('10-contact-overview-next-follow-up');
  await page.getByRole('button', { name: 'Calendar', exact: true }).first().click(); await wait(900);
  await shot('11-contact-calendar-tab');
  await page.getByRole('button', { name: /new event/i }).first().click(); await wait(600);
  await page.getByLabel('Title').fill('Contract signing'); await wait(300);
  await shot('12-event-composer');
  await page.keyboard.press('Escape'); await wait(300);
  const tab = async (n) => {
    const b = page.getByRole('button', { name: n, exact: true }).first();
    if (!(await b.isVisible().catch(() => false))) { // Escape may have closed the whole contact view: reopen it
      await open(); await page.getByText('View All Contacts').first().click(); await wait(900);
      await page.locator('h3:has-text("Ada Lovelace"), h4:has-text("Ada Lovelace")').first().click({ force: true }); await wait(1000);
    }
    await page.getByRole('button', { name: n, exact: true }).first().click(); await wait(800);
  };
  await tab('Tasks');
  await shot('13-contact-tasks-widget');
  await tab('Journey');
  await shot('14-contact-journey-timeline');
  await tab('AI Insights');
  await page.getByRole('button', { name: /generate/i }).first().click().catch(() => {}); await wait(1200);
  await shot('15-contact-ai-insights');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await wait(300);

  // deal modal (opened from the calendar menu -> Edit)
  await open();
  await page.locator('.rbc-event:has-text("TechCorp")').first().click({ button: 'right' }); await wait(300);
  await page.getByRole('menuitem', { name: 'Edit' }).click(); await wait(1200);
  await shot('16-deal-details-with-tasks-and-calendar');
  await page.mouse.wheel(0, 700); await wait(500);
  await shot('17-deal-details-lower');
  await page.keyboard.press('Escape'); await wait(300);

  // task modal with related record
  await open();
  await page.locator('.rbc-event:has-text("Send proposal")').first().click(); await wait(500);
  await shot('18-task-details-activity-and-linked-event');
  await page.evaluate(() => document.querySelectorAll('[role=dialog]').forEach((d) => d.scrollTo(0, 1e5))); await wait(300);
  await page.keyboard.press('Escape'); await wait(400);
  await page.getByRole('button', { name: /new task/i }).first().click(); await wait(800);
  await page.locator('#task-related-record').selectOption({ index: 1 }).catch(() => {});
  await page.locator('#task-related-record').scrollIntoViewIfNeeded({ timeout: 8000 }); await wait(400);
  await shot('19-task-related-record-picker');
  await page.keyboard.press('Escape'); await wait(300);

  // ---------------- 3. Settings ----------------
  await open();
  await page.getByTitle('Calendar Settings').click(); await wait(700);
  await shot('20-calendar-settings-visibility');
  await page.keyboard.press('Escape'); await wait(300);

  // ---------------- 4. Kanban + AI ----------------
  await open();
  await page.getByTitle('Kanban Board').click(); await wait(1500);
  await shot('21-kanban-board');
  await page.getByTitle('Calendar View').click(); await wait(500);

  await page.getByText('View All Contacts').first().click(); await wait(1200);
  await shot('22-contacts-ai-score-cards');
  await page.keyboard.press('Escape'); await wait(300);

  await page.getByText('Send Email').first().click(); await wait(600);
  await page.getByPlaceholder('Add recipient...').fill('ada@techcorp.io'); await page.getByPlaceholder('Add recipient...').press('Enter'); await wait(300);
  await page.getByRole('button', { name: /ai generate/i }).click(); await wait(1200);
  await shot('23-email-composer-ai-draft');
  await page.keyboard.press('Escape'); await wait(300);

  await page.getByText('New Contact').first().click(); await wait(700);
  await page.getByPlaceholder('Enter first name').fill('Katherine'); await page.getByPlaceholder('Enter last name').fill('Johnson'); await page.getByPlaceholder('Enter email address').fill('katherine@nasa.gov'); await wait(300);
  await shot('24-new-contact-ai-autofill-and-avatar');
  await page.keyboard.press('Escape'); await wait(300);

  await browser.close();
})().catch((e) => { console.error('SCREENSHOTS FAILED', e); process.exit(1); });
