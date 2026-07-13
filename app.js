// ==========================================================================
// HOBBYFI CRM COPILOT - SANDBOX ENGINE
// Client-side simulation of Mastra, Memory, Guardrails, and Databases
// ==========================================================================

// --- MOCK DATA SEED ---
const INITIAL_USERS = [
  { id: "usr-1", name: "Sarah Jenkins", email: "sarah.j@example.com", membership_type: "Trial", membership_status: "Active", membership_expiry: "2026-07-17", trial_days_remaining: 7 },
  { id: "usr-2", name: "Alex Rivera", email: "alex.r@example.com", membership_type: "Monthly", membership_status: "Active", membership_expiry: "2026-08-10", trial_days_remaining: 0 },
  { id: "usr-3", name: "David Kim", email: "david.k@example.com", membership_type: "Trial", membership_status: "Active", membership_expiry: "2026-07-13", trial_days_remaining: 3 },
  { id: "usr-4", name: "Emma Watson", email: "emma.w@example.com", membership_type: "Annual", membership_status: "Active", membership_expiry: "2027-01-01", trial_days_remaining: 0 },
  { id: "usr-5", name: "Marcus Vance", email: "marcus.v@example.com", membership_type: "None", membership_status: "Expired", membership_expiry: "2026-06-30", trial_days_remaining: 0 }
];

const INITIAL_TRANSACTIONS = [
  { id: "tx-101", amount: 150.00, description: "Monthly Membership Fee - Alex Rivera", date: "2026-07-10T10:30:00Z" },
  { id: "tx-102", amount: 45.00, description: "Badminton Court Rental - Court 3", date: "2026-07-10T14:15:00Z" },
  { id: "tx-103", amount: 1200.00, description: "Annual Premium Package - Emma Watson", date: "2026-07-09T09:00:00Z" },
  { id: "tx-104", amount: 35.00, description: "Badminton Trial Entry Fee - Marcus Vance", date: "2026-07-10T16:45:00Z" }
];

const INITIAL_BOOKINGS = [
  { id: "bk-501", userName: "Alex Rivera", activityName: "Court 3 Booking - Singles Match", date: "2026-07-10", status: "Scheduled" },
  { id: "bk-502", userName: "Sarah Jenkins", activityName: "Group Training - Beginners Session", date: "2026-07-10", status: "Completed" },
  { id: "bk-503", userName: "David Kim", activityName: "Court 1 Booking - Doubles Match", date: "2026-07-11", status: "Scheduled" }
];

// State variables
let database = {
  users: [],
  transactions: [],
  bookings: []
};

let shortTermMemory = "No active queries";
let activeApproval = null;
let currentTheme = "dark";
let auditLog = [];

// --- AUDIT TRAIL SYSTEM ---
function addAuditEntry(type, message) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  auditLog.push({ type, message, time: timeStr });

  const box = document.getElementById('audit-log-box');
  if (!box) return;

  // Clear empty state
  const empty = box.querySelector('.audit-empty');
  if (empty) empty.remove();

  const entry = document.createElement('div');
  entry.className = 'audit-entry';
  entry.innerHTML = `
    <span class="audit-dot ${type}"></span>
    <span class="audit-text">${message}</span>
    <span class="audit-time">${timeStr}</span>
  `;
  box.appendChild(entry);
  box.scrollTop = box.scrollHeight;

  // Update KPI audit count
  const countEl = document.getElementById('kpi-audit-count');
  if (countEl) countEl.textContent = auditLog.length;
}

// --- KPI UPDATERS ---
function updateKPIs() {
  const todayString = '2026-07-10';
  const todayTxs = database.transactions.filter(t => t.date.startsWith(todayString));
  const totalRev = todayTxs.reduce((sum, t) => sum + t.amount, 0);
  const trials = database.users.filter(u => u.membership_type === 'Trial' && u.membership_status === 'Active');

  const revEl = document.getElementById('kpi-revenue');
  const usersEl = document.getElementById('kpi-users');
  const trialsEl = document.getElementById('kpi-trials');
  if (revEl) revEl.textContent = `$${totalRev.toFixed(2)}`;
  if (usersEl) usersEl.textContent = database.users.length;
  if (trialsEl) trialsEl.textContent = trials.length;
}

// --- DATABASE CONTROLLERS ---
function initDatabase() {
  const cachedDb = localStorage.getItem("hobbyfi_db");
  if (cachedDb) {
    database = JSON.parse(cachedDb);
  } else {
    resetDatabase();
  }
  renderTables();
  updateKPIs();
}

function resetDatabase() {
  database.users = [...INITIAL_USERS];
  database.transactions = [...INITIAL_TRANSACTIONS];
  database.bookings = [...INITIAL_BOOKINGS];
  saveDatabase();
  renderTables();
  shortTermMemory = "Database Reset";
  updateMemoryDisplay();
}

function saveDatabase() {
  localStorage.setItem("hobbyfi_db", JSON.stringify(database));
}

// --- VIEW CONTROLLER (TABS) ---
window.switchTab = function(tabId) {
  // Hide all panels
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.remove("active");
  });
  
  // Deactivate all menu buttons
  document.querySelectorAll(".menu-item").forEach(btn => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });

  // Show target panel
  const targetPanel = document.getElementById(`panel-${tabId}`);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // Activate target button
  const targetBtn = document.getElementById(`btn-${tabId}`);
  if (targetBtn) {
    targetBtn.classList.add("active");
    targetBtn.setAttribute("aria-selected", "true");
  }
};

// --- DATA GRID RENDERING ---
function renderTables() {
  // 1. Render Users
  const usersBody = document.getElementById("db-users-body");
  if (usersBody) {
    usersBody.innerHTML = database.users.map(u => `
      <tr>
        <td><strong>${u.id}</strong></td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="badge-membership ${u.membership_type.toLowerCase()}">${u.membership_type}</span></td>
        <td><span class="badge-status ${u.membership_status.toLowerCase()}">${u.membership_status}</span></td>
        <td><code>${u.membership_expiry || "N/A"}</code></td>
        <td>${u.trial_days_remaining > 0 ? `${u.trial_days_remaining} days` : "—"}</td>
      </tr>
    `).join("");
    document.getElementById("count-users").textContent = `${database.users.length} Records`;
  }

  // 2. Render Transactions
  const txBody = document.getElementById("db-tx-body");
  if (txBody) {
    txBody.innerHTML = database.transactions.map(tx => {
      const formattedDate = new Date(tx.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      return `
        <tr>
          <td><strong>${tx.id}</strong></td>
          <td><strong>$${tx.amount.toFixed(2)}</strong></td>
          <td>${tx.description}</td>
          <td><code>${formattedDate}</code></td>
        </tr>
      `;
    }).join("");
    document.getElementById("count-tx").textContent = `${database.transactions.length} Records`;
  }

  // 3. Render Bookings
  const bkBody = document.getElementById("db-bookings-body");
  if (bkBody) {
    bkBody.innerHTML = database.bookings.map(bk => `
      <tr>
        <td><strong>${bk.id}</strong></td>
        <td>${bk.userName}</td>
        <td>${bk.activityName}</td>
        <td><code>${bk.date}</code></td>
        <td><span class="badge-membership ${bk.status === 'Completed' ? 'monthly' : 'trial'}">${bk.status}</span></td>
      </tr>
    `).join("");
    document.getElementById("count-bookings").textContent = `${database.bookings.length} Records`;
  }
}

// --- WORKFLOW GRAPH VISUALIZER ANIMATIONS ---
function resetWorkflowVisuals() {
  document.querySelectorAll(".dag-node, .dag-connector").forEach(el => {
    el.classList.remove("active", "active-write", "active-warn", "success");
  });
}

function runWorkflowAnimation(isWriteAction, callback) {
  resetWorkflowVisuals();
  
  // Step 1: Input Guardrail
  const nodeInput = document.getElementById("node-input");
  const conn1 = document.getElementById("conn-1");
  const nodeGuard = document.getElementById("node-guardrails");
  const conn2 = document.getElementById("conn-2");
  const nodeRouter = document.getElementById("node-router");

  setTimeout(() => {
    nodeInput.classList.add("active");
    updateGuardrailStatus("pending");
  }, 100);

  setTimeout(() => {
    conn1.classList.add("active");
    nodeGuard.classList.add("active");
    updateGuardrailStatus("passed");
  }, 400);

  setTimeout(() => {
    conn2.classList.add("active");
    nodeRouter.classList.add("active");
    
    // Set classification details
    const routeOutcome = document.getElementById("router-outcome-badge");
    routeOutcome.className = "badge-route";
    if (isWriteAction) {
      routeOutcome.textContent = "Write Mutator";
      routeOutcome.classList.add("write-color");
    } else {
      routeOutcome.textContent = "Read Query";
      routeOutcome.classList.add("active-color");
    }
  }, 850);

  if (isWriteAction) {
    // Flow for write operations
    const nodeWrite = document.getElementById("node-write");
    const nodeApproval = document.getElementById("node-approval");

    setTimeout(() => {
      nodeWrite.classList.add("active-write");
      updateToolStatus("propose_mutation_payload", "CraftTrialExtensionMutation", "PENDING approval");
    }, 1300);

    setTimeout(() => {
      nodeApproval.classList.add("active-warn");
      updateToolStatus("awaiting_hitl_approval", "VendorApprovalLoop", "Awaiting click");
      if (callback) callback();
    }, 1800);

  } else {
    // Flow for read operations
    const nodeRead = document.getElementById("node-read");
    const conn3 = document.getElementById("conn-3");
    const nodeOutput = document.getElementById("node-output-gen");

    setTimeout(() => {
      nodeRead.classList.add("active");
      updateToolStatus("executing_db_select", "DatabaseQueryTool", "RUNNING");
    }, 1300);

    setTimeout(() => {
      nodeRead.classList.remove("active");
      nodeRead.classList.add("success");
      updateToolStatus("done", "DatabaseQueryTool", "DONE");
      
      conn3.classList.add("active");
      nodeOutput.classList.add("active");
    }, 1900);

    setTimeout(() => {
      nodeOutput.classList.remove("active");
      nodeOutput.classList.add("success");
      if (callback) callback();
    }, 2400);
  }
}

// --- DIAGNOSTICS & STATUS WRITERS ---
function updateGuardrailStatus(state) {
  const items = ["guard-pii", "guard-injection", "guard-multitenancy"];
  items.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "guard-item";
    
    if (state === "passed") {
      el.classList.add("passed");
      el.querySelector(".icon").textContent = "✓";
    } else if (state === "pending") {
      el.classList.add("pending");
      el.querySelector(".icon").textContent = "●";
    } else {
      el.classList.add("failed");
      el.querySelector(".icon").textContent = "✗";
    }
  });
}

function updateToolStatus(state, toolName, statusText) {
  const box = document.getElementById("tool-status-box");
  if (!box) return;
  
  if (state === "idle") {
    box.innerHTML = `<div class="tool-idle">Awaiting user input query...</div>`;
    return;
  }

  const isRunning = statusText === "RUNNING" || statusText === "PENDING approval" || statusText === "Awaiting click";
  const statusClass = isRunning ? "running" : "done";

  box.innerHTML = `
    <div class="tool-active-details">
      <div class="tool-name-line">
        <span class="name">Tool: ${toolName}()</span>
        <span class="status ${statusClass}">${statusText}</span>
      </div>
      <div class="tool-params" id="tool-params-display">...</div>
    </div>
  `;
}

function updateToolParams(text) {
  const paramDisplay = document.getElementById("tool-params-display");
  if (paramDisplay) {
    paramDisplay.textContent = text;
  }
}

function updateMemoryDisplay() {
  document.getElementById("mem-short-term").textContent = shortTermMemory;
}

// --- AGENT ROUTER & CHAT SYSTEM LOGIC ---
window.handleChatSubmit = function(event) {
  event.preventDefault();
  const inputEl = document.getElementById("chat-input-field");
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  processQuery(text);
};

window.sendPresetPrompt = function(promptText) {
  processQuery(promptText);
};

function appendMessage(sender, text, htmlContent = null) {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;

  let avatarHTML = "";
  if (sender === "agent") {
    avatarHTML = `
      <div class="avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12a10 10 0 0 1 10-10z"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
    `;
  } else if (sender === "user") {
    avatarHTML = `
      <div class="avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    `;
  }

  msgDiv.innerHTML = `
    ${avatarHTML}
    <div class="msg-content">
      ${htmlContent ? htmlContent : `<p>${escapeHTML(text)}</p>`}
    </div>
  `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById("chat-messages-container");
  if (!container) return null;

  const typingDiv = document.createElement("div");
  typingDiv.className = "msg agent typing-indicator-msg";
  typingDiv.innerHTML = `
    <div class="avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12a10 10 0 0 1 10-10z"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    </div>
    <div class="msg-content">
      <div style="display: flex; gap: 4px; align-items: center; height: 16px;">
        <span class="status-dot" style="width: 6px; height: 6px; background-color: var(--text-secondary); margin: 0 2px;"></span>
        <span class="status-dot" style="width: 6px; height: 6px; background-color: var(--text-secondary); margin: 0 2px; animation-delay: 0.2s;"></span>
        <span class="status-dot" style="width: 6px; height: 6px; background-color: var(--text-secondary); margin: 0 2px; animation-delay: 0.4s;"></span>
      </div>
    </div>
  `;
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;
  return typingDiv;
}

function removeTypingIndicator(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- QUERY PARSER & INTENT PROCESSING ---
function processQuery(queryText) {
  // Add user prompt to bubble
  appendMessage("user", queryText);

  // Short term memory context update
  shortTermMemory = queryText.length > 25 ? queryText.substring(0, 25) + "..." : queryText;
  updateMemoryDisplay();

  // Show thinking bubble
  const typingBubble = showTypingIndicator();

  // Basic NLP matcher
  const queryLower = queryText.toLowerCase();
  
  // --- PROMPT INJECTION DETECTION (Input Guardrail) ---
  const injectionPatterns = [
    /ignore.*(?:previous|all|above).*instructions/i,
    /export.*(?:all|every).*(?:user|email|data|password)/i,
    /(?:system|admin).*prompt/i,
    /(?:drop|delete|truncate).*(?:table|database)/i,
    /show.*(?:system|internal|hidden).*(?:prompt|config)/i,
  ];
  const isInjectionAttempt = injectionPatterns.some(p => p.test(queryText));

  if (isInjectionAttempt) {
    // Guardrail BLOCKS the query
    setTimeout(() => {
      removeTypingIndicator(typingBubble);
      updateGuardrailStatus('failed');
      updateToolStatus('done', 'PromptInjectionScanner', 'BLOCKED');
      updateToolParams(`threat_detected = true\npattern_match = "injection_override"\naction = "REQUEST_BLOCKED"`);

      addAuditEntry('blocked', `BLOCKED: Prompt injection attempt detected`);

      const html = `
        <div style="display:flex; align-items:center; gap:8px; color:var(--color-danger); font-weight:600; margin-bottom:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Input Guardrail: Request Blocked
        </div>
        <p>This query was flagged by the <strong>Prompt Injection Scanner</strong> (Gemini 2.0 Flash classifier). The request contains patterns consistent with instruction override or data exfiltration attempts.</p>
        <p style="font-size:0.82rem; color:var(--text-secondary); margin-top:8px;">The query was <strong>not forwarded</strong> to any Agent or Tool. This event has been logged to the audit trail.</p>
      `;
      appendMessage('agent', '', html);
    }, 800);
    return;
  }

  // Let's check intent
  const isRevenueQuery = queryLower.includes("revenue") || queryLower.includes("earn") || queryLower.includes("today's total");
  const isTrialListQuery = queryLower.includes("trial") && (queryLower.includes("list") || queryLower.includes("get") || queryLower.includes("show")) && (queryLower.includes("badminton") || queryLower.includes("users") || queryLower.includes("game"));
  const isIncreaseTrial = queryLower.includes("increase") || queryLower.includes("extend") || (queryLower.includes("trial") && queryLower.includes("sarah"));
  const isUpdateExpiry = queryLower.includes("update") || queryLower.includes("expiry") || (queryLower.includes("david") && queryLower.includes("membership"));

  if (isRevenueQuery) {
    // RUN READ OPERATION FLOW FOR REVENUE
    runWorkflowAnimation(false, () => {
      removeTypingIndicator(typingBubble);
      
      // Calculate today's revenue from mock db
      const todayString = "2026-07-10"; // Hardcoded sandbox date
      const todayTxs = database.transactions.filter(t => t.date.startsWith(todayString));
      const totalRev = todayTxs.reduce((sum, t) => sum + t.amount, 0);

      updateToolParams(`sql_query = "SELECT SUM(amount) FROM transactions WHERE date LIKE '2026-07-10%'"\nresult = ${totalRev}`);

      const html = `
        <p><strong>Today's Revenue Tool Executed.</strong></p>
        <p>Calculated total revenue for today (July 10, 2026):</p>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success); margin: 10px 0;">$${totalRev.toFixed(2)}</div>
        <p style="font-size: 0.8rem; color: var(--text-secondary);">Breakdown:</p>
        <ul style="font-size: 0.8rem; padding-left: 15px; color: var(--text-secondary);">
          ${todayTxs.map(t => `<li>$${t.amount.toFixed(2)}: ${t.description}</li>`).join("")}
        </ul>
      `;
      appendMessage("agent", "", html);
      addAuditEntry('read', `READ: queryRevenue() → $${totalRev.toFixed(2)}`);
    });

  } else if (isTrialListQuery) {
    // RUN READ OPERATION FLOW FOR TRIAL USERS
    runWorkflowAnimation(false, () => {
      removeTypingIndicator(typingBubble);

      // Filter badminton trial users
      const trials = database.users.filter(u => u.membership_type === "Trial" && u.membership_status === "Active");
      
      updateToolParams(`sql_query = "SELECT * FROM users WHERE membership_type = 'Trial' AND membership_status = 'Active'"\nresult_count = ${trials.length}`);

      const html = `
        <p><strong>CRM database query succeeded.</strong> Found ${trials.length} active trial users for Badminton:</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 10px; font-size: 0.8rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
              <th style="padding: 4px;">Name</th>
              <th style="padding: 4px;">Email</th>
              <th style="padding: 4px;">Days Left</th>
            </tr>
          </thead>
          <tbody>
            ${trials.map(t => `
              <tr style="border-bottom: 1px dashed rgba(255,255,255,0.05);">
                <td style="padding: 6px 4px;"><strong>${t.name}</strong></td>
                <td style="padding: 6px 4px;">${t.email}</td>
                <td style="padding: 6px 4px; color: var(--color-warning); font-weight: 600;">${t.trial_days_remaining} days</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      appendMessage("agent", "", html);
      addAuditEntry('read', `READ: listTrialUsers() → ${trials.length} results`);
    });

  } else if (isIncreaseTrial) {
    // RUN WRITE OPERATION FLOW - EXTEND TRIAL (HITL REQUIRED)
    runWorkflowAnimation(true, () => {
      removeTypingIndicator(typingBubble);

      // Resolve user object
      const targetUser = database.users.find(u => u.name.includes("Sarah"));
      if (!targetUser) {
        appendMessage("agent", "Error: User Sarah Jenkins not found in database.");
        return;
      }

      const daysToAdd = 7;
      const newTrialVal = targetUser.trial_days_remaining + daysToAdd;

      updateToolParams(`target_user = "${targetUser.name}"\naction = "UPDATE_USER"\nfields = { trial_days_remaining: ${newTrialVal} }\nstatus = "PENDING_APPROVAL"`);

      // Create a unique approval session
      const approvalId = "mut-" + Math.random().toString(36).substr(2, 9);
      activeApproval = {
        id: approvalId,
        type: "TRIAL_EXTENSION",
        userId: targetUser.id,
        userName: targetUser.name,
        days: daysToAdd,
        oldValue: targetUser.trial_days_remaining,
        newValue: newTrialVal
      };

      const html = `
        <p>I have drafted a request to increase <strong>Sarah Jenkins'</strong> free trial.</p>
        <p>As this is a mutative action affecting scheduling metrics, it requires your approval before executing.</p>
        
        <div class="approval-card" id="approval-card-${approvalId}">
          <div class="approval-header">
            <span class="approval-badge">Approval Required</span>
            <span>ID: ${approvalId}</span>
          </div>
          <div class="approval-desc">
            Extend <strong>Sarah Jenkins</strong> free trial by <strong>+${daysToAdd} days</strong> (from ${targetUser.trial_days_remaining} to ${newTrialVal} days).
          </div>
          <div class="approval-details">
            DB Transaction Proposal:<br>
            UPDATE users <br>
            SET trial_days_remaining = ${newTrialVal} <br>
            WHERE id = '${targetUser.id}';
          </div>
          <div class="approval-actions">
            <button class="btn-approve" onclick="handleVendorApproval('${approvalId}', true)">Approve Mutation</button>
            <button class="btn-reject" onclick="handleVendorApproval('${approvalId}', false)">Reject</button>
          </div>
        </div>
      `;
      appendMessage("agent", "", html);
      addAuditEntry('write', `WRITE PENDING: extendTrial(${targetUser.name}, +${daysToAdd}d)`);
    });

  } else if (isUpdateExpiry) {
    // RUN WRITE OPERATION - UPDATE MEMBERSHIP DATE (HITL REQUIRED)
    runWorkflowAnimation(true, () => {
      removeTypingIndicator(typingBubble);

      const targetUser = database.users.find(u => u.name.includes("David"));
      if (!targetUser) {
        appendMessage("agent", "Error: User David Kim not found in database.");
        return;
      }

      const newDate = "2026-12-31";
      updateToolParams(`target_user = "${targetUser.name}"\naction = "UPDATE_USER"\nfields = { membership_expiry: "${newDate}" }\nstatus = "PENDING_APPROVAL"`);

      const approvalId = "mut-" + Math.random().toString(36).substr(2, 9);
      activeApproval = {
        id: approvalId,
        type: "MEMBERSHIP_EXPIRY",
        userId: targetUser.id,
        userName: targetUser.name,
        date: newDate,
        oldValue: targetUser.membership_expiry,
        newValue: newDate
      };

      const html = `
        <p>I have prepared a mutation to update <strong>David Kim's</strong> membership expiry date to <strong>December 31, 2026</strong>.</p>
        <p>Please review and sign off on this configuration change:</p>
        
        <div class="approval-card" id="approval-card-${approvalId}">
          <div class="approval-header">
            <span class="approval-badge">Approval Required</span>
            <span>ID: ${approvalId}</span>
          </div>
          <div class="approval-desc">
            Update <strong>David Kim's</strong> expiry date from <strong>${targetUser.membership_expiry}</strong> to <strong>${newDate}</strong>, converting trial to Monthly status.
          </div>
          <div class="approval-details">
            DB Transaction Proposal:<br>
            UPDATE users <br>
            SET membership_expiry = '${newDate}', membership_type = 'Monthly' <br>
            WHERE id = '${targetUser.id}';
          </div>
          <div class="approval-actions">
            <button class="btn-approve" onclick="handleVendorApproval('${approvalId}', true)">Approve</button>
            <button class="btn-reject" onclick="handleVendorApproval('${approvalId}', false)">Reject</button>
          </div>
        </div>
      `;
      appendMessage("agent", "", html);
      addAuditEntry('write', `WRITE PENDING: updateExpiry(${targetUser.name}, ${newDate})`);
    });

  } else {
    // UNKNOWN / FALLBACK COMMAND
    setTimeout(() => {
      removeTypingIndicator(typingBubble);
      resetWorkflowVisuals();
      updateGuardrailStatus("passed");
      updateToolStatus("idle");

      const html = `
        <p>I received your message, but it doesn't match any pre-programmed database triggers. Under production environments, the <strong>Mastra Agent Router</strong> classifies requests dynamically using LLM semantic embeddings.</p>
        <p>For this sandbox demo, please try one of these exact operations:</p>
        <ul style="padding-left: 18px; margin: 8px 0; color: var(--text-secondary); font-size: 0.88rem;">
          <li>"What is the revenue of today?" (Read query)</li>
          <li>"List trial users of badminton game" (Read query)</li>
          <li>"Increase the free trial of Sarah Jenkins by 7 days" (Write workflow + approval)</li>
          <li>"Update David Kim's membership expiry to 2026-12-31" (Write workflow + approval)</li>
        </ul>
      `;
      appendMessage("agent", "", html);
    }, 1000);
  }
}

// --- VENDOR APPROVAL HANDLER ---
window.handleVendorApproval = function(approvalId, isApproved) {
  const card = document.getElementById(`approval-card-${approvalId}`);
  if (!card) return;

  if (!activeApproval || activeApproval.id !== approvalId) {
    card.innerHTML = `<div style="color:var(--color-danger);">Error: Approval context expired.</div>`;
    return;
  }

  // Visual highlights on the Workflow DAG
  const nodeApproval = document.getElementById("node-approval");
  const conn3 = document.getElementById("conn-3");
  const nodeOutput = document.getElementById("node-output-gen");
  
  nodeApproval.classList.remove("active-warn");

  if (isApproved) {
    // Apply changes to db
    const uIndex = database.users.findIndex(u => u.id === activeApproval.userId);
    if (uIndex !== -1) {
      if (activeApproval.type === "TRIAL_EXTENSION") {
        database.users[uIndex].trial_days_remaining = activeApproval.newValue;
        // Extend expiry date relatively as well
        const exp = new Date(database.users[uIndex].membership_expiry);
        exp.setDate(exp.getDate() + activeApproval.days);
        database.users[uIndex].membership_expiry = exp.toISOString().split("T")[0];
      } else if (activeApproval.type === "MEMBERSHIP_EXPIRY") {
        database.users[uIndex].membership_expiry = activeApproval.newValue;
        database.users[uIndex].membership_type = "Monthly";
        database.users[uIndex].trial_days_remaining = 0;
      }
      
      saveDatabase();
      renderTables();
      updateKPIs();

      // Flash the updated row in the DB table
      setTimeout(() => {
        const rows = document.querySelectorAll('#db-users-body tr');
        rows.forEach(row => {
          if (row.textContent.includes(activeApproval.userId)) {
            row.classList.add('updated');
            setTimeout(() => row.classList.remove('updated'), 1500);
          }
        });
      }, 100);
    }

    // Success state on graph
    nodeApproval.classList.add("success");
    conn3.classList.add("active");
    nodeOutput.classList.add("active");

    setTimeout(() => {
      nodeOutput.classList.remove("active");
      nodeOutput.classList.add("success");
      updateToolStatus("done", "CommitDBUpdate", "COMMITTED");
      updateToolParams(`transaction_status = "SUCCESS"\naffected_rows = 1\nuser_id = "${activeApproval.userId}"`);
    }, 600);

    // Replace card layout
    card.outerHTML = `
      <div class="approval-resolved">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span><strong>Mutation Executed:</strong> Approved by vendor. DB state updated in users table.</span>
      </div>
    `;

    // Agent response
    setTimeout(() => {
      if (activeApproval.type === "TRIAL_EXTENSION") {
        appendMessage("agent", `Successfully committed! Sarah Jenkins' free trial has been extended by 7 days. She now has ${activeApproval.newValue} trial days remaining.`);
        addAuditEntry('approved', `APPROVED: extendTrial(${activeApproval.userName}) → committed`);
      } else {
        appendMessage("agent", `Database transaction complete. David Kim's membership has been updated to Monthly status, expiring on December 31, 2026.`);
        addAuditEntry('approved', `APPROVED: updateExpiry(${activeApproval.userName}) → committed`);
      }
      activeApproval = null;
    }, 1000);

  } else {
    // Rejected state
    nodeApproval.classList.add("failed");
    updateToolStatus("done", "CancelMutationLog", "REJECTED_BY_USER");

    // Replace card layout
    card.outerHTML = `
      <div class="approval-resolved rejected">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span><strong>Mutation Rejected:</strong> Transaction aborted. No changes made to database.</span>
      </div>
    `;

    setTimeout(() => {
      appendMessage("agent", "Understood. The drafted database update has been aborted and cleared from the memory buffer.");
      addAuditEntry('rejected', `REJECTED: mutation for ${activeApproval.userName} → aborted`);
      activeApproval = null;
    }, 1000);
  }
};

// --- TECHNICAL REPORT SCROLLER LINK ENHANCEMENT ---
function initReportNavScroll() {
  const container = document.getElementById("report-doc-view");
  const links = document.querySelectorAll(".rep-nav-link");
  if (!container || links.length === 0) return;

  links.forEach(link => {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        // Remove active class from all links
        links.forEach(l => l.classList.remove("active"));
        // Add active class to current
        this.classList.add("active");
        
        // Scroll target element into view inside the report container
        container.scrollTo({
          top: targetEl.offsetTop - 20,
          behavior: "smooth"
        });
      }
    });
  });

  // Simple scroll spy to toggle active link based on scroll position
  container.addEventListener("scroll", () => {
    let currentSectionId = "";
    const sections = container.querySelectorAll(".rep-doc-section");
    const scrollPos = container.scrollTop + 60;

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) {
        currentSectionId = sec.getAttribute("id");
      }
    });

    if (currentSectionId) {
      links.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentSectionId}`) {
          link.classList.add("active");
        }
      });
    }
  });
}

// --- THEME TOGGLE (SANDBOX OPTION) ---
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      currentTheme = "light";
    } else {
      document.documentElement.removeAttribute("data-theme");
      currentTheme = "dark";
    }
  });
}

// --- RESET DB WIREUP ---
const resetBtn = document.getElementById("reset-db");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    resetDatabase();
    appendMessage("system", "Sandbox Database State has been reset to defaults.");
  });
}

// --- INITIALIZE PAGE ---
document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  initReportNavScroll();
  initThemeToggle();
});
