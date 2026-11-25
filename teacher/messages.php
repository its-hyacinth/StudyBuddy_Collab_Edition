<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Messages</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <script defer src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="message-square"></i></span>
            Messages
          </h1>
          <p class="page-subtitle">Communicate with your students and manage conversations.</p>
        </div>
        <button type="button" class="btn btn-primary" id="composeBtn">
          <i data-lucide="pen-square"></i> Compose
        </button>
      </div>

      <div class="page-layout message-page-layout">
        <div class="page-main message-page-main">
          <!-- Message List Panel -->
          <div class="card message-panel message-list-panel">
            <div class="toolbar" style="margin-bottom:12px;">
              <div class="search-mini" style="max-width:100%;flex:1;">
                <i data-lucide="search"></i>
                <input type="search" id="messageSearch" placeholder="Search messages..." />
              </div>
            </div>
            <div class="filter-tabs" id="messageFilterTabs" style="margin-bottom:12px;width:100%;">
              <button type="button" class="filter-tab active" data-filter="all">All</button>
              <button type="button" class="filter-tab" data-filter="unread">
                Unread <span class="count" id="unreadCount">2</span>
              </button>
            </div>
            <div id="messageList" style="flex:1;overflow-y:auto;">
              <div class="list-item active-thread" data-id="msg_1" data-unread="true" style="padding:14px 12px;border-radius:10px;background:#EFF6FF;">
                <div class="cell-icon" style="background:#DBEAFE;color:#2563EB;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px">MS</div>
                <div class="item-meta">
                  <div class="item-title" style="display:flex;justify-content:space-between;align-items:center;">
                    Maria Santos
                    <span style="font-size:11px;color:var(--text-muted);font-weight:500">10:32 AM</span>
                  </div>
                  <div class="item-sub">Sir, can I request an extension for the lab report?</div>
                  <span class="subject-tag science" style="margin-top:4px"><span class="dot science"></span> Science 205</span>
                </div>
                <span class="badge-dot" style="width:8px;height:8px;background:var(--primary);border-radius:50%;flex-shrink:0"></span>
              </div>
              <div class="list-item" data-id="msg_2" data-unread="true" style="padding:14px 12px;border-radius:10px;">
                <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px">AR</div>
                <div class="item-meta">
                  <div class="item-title" style="display:flex;justify-content:space-between;align-items:center;">
                    Ana Reyes
                    <span style="font-size:11px;color:var(--text-muted);font-weight:500">Yesterday</span>
                  </div>
                  <div class="item-sub">Thank you for the feedback on my essay!</div>
                  <span class="subject-tag english" style="margin-top:4px"><span class="dot english"></span> English 101</span>
                </div>
                <span class="badge-dot" style="width:8px;height:8px;background:var(--primary);border-radius:50%;flex-shrink:0"></span>
              </div>
              <div class="list-item" data-id="msg_3" data-unread="false" style="padding:14px 12px;border-radius:10px;">
                <div class="cell-icon" style="background:#DBEAFE;color:#2563EB;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px">PG</div>
                <div class="item-meta">
                  <div class="item-title" style="display:flex;justify-content:space-between;align-items:center;">
                    Pedro Garcia
                    <span style="font-size:11px;color:var(--text-muted);font-weight:500">Sep 10</span>
                  </div>
                  <div class="item-sub">When is the next quiz scheduled?</div>
                  <span class="subject-tag math" style="margin-top:4px"><span class="dot math"></span> Math 101</span>
                </div>
              </div>
              <div class="list-item" data-id="msg_4" data-unread="false" style="padding:14px 12px;border-radius:10px;">
                <div class="cell-icon" style="background:#FFEDD5;color:#EA580C;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px">LM</div>
                <div class="item-meta">
                  <div class="item-title" style="display:flex;justify-content:space-between;align-items:center;">
                    Lisa Mendoza
                    <span style="font-size:11px;color:var(--text-muted);font-weight:500">Sep 9</span>
                  </div>
                  <div class="item-sub">I submitted my project on Drive.</div>
                  <span class="subject-tag cs" style="margin-top:4px"><span class="dot cs"></span> CS 308</span>
                </div>
              </div>
              <div class="list-item" data-id="msg_5" data-unread="false" style="padding:14px 12px;border-radius:10px;">
                <div class="cell-icon" style="background:#EDE9FE;color:#7C3AED;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px">SC</div>
                <div class="item-meta">
                  <div class="item-title" style="display:flex;justify-content:space-between;align-items:center;">
                    Sofia Cruz
                    <span style="font-size:11px;color:var(--text-muted);font-weight:500">Sep 8</span>
                  </div>
                  <div class="item-sub">Could you clarify question 5?</div>
                  <span class="subject-tag math" style="margin-top:4px"><span class="dot math"></span> Math 101</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Thread Panel -->
          <div class="card message-panel message-thread-panel" id="threadPanel">
            <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:0;">
              <div class="card-header-left">
                <div class="cell-icon" style="background:#DBEAFE;color:#2563EB;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600" id="threadAvatar">MS</div>
                <div>
                  <h2 class="card-title" id="threadName">Maria Santos</h2>
                  <div style="font-size:12px;color:var(--text-muted)" id="threadMeta">Science 205 · maria.santos@email.com</div>
                </div>
              </div>
              <div style="display:flex;gap:8px;">
                <button type="button" class="icon-btn" id="threadArchiveBtn" aria-label="Archive"><i data-lucide="archive"></i></button>
                <button type="button" class="icon-btn" id="threadDeleteBtn" aria-label="Delete"><i data-lucide="trash-2"></i></button>
              </div>
            </div>

            <div id="threadMessages" style="flex:1;overflow-y:auto;padding:20px 0;display:flex;flex-direction:column;gap:16px;">
              <div class="thread-msg received" style="align-self:flex-start;max-width:75%;">
                <div style="background:var(--page-bg);padding:12px 16px;border-radius:12px 12px 12px 4px;">
                  <p style="font-size:13.5px;color:var(--text-body);margin-bottom:4px;">Good morning, Sir! I hope you're doing well.</p>
                  <p style="font-size:13.5px;color:var(--text-body);">Sir, can I request an extension for the lab report? I had some issues with the experiment data and need a couple more days to complete it properly.</p>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:right">10:32 AM</div>
                </div>
              </div>
              <div class="thread-msg sent" style="align-self:flex-end;max-width:75%;">
                <div style="background:var(--primary);color:#fff;padding:12px 16px;border-radius:12px 12px 4px 12px;">
                  <p style="font-size:13.5px;margin-bottom:4px;">Hi Maria, thanks for reaching out.</p>
                  <p style="font-size:13.5px;">I'll grant you a 2-day extension. Please submit by Sep 16. Make sure to include your raw data in the appendix.</p>
                  <div style="font-size:11px;opacity:0.8;margin-top:8px;text-align:right">10:45 AM</div>
                </div>
              </div>
              <div class="thread-msg received" style="align-self:flex-start;max-width:75%;">
                <div style="background:var(--page-bg);padding:12px 16px;border-radius:12px 12px 12px 4px;">
                  <p style="font-size:13.5px;color:var(--text-body);">Thank you so much, Sir! I'll make sure to include everything. 🙏</p>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:right">10:48 AM</div>
                </div>
              </div>
            </div>

            <div id="threadReply" style="border-top:1px solid var(--border);padding-top:16px;">
              <form id="replyForm" class="message-reply-form">
                <div class="form-group message-reply-field">
                  <textarea class="form-control" id="replyInput" placeholder="Type your reply..." rows="2" style="min-height:44px;resize:none"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" id="sendReplyBtn">
                  <i data-lucide="send"></i> Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Compose Modal -->
  <div class="modal-backdrop" id="composeModal">
    <div class="modal">
      <div class="modal-header">
        <h3>New Message</h3>
        <button type="button" class="modal-close" data-close-modal="composeModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="composeForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="composeTo">To</label>
            <select class="form-control" id="composeTo" required>
              <option value="">Select student</option>
            </select>
            <p class="subtitle" id="composeRecipientEmail" role="status" aria-live="polite" hidden></p>
          </div>
          <div class="form-group">
            <label for="composeClass">Class (optional)</label>
            <select class="form-control" id="composeClass">
              <option value="">Select class</option>
            </select>
          </div>
          <div class="form-group">
            <label for="composeSubject">Subject</label>
            <input class="form-control" type="text" id="composeSubject" placeholder="Message subject" />
          </div>
          <div class="form-group">
            <label for="composeBody">Message</label>
            <textarea class="form-control" id="composeBody" placeholder="Write your message..." required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="composeModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="sendComposeBtn">
            <i data-lucide="send"></i> Send Message
          </button>
        </div>
      </form>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/teacher-messages.js"></script>
</body>
</html>
