<?php $expectedRole = 'teacher'; require_once __DIR__ . '/../includes/page_guard.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudyBuddy — Resources</title>
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="teacher-resources-page">
  <div class="app-shell" id="appShell">
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon"><i data-lucide="folder-open"></i></span>
            Resources
          </h1>
          <p class="page-subtitle">Upload and share learning materials with your classes.</p>
        </div>
      </div>

      <div class="stat-grid" id="resourceStats">
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="files"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total Resources</div>
            <div class="stat-value" id="statTotalResources">5</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +2 this month</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i data-lucide="download"></i></div>
          <div class="stat-body">
            <div class="stat-label">Total Downloads</div>
            <div class="stat-value" id="statDownloads">248</div>
            <div class="stat-delta up"><i data-lucide="trending-up"></i> +32 this week</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i data-lucide="hard-drive"></i></div>
          <div class="stat-body">
            <div class="stat-label">Storage Used</div>
            <div class="stat-value" id="statStorage">7.7 MB</div>
            <div class="stat-delta up"><i data-lucide="info"></i> Of 50 MB limit</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i data-lucide="share-2"></i></div>
          <div class="stat-body">
            <div class="stat-label">Shared with Classes</div>
            <div class="stat-value" id="statShared">5</div>
            <div class="stat-delta up"><i data-lucide="check"></i> All classes covered</div>
          </div>
        </div>
      </div>

      <div class="page-layout">
        <div class="page-main">
          <div class="toolbar">
            <div class="search-mini">
              <i data-lucide="search"></i>
              <input type="search" id="resourceSearch" placeholder="Search resources..." />
            </div>
            <select id="resourceClassFilter" aria-label="Filter by class">
              <option value="">All Classes</option>
              <option value="Math 101">Math 101</option>
              <option value="Science 205">Science 205</option>
              <option value="English 101">English 101</option>
              <option value="CS 308">CS 308</option>
              <option value="Filipino 101">Filipino 101</option>
            </select>
            <select id="resourceTypeFilter" aria-label="Filter by type">
              <option value="">All Types</option>
              <option value="pdf">PDF</option>
              <option value="doc">Document</option>
              <option value="slide">Slides</option>
              <option value="zip">Archive</option>
              <option value="link">Drive Link</option>
              <option value="folder">Folder</option>
            </select>
          </div>

          <div class="card">
            <div class="resource-folder-header">
              <div class="resource-folder-path">
                <button type="button" class="btn btn-ghost btn-sm resource-folder-back" id="resourceFolderBack" aria-label="Go to parent folder">
                  <i data-lucide="arrow-left"></i> Back
                </button>
                <nav class="breadcrumb" id="resourceBreadcrumb" aria-label="Resource folder location"></nav>
                <span class="resource-folder-count" id="resourceFolderCount"></span>
              </div>
              <div class="resource-folder-actions">
                <button type="button" class="btn btn-primary btn-sm" id="uploadResourceBtn">
                  <i data-lucide="upload"></i> Upload Resource
                </button>
                <button type="button" class="btn btn-ghost btn-sm" id="resourceNewFolderBtn">
                  <i data-lucide="folder-plus"></i> New folder
                </button>
              </div>
            </div>
            <p class="resource-folder-hint">Click a row or Open to view it. Use the three-dot menu for Details or Delete; drag a row onto a folder to move it.</p>
            <div class="table-wrap">
              <table class="data-table" id="resourcesTable">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Class</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Downloads</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="resourcesTableBody">
                  <tr data-id="res_1" data-class="Math 101" data-type="pdf">
                    <td>
                      <div class="cell-title">
                        <div class="file-icon pdf"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">Algebra Formula Sheet</div>
                          <div class="subtitle">Reference material for quizzes</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag math"><span class="dot math"></span> Math 101</span></td>
                    <td><span class="badge badge-info">PDF</span></td>
                    <td>1.2 MB</td>
                    <td>Sep 1, 2025</td>
                    <td>64</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="download"></i> Download</button>
                          <button type="button"><i data-lucide="share-2"></i> Share</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="res_2" data-class="Science 205" data-type="pdf">
                    <td>
                      <div class="cell-title">
                        <div class="file-icon pdf"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">Lab Safety Guidelines</div>
                          <div class="subtitle">Required reading before lab sessions</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag science"><span class="dot science"></span> Science 205</span></td>
                    <td><span class="badge badge-info">PDF</span></td>
                    <td>840 KB</td>
                    <td>Aug 28, 2025</td>
                    <td>52</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="download"></i> Download</button>
                          <button type="button"><i data-lucide="share-2"></i> Share</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="res_3" data-class="English 101" data-type="doc">
                    <td>
                      <div class="cell-title">
                        <div class="file-icon doc"><i data-lucide="file-text"></i></div>
                        <div>
                          <div class="title">Essay Rubric</div>
                          <div class="subtitle">Grading criteria for essays</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag english"><span class="dot english"></span> English 101</span></td>
                    <td><span class="badge badge-upcoming">DOC</span></td>
                    <td>120 KB</td>
                    <td>Sep 5, 2025</td>
                    <td>38</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="download"></i> Download</button>
                          <button type="button"><i data-lucide="share-2"></i> Share</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="res_4" data-class="CS 308" data-type="zip">
                    <td>
                      <div class="cell-title">
                        <div class="file-icon folder"><i data-lucide="archive"></i></div>
                        <div>
                          <div class="title">Python Starter Kit</div>
                          <div class="subtitle">Starter code and templates</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag cs"><span class="dot cs"></span> CS 308</span></td>
                    <td><span class="badge badge-pending">ZIP</span></td>
                    <td>3.4 MB</td>
                    <td>Sep 3, 2025</td>
                    <td>45</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="download"></i> Download</button>
                          <button type="button"><i data-lucide="share-2"></i> Share</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr data-id="res_5" data-class="Filipino 101" data-type="slide">
                    <td>
                      <div class="cell-title">
                        <div class="file-icon slide"><i data-lucide="presentation"></i></div>
                        <div>
                          <div class="title">Lecture Slides Week 3</div>
                          <div class="subtitle">Panitikang Filipino</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="subject-tag filipino"><span class="dot filipino"></span> Filipino 101</span></td>
                    <td><span class="badge badge-overdue">SLIDES</span></td>
                    <td>2.1 MB</td>
                    <td>Sep 8, 2025</td>
                    <td>49</td>
                    <td>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-menu-btn" aria-label="Actions"><i data-lucide="more-horizontal"></i></button>
                        <div class="action-dropdown">
                          <button type="button"><i data-lucide="download"></i> Download</button>
                          <button type="button"><i data-lucide="share-2"></i> Share</button>
                          <button type="button"><i data-lucide="edit"></i> Edit</button>
                          <button type="button" class="danger"><i data-lucide="trash-2"></i> Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
            <div id="storageOverview">
              <div class="progress-row" style="margin-bottom:8px;">
                <div class="progress-bar"><div class="fill blue" style="width:15%"></div></div>
                <span class="progress-pct">15%</span>
              </div>
              <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:16px;">7.7 MB of 50 MB used</p>
              <div class="storage-legend">
                <div class="storage-legend-row">
                  <div class="sl-left"><span class="dot math"></span> PDFs</div>
                  <span class="sl-val">2.0 MB</span>
                </div>
                <div class="storage-legend-row">
                  <div class="sl-left"><span class="dot cs"></span> Archives</div>
                  <span class="sl-val">3.4 MB</span>
                </div>
                <div class="storage-legend-row">
                  <div class="sl-left"><span class="dot english"></span> Slides & Docs</div>
                  <span class="sl-val">2.3 MB</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon green"><i data-lucide="trending-up"></i></div>
                <h2 class="card-title">Most Downloaded</h2>
              </div>
            </div>
            <div id="topResources">
              <div class="list-item">
                <div class="file-icon pdf" style="width:32px;height:32px"><i data-lucide="file-text"></i></div>
                <div class="item-meta">
                  <div class="item-title">Algebra Formula Sheet</div>
                  <div class="item-sub">64 downloads</div>
                </div>
              </div>
              <div class="list-item">
                <div class="file-icon slide" style="width:32px;height:32px"><i data-lucide="presentation"></i></div>
                <div class="item-meta">
                  <div class="item-title">Lecture Slides Week 3</div>
                  <div class="item-sub">49 downloads</div>
                </div>
              </div>
              <div class="list-item">
                <div class="file-icon folder" style="width:32px;height:32px"><i data-lucide="archive"></i></div>
                <div class="item-meta">
                  <div class="item-title">Python Starter Kit</div>
                  <div class="item-sub">45 downloads</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon purple"><i data-lucide="zap"></i></div>
                <h2 class="card-title">Quick Actions</h2>
              </div>
            </div>
            <div class="qa-grid">
              <button type="button" class="qa-btn blue" id="qaUpload"><i data-lucide="upload"></i> Upload File</button>
              <button type="button" class="qa-btn green" id="qaLinkDrive"><i data-lucide="hard-drive"></i> From Drive</button>
              <button type="button" class="qa-btn purple" id="qaCreateFolder"><i data-lucide="folder-plus"></i> New Folder</button>
              <button type="button" class="qa-btn orange" id="qaShareAll"><i data-lucide="share-2"></i> Share All</button>
            </div>
          </div>

          <div class="tip-card">
            <div class="tip-icon"><i data-lucide="lightbulb"></i></div>
            <p>"Organize resources by week or unit — students find materials faster when folders mirror your syllabus."</p>
            <div class="tip-footer"><i data-lucide="sparkles"></i> Resource tip</div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="resourceDetailsModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="resourceDetailsTitle">
      <div class="modal-header">
        <h3 id="resourceDetailsTitle">Resource details</h3>
        <button type="button" class="modal-close" data-close-modal="resourceDetailsModal" aria-label="Close details">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <p class="form-hint" id="resourceDetailsHint">Details for this resource.</p>
        <div id="resourceDetailsContent"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" data-close-modal="resourceDetailsModal">Close</button>
        <button type="button" class="btn btn-primary" id="resourceDetailsOpenBtn">Open resource</button>
      </div>
    </div>
  </div>

  <!-- Upload Resource Modal -->
  <div class="modal-backdrop" id="uploadResourceModal">
    <div class="modal">
      <div class="modal-header">
        <h3>Upload Resource</h3>
        <button type="button" class="modal-close" data-close-modal="uploadResourceModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="uploadResourceForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="resourceTitle">Title</label>
            <input class="form-control" type="text" id="resourceTitle" placeholder="Resource title" required />
          </div>
          <div class="form-group">
            <label for="resourceClass">Class</label>
            <select class="form-control" id="resourceClass" required>
              <option value="">Select class</option>
              <option value="Math 101">Math 101</option>
              <option value="Science 205">Science 205</option>
              <option value="English 101">English 101</option>
              <option value="CS 308">CS 308</option>
              <option value="Filipino 101">Filipino 101</option>
            </select>
          </div>
          <div class="form-group">
            <label for="resourceFile">File</label>
            <input class="form-control" type="file" id="resourceFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg" required />
          </div>
          <div class="form-group">
            <label for="resourceFolder">Folder (optional)</label>
            <select class="form-control" id="resourceFolder">
              <option value="">All resources</option>
            </select>
          </div>
          <div class="form-group">
            <label for="resourceDescription">Description (optional)</label>
            <textarea class="form-control" id="resourceDescription" placeholder="Brief description of this resource..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="uploadResourceModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveResourceBtn">
            <i data-lucide="upload"></i> Upload
          </button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="driveResourceModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="driveResourceTitle">
      <div class="modal-header">
        <h3 id="driveResourceTitle">Add from Google Drive</h3>
        <button type="button" class="modal-close" data-close-modal="driveResourceModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="driveResourceForm">
        <div class="modal-body">
          <p class="form-hint">Paste a share link from Google Drive. The file's Drive sharing settings must allow your students to open it.</p>
          <div class="form-group">
            <label for="driveResourceName">Resource title</label>
            <input class="form-control" type="text" id="driveResourceName" required />
          </div>
          <div class="form-group">
            <label for="driveResourceClass">Class</label>
            <select class="form-control" id="driveResourceClass" required>
              <option value="">Select class</option>
            </select>
          </div>
          <div class="form-group">
            <label for="driveResourceUrl">Google Drive link</label>
            <input class="form-control" type="url" id="driveResourceUrl" placeholder="https://drive.google.com/..." required />
          </div>
          <div class="form-group">
            <label for="driveResourceFolder">Folder (optional)</label>
            <select class="form-control" id="driveResourceFolder">
              <option value="">All resources</option>
            </select>
          </div>
          <div class="form-group">
            <label for="driveResourceDescription">Description (optional)</label>
            <textarea class="form-control" id="driveResourceDescription"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="driveResourceModal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveDriveResourceBtn">Add resource</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="newResourceFolderModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="newResourceFolderTitle">
      <div class="modal-header">
        <h3 id="newResourceFolderTitle">Create resource folder</h3>
        <button type="button" class="modal-close" data-close-modal="newResourceFolderModal" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <form id="newResourceFolderForm">
        <div class="modal-body">
          <div class="form-group">
            <label for="newResourceFolderName">Folder name</label>
            <input class="form-control" type="text" id="newResourceFolderName" maxlength="120" required />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close-modal="newResourceFolderModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Create folder</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="shareAllResourcesModal">
    <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="shareAllResourcesTitle" aria-describedby="shareAllResourcesDescription">
      <div class="modal-header">
        <h3 id="shareAllResourcesTitle">Share all resources?</h3>
        <button type="button" class="modal-close" data-close-modal="shareAllResourcesModal" aria-label="Cancel sharing">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <p id="shareAllResourcesDescription">Resources with an attached file or Drive link will be visible to enrolled students whose account email matches a class roster.</p>
        <p id="shareAllResourcesCount" class="form-hint"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" data-close-modal="shareAllResourcesModal">Cancel</button>
        <button type="button" class="btn btn-primary" id="confirmShareAllResourcesBtn">Share all</button>
      </div>
    </div>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="../js/google-integration.js"></script>
  <script src="../js/teacher-resources.js"></script>
</body>
</html>
