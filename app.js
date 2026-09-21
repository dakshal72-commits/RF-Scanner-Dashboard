const config = window.DASHBOARD_CONFIG || {};
const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function number(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

async function loadDashboard() {
  const refresh = $("#refresh");
  const error = $("#error");
  refresh.disabled = true;
  refresh.textContent = "Refreshing…";
  error.hidden = true;
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/get_transfer_dashboard`, {
      method: "POST",
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${config.supabasePublishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_days: Number($("#period").value) }),
    });
    if (!response.ok) throw new Error("Dashboard data could not be loaded.");
    renderDashboard(await response.json());
  } catch (cause) {
    error.textContent = cause.message;
    error.hidden = false;
  } finally {
    refresh.disabled = false;
    refresh.textContent = "Refresh";
  }
}

function renderDashboard(data) {
  const topSkus = data.topSkus || [];
  const topSku = topSkus[0];
  $("#total-transfers").textContent = number(data.totalTransfers);
  $("#units-moved").textContent = number(data.unitsMoved);
  $("#top-sku").textContent = topSku?.sku || "—";
  $("#top-sku-detail").textContent = topSku ? `${number(topSku.units)} units moved` : "No movement recorded";
  $("#low-stock-count").textContent = number(data.lowStock?.length);
  $("#last-updated").textContent = `Updated ${new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;

  const maxUnits = Math.max(...topSkus.map((item) => Number(item.units)), 1);
  $("#sku-chart").innerHTML = topSkus.length ? topSkus.map((item) => `
    <div class="bar-row">
      <div class="bar-label"><strong>${escapeHtml(item.sku)}</strong><span>${number(item.units)} units</span></div>
      <div class="bar-track"><span style="width:${Math.max(8, Number(item.units) / maxUnits * 100)}%"></span></div>
    </div>`).join("") : emptyState("No SKU movement in this period.");

  $("#route-list").innerHTML = data.routes?.length ? data.routes.map((route, index) => `
    <div class="rank-row"><span class="rank">${index + 1}</span><div><strong>${escapeHtml(route.source)} → ${escapeHtml(route.destination)}</strong><small>${number(route.transfers)} transfers</small></div></div>`).join("") : emptyState("No routes in this period.");

  $("#low-stock-table").innerHTML = data.lowStock?.length ? data.lowStock.map((item) => `
    <tr><td>${escapeHtml(item.bin)}</td><td>${escapeHtml(item.sku)}</td><td class="number ${Number(item.quantity) === 0 ? "critical" : ""}">${number(item.quantity)}</td></tr>`).join("") : '<tr><td colspan="3" class="empty-cell">No low-stock positions.</td></tr>';

  $("#recent-transfers").innerHTML = data.recent?.length ? data.recent.map((transfer) => `
    <details class="transfer-row">
      <summary><span><strong>${escapeHtml(transfer.reference)}</strong><small>${escapeHtml(transfer.source)} → ${escapeHtml(transfer.destination)}</small></span><time>${new Date(transfer.completedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time></summary>
      <ul>${(transfer.items || []).map((item) => `<li><strong>${escapeHtml(item.sku)}</strong><span>Qty ${number(item.quantity)}</span></li>`).join("")}</ul>
    </details>`).join("") : emptyState("No completed transfers in this period.");
}

function emptyState(message) {
  return `<p class="empty">${escapeHtml(message)}</p>`;
}

$("#period").addEventListener("change", loadDashboard);
$("#refresh").addEventListener("click", loadDashboard);
loadDashboard();
