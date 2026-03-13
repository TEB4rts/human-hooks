function esc(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
export function createInboxHtml(options = {}) {
    const title = esc(options.title ?? 'human-hooks inbox');
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; background: #0b1020; color: #eef2ff; }
    header { padding: 20px; border-bottom: 1px solid #24304f; position: sticky; top: 0; background: #0b1020; }
    main { padding: 20px; display: grid; gap: 16px; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .card { background: #111931; border: 1px solid #24304f; border-radius: 12px; padding: 14px; }
    .review { display: grid; gap: 10px; }
    button, input, select { border-radius: 10px; border: 1px solid #314269; background: #0f1730; color: #eef2ff; padding: 10px 12px; }
    button { cursor: pointer; }
    button.primary { background: #2854ff; border-color: #2854ff; }
    button.danger { background: #822727; border-color: #822727; }
    pre { white-space: pre-wrap; word-break: break-word; background: #0a1126; padding: 10px; border-radius: 10px; }
    .tiny { opacity: .8; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; border: 1px solid #314269; }
    .grid { display: grid; gap: 10px; }
  </style>
</head>
<body>
  <header>
    <div class="row">
      <h1 style="margin:0;">${title}</h1>
      <span class="badge">approval + validation inbox</span>
    </div>
    <div class="row" style="margin-top:12px;">
      <input id="actorId" placeholder="Reviewer ID" />
      <input id="actorName" placeholder="Reviewer name (optional)" />
      <select id="queueFilter"><option value="">All queues</option></select>
      <select id="statusFilter">
        <option value="pending">Pending</option>
        <option value="all">All statuses</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="executed">Executed</option>
        <option value="expired">Expired</option>
      </select>
      <button id="refreshBtn" class="primary">Refresh</button>
    </div>
  </header>
  <main>
    <section class="stats" id="stats"></section>
    <section id="reviews" class="grid"></section>
  </main>
  <script>
    const actorId = document.getElementById('actorId');
    const actorName = document.getElementById('actorName');
    const queueFilter = document.getElementById('queueFilter');
    const statusFilter = document.getElementById('statusFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const stats = document.getElementById('stats');
    const reviews = document.getElementById('reviews');

    actorId.value = localStorage.getItem('hh.actorId') || '';
    actorName.value = localStorage.getItem('hh.actorName') || '';
    actorId.addEventListener('change', () => localStorage.setItem('hh.actorId', actorId.value));
    actorName.addEventListener('change', () => localStorage.setItem('hh.actorName', actorName.value));

    async function load() {
      const queue = queueFilter.value ? ('?queue=' + encodeURIComponent(queueFilter.value)) : '';
      const status = statusFilter.value === 'all' ? '&status=all' : ('&status=' + encodeURIComponent(statusFilter.value));
      const reviewsRes = await fetch('/reviews' + (queue ? queue + status : ('?' + status.slice(1))));
      const reviewData = await reviewsRes.json();
      const statsRes = await fetch('/stats' + queue);
      const statsData = await statsRes.json();
      renderStats(statsData);
      renderReviews(Array.isArray(reviewData.items) ? reviewData.items : reviewData);
      syncQueueOptions(statsData.byQueue || {});
    }

    function renderStats(data) {
      const entries = [
        ['Total', data.total], ['Pending', data.pending], ['Approved', data.approved],
        ['Rejected', data.rejected], ['Executed', data.executed], ['Expired', data.expired]
      ];
      stats.innerHTML = entries.map(([label, value]) => '<div class="card"><div class="tiny">' + label + '</div><div style="font-size:28px;font-weight:700;">' + value + '</div></div>').join('');
    }

    function syncQueueOptions(byQueue) {
      const current = queueFilter.value;
      const values = Object.keys(byQueue || {});
      queueFilter.innerHTML = '<option value="">All queues</option>' + values.map((value) => '<option value="' + value + '">' + value + '</option>').join('');
      queueFilter.value = current;
    }

    function renderReviews(items) {
      if (!items.length) {
        reviews.innerHTML = '<div class="card">No reviews found.</div>';
        return;
      }
      reviews.innerHTML = items.map((review) => {
        const canAct = review.status === 'pending';
        return '<div class="card review">'
          + '<div class="row"><strong>' + review.action + '</strong><span class="badge">' + review.queue + '</span><span class="badge">' + review.severity + '</span><span class="badge">' + review.status + '</span></div>'
          + '<div>' + review.reason + '</div>'
          + '<div class="tiny">Policies: ' + review.policyNames.join(', ') + ' • Risk score: ' + review.riskScore + ' • Approvals: ' + review.approvals.filter((a) => a.decision === 'approve').length + '/' + review.requiredApprovals + '</div>'
          + '<pre>' + JSON.stringify(review.request, null, 2) + '</pre>'
          + '<div class="row">'
          + (canAct ? '<button class="primary" onclick="decide(\'' + review.id + '\', \'approve\')">Approve</button><button class="danger" onclick="decide(\'' + review.id + '\', \'reject\')">Reject</button>' : '')
          + '<button onclick="showSummary(\'' + review.id + '\')">Summary</button>'
          + '</div>'
          + '<div id="summary-' + review.id + '" class="tiny"></div>'
          + '</div>';
      }).join('');
    }

    async function decide(reviewId, action) {
      if (!actorId.value) {
        alert('Enter a reviewer ID first.');
        return;
      }
      const note = prompt('Optional note for ' + action + ':') || undefined;
      const res = await fetch('/reviews/' + reviewId + '/' + action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: { id: actorId.value, type: 'human', name: actorName.value || undefined }, note })
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || 'Action failed.');
        return;
      }
      await load();
    }

    async function showSummary(reviewId) {
      const res = await fetch('/reviews/' + reviewId + '/summary');
      const body = await res.json();
      document.getElementById('summary-' + reviewId).innerHTML = '<pre>' + body.markdown + '</pre>';
    }

    refreshBtn.addEventListener('click', load);
    queueFilter.addEventListener('change', load);
    statusFilter.addEventListener('change', load);
    load();
  </script>
</body>
</html>`;
}
