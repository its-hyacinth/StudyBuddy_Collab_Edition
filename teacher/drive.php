<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — My Files</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body data-role="teacher">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="hard-drive"></i></span>
            My Files
          </h1>
          <p class="page-subtitle">Upload and organize study files saved to your StudyBuddy account.</p>
        </div>
        <button type="button" class="btn btn-primary" id="uploadFileBtn">
          <i data-lucide="upload"></i> Upload
        </button>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="filter-tabs" id="driveTabs" role="tablist">
            <button type="button" class="filter-tab active" data-tab="my-drive">My Drive</button>
            <button type="button" class="filter-tab" data-tab="shared">Shared with me</button>
            <button type="button" class="filter-tab" data-tab="recent">Recent</button>
            <button type="button" class="filter-tab" data-tab="starred">Starred</button>
            <button type="button" class="filter-tab" data-tab="trash">Trash</button>
          </div>

          <div class="card">
            <div class="toolbar">
              <div class="search-mini">
                <i data-lucide="search"></i>
                <input type="search" id="driveSearch" placeholder="Search files and folders..." />
              </div>
              <button type="button" class="btn btn-ghost btn-sm" id="newFolderBtn">
                <i data-lucide="folder-plus"></i> New Folder
              </button>
            </div>

            <nav class="breadcrumb" id="driveBreadcrumb" aria-label="Breadcrumb">
              <a href="#" data-folder="">My Drive</a>
              <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
              <span class="current">All Files</span>
            </nav>

            <div class="table-wrap">
              <table class="data-table" id="driveTable">
                <thead>
                  <tr>
                    <th scope="col">
                      <label class="custom-check">
                        <input type="checkbox" id="driveSelectAll" aria-label="Select all files on this page" />
                        <span class="box"></span>
                      </label>
                    </th>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Last Modified</th>
                    <th>Size</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr data-id="drv_1" data-type="folder">
                    <td><label class="custom-check"><input type="checkbox" aria-label="Select Mathematics folder" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="file-icon folder"><i data-lucide="folder"></i></div>
                        <div><div class="title">Mathematics</div></div>
                      </div>
                    </td>
                    <td>Me</td>
                    <td>Sep 10, 2025</td>
                    <td>—</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="drv_2" data-type="folder">
                    <td><label class="custom-check"><input type="checkbox" aria-label="Select Science Labs folder" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="file-icon folder"><i data-lucide="folder"></i></div>
                        <div><div class="title">Science Labs</div></div>
                      </div>
                    </td>
                    <td>Me</td>
                    <td>Sep 8, 2025</td>
                    <td>—</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="drv_3" data-type="doc">
                    <td><label class="custom-check"><input type="checkbox" aria-label="Select Algebra Notes.docx" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="file-icon doc"><i data-lucide="file-text"></i></div>
                        <div><div class="title">Algebra Notes.docx</div></div>
                      </div>
                    </td>
                    <td>Me</td>
                    <td>Sep 11, 2025</td>
                    <td>245 KB</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="drv_4" data-type="sheet">
                    <td><label class="custom-check"><input type="checkbox" aria-label="Select Lab Report Template.xlsx" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="file-icon sheet"><i data-lucide="table"></i></div>
                        <div><div class="title">Lab Report Template.xlsx</div></div>
                      </div>
                    </td>
                    <td>Me</td>
                    <td>Sep 9, 2025</td>
                    <td>88 KB</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="drv_5" data-type="slide">
                    <td><label class="custom-check"><input type="checkbox" aria-label="Select Project Presentation.pptx" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="file-icon slide"><i data-lucide="presentation"></i></div>
                        <div><div class="title">Project Presentation.pptx</div></div>
                      </div>
                    </td>
                    <td>Me</td>
                    <td>Sep 7, 2025</td>
                    <td>1.8 MB</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="drv_6" data-type="pdf" data-shared="true">
                    <td><label class="custom-check"><input type="checkbox" aria-label="Select Syllabus.pdf" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="file-icon pdf"><i data-lucide="file"></i></div>
                        <div>
                          <div class="title">Syllabus.pdf</div>
                          <div class="subtitle">Shared by Prof. Santos</div>
                        </div>
                      </div>
                    </td>
                    <td>Prof. Santos</td>
                    <td>Aug 20, 2025</td>
                    <td>420 KB</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="drv_9" data-type="pdf">
                    <td><label class="custom-check"><input type="checkbox" aria-label="Select Study Schedule.pdf" /><span class="box"></span></label></td>
                    <td>
                      <div class="cell-title">
                        <div class="file-icon pdf"><i data-lucide="file"></i></div>
                        <div><div class="title">Study Schedule.pdf</div></div>
                      </div>
                    </td>
                    <td>Me</td>
                    <td>Sep 12, 2025</td>
                    <td>156 KB</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="pagination" id="drivePagination">
              <div class="pagination-info">Showing 7 files</div>
            </div>
          </div>
        </div>

        <aside class="page-aside">
          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon blue"><i data-lucide="hard-drive"></i></div>
                <h2 class="card-title">Storage</h2>
              </div>
            </div>
            <div id="storageDonut">
              <div class="donut-wrap">
                <div class="donut">
                  <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="none" stroke="#E2E8F0" stroke-width="10"/><circle cx="50" cy="50" r="36" fill="none" stroke="#2563EB" stroke-width="10" stroke-dasharray="226.2" stroke-dashoffset="149.3" stroke-linecap="round"/></svg>
                  <div class="center-label">34%<small>Used</small></div>
                </div>
                <div>
                  <div style="font-size:13px;color:var(--text-body);margin-bottom:8px">34.2 GB of 50 GB used</div>
                  <div class="storage-legend">
                    <div class="storage-legend-row">
                      <div class="sl-left"><span class="dot" style="background:#2563EB"></span> Documents</div>
                      <div class="sl-val">12.4 GB</div>
                    </div>
                    <div class="storage-legend-row">
                      <div class="sl-left"><span class="dot" style="background:#16A34A"></span> Images</div>
                      <div class="sl-val">8.1 GB</div>
                    </div>
                    <div class="storage-legend-row">
                      <div class="sl-left"><span class="dot" style="background:#EA580C"></span> Other</div>
                      <div class="sl-val">13.7 GB</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card" id="recentFilesAside">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon purple"><i data-lucide="clock"></i></div>
                <h2 class="card-title">Recent Files</h2>
              </div>
            </div>
            <div id="recentFilesList">
              <div class="list-item">
                <div class="file-icon pdf" style="width:32px;height:32px"><i data-lucide="file"></i></div>
                <div class="item-meta">
                  <div class="item-title">Study Schedule.pdf</div>
                  <div class="item-sub">Sep 12 · 156 KB</div>
                </div>
              </div>
              <div class="list-item">
                <div class="file-icon doc" style="width:32px;height:32px"><i data-lucide="file-text"></i></div>
                <div class="item-meta">
                  <div class="item-title">Algebra Notes.docx</div>
                  <div class="item-sub">Sep 11 · 245 KB</div>
                </div>
              </div>
              <div class="list-item">
                <div class="file-icon sheet" style="width:32px;height:32px"><i data-lucide="table"></i></div>
                <div class="item-meta">
                  <div class="item-title">Lab Report Template.xlsx</div>
                  <div class="item-sub">Sep 9 · 88 KB</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="zap"></i></div>
                <h2 class="card-title">Quick Actions</h2>
              </div>
            </div>
            <div class="qa-grid">
              <button type="button" class="qa-btn blue" id="qaUploadBtn" data-action="upload">
                <i data-lucide="upload"></i> Upload
              </button>
              <button type="button" class="qa-btn green" id="qaNewFolderBtn" data-action="new-folder">
                <i data-lucide="folder-plus"></i> New Folder
              </button>
              <button type="button" class="qa-btn purple" id="openGoogleDriveBtn" data-action="open-drive">
                <i data-lucide="external-link"></i> Open in Google Drive
              </button>
              <button type="button" class="qa-btn orange" id="shareLinkBtn" data-action="share-link">
                <i data-lucide="link"></i> Copy Selected Link
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="uploadModal">
    <div class="modal" role="dialog" aria-labelledby="uploadTitle">
      <div class="modal-header">
        <h3 id="uploadTitle">Upload File</h3>
        <button type="button" class="modal-close" data-close-modal="uploadModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="uploadForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="uploadFile">Choose File</label>
            <input type="file" class="form-control" id="uploadFile" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" multiple required style="height:auto;padding:10px" />
          </div>
          <div class="form-group">
            <label for="uploadFolder">Destination Folder</label>
            <select class="form-control" id="uploadFolder" name="folder">
              <option value="">My Drive (root)</option>
              <option value="drv_1">Mathematics</option>
              <option value="drv_2">Science Labs</option>
              <option value="drv_8">English Essays</option>
              <option value="drv_10">CS Project Code</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="uploadModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Upload</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="newFolderModal">
    <div class="modal" role="dialog" aria-labelledby="newFolderTitle">
      <div class="modal-header">
        <h3 id="newFolderTitle">New Folder</h3>
        <button type="button" class="modal-close" data-close-modal="newFolderModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="newFolderForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="folderName">Folder Name</label>
            <input type="text" class="form-control" id="folderName" name="name" placeholder="e.g. Project Files" required />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="newFolderModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Folder</button>
        </div>
      </form>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/drive.js"></script>
</body>
</html>
