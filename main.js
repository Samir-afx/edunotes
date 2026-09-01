/**
 * ============================================================================
 * EDUNOTES — MASTER CLIENT APPLICATION CONTROLLER
 * Handles Authentication, View Routing, MAKAUT Syllabus Rendering,
 * Community Notes, Q&A, Chat, Progress Tracking, and Moderation.
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const authDb = window.EduNotesAuthDB;
  const syllabusData = window.MAKAUT_SYLLABUS;

  if (!authDb || !syllabusData) {
    console.error('EduNotes Core Modules (AuthDB or Syllabus) failed to initialize.');
    return;
  }

  // State
  let currentActiveView = 'dashboard';
  let currentSyllabusTab = 'sem1';
  let currentNotesSort = 'popular';
  let currentNotesSubject = 'all';
  let currentNotesCategory = 'all';
  let currentGlobalSearch = '';
  let activeChatChannel = 'general';
  let pendingDuplicateUpload = null;
  let pendingDuplicateFile = null;
  let pdfCurrentPage = 1;
  let pdfTotalPages = 68;

  // DOM Elements - Views
  const authPortalView = document.getElementById('auth-portal-view');
  const authenticatedAppView = document.getElementById('authenticated-app-view');

  // Modals
  const uploadModal = document.getElementById('modal-upload-backdrop');
  const duplicateModal = document.getElementById('modal-duplicate-backdrop');
  const detailModal = document.getElementById('modal-detail-backdrop');
  const editModal = document.getElementById('modal-edit-backdrop');
  const reportModal = document.getElementById('modal-report-backdrop');
  const askModal = document.getElementById('modal-ask-backdrop');
  const pdfModal = document.getElementById('modal-pdf-backdrop');

  // Dropzone Elements
  const fileDropzone = document.getElementById('file-dropzone');
  const noteFileInput = document.getElementById('note-file-input');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const selectedFilePill = document.getElementById('selected-file-pill');
  const selectedFileName = document.getElementById('selected-file-name');
  const selectedFileSize = document.getElementById('selected-file-size');
  const btnRemoveFile = document.getElementById('btn-remove-file');

  // User Dropdown
  const userProfileTrigger = document.getElementById('user-profile-menu-trigger');
  const userDropdownMenu = document.getElementById('user-dropdown-menu');
  const btnUserLogout = document.getElementById('btn-user-logout');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION & ROUTE GUARD (Phases 2, 6, 9 & 41)
  // --------------------------------------------------------------------------
  function checkAuthAndRoute() {
    if (!authDb.isAuthenticated()) {
      authPortalView.style.display = 'flex';
      authenticatedAppView.style.display = 'none';
      return;
    }

    authPortalView.style.display = 'none';
    authenticatedAppView.style.display = 'block';

    updateHeaderUserProfile();
    handleViewRouting();
  }

  function updateHeaderUserProfile() {
    const user = authDb.getCurrentUser();
    if (!user) return;

    const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';

    // Nav elements
    const navAvatar = document.getElementById('nav-user-avatar');
    const navName = document.getElementById('nav-user-name');
    const navRole = document.getElementById('nav-user-role');
    if (navAvatar) {
      navAvatar.textContent = initials;
      navAvatar.style.background = user.avatarGradient || 'linear-gradient(135deg, #3b82f6, #06b6d4)';
    }
    if (navName) navName.textContent = user.fullName;
    if (navRole) navRole.textContent = user.role === 'ADMIN' ? 'Dean (Admin)' : (user.role === 'MODERATOR' ? 'Faculty Moderator' : 'Student');

    // Dropdown elements
    const ddName = document.getElementById('dropdown-full-name');
    const ddEmail = document.getElementById('dropdown-email');
    const ddMeta = document.getElementById('dropdown-college-branch');
    if (ddName) ddName.textContent = user.fullName;
    if (ddEmail) ddEmail.textContent = user.email;
    if (ddMeta) ddMeta.textContent = `${user.college || 'MAKAUT'} · ${user.branch || 'CSE'} (${user.semester || 'Sem I'})`;

    // Welcome Header
    const welcomeName = document.getElementById('dash-welcome-name');
    if (welcomeName) welcomeName.textContent = user.fullName ? user.fullName.split(' ')[0] : 'Student';

    // Profile & My Uploads header
    const myAvatarLg = document.getElementById('my-profile-avatar-lg');
    const myFullName = document.getElementById('my-profile-full-name');
    const myRolePill = document.getElementById('my-profile-role-pill');
    const myCollegeLine = document.getElementById('my-profile-college-line');
    if (myAvatarLg) {
      myAvatarLg.textContent = initials;
      myAvatarLg.style.background = user.avatarGradient || 'linear-gradient(135deg, #3b82f6, #06b6d4)';
    }
    if (myFullName) myFullName.textContent = `${user.fullName} (${user.studentId || 'Verified'})`;
    if (myRolePill) myRolePill.textContent = user.role === 'ADMIN' ? 'Academic Dean' : (user.role === 'MODERATOR' ? 'Faculty Moderator' : 'Verified Student');
    if (myCollegeLine) myCollegeLine.textContent = `${user.college || 'MAKAUT'} · ${user.branch || 'CSE'} (${user.semester || 'Sem I'})`;

    // Admin-only nav item toggle
    document.querySelectorAll('.role-admin-only').forEach((el) => {
      el.style.display = ['ADMIN', 'MODERATOR'].includes(user.role) ? 'flex' : 'none';
    });
  }

  // --------------------------------------------------------------------------
  // 2. VIEW ROUTING MANAGER (Single-Page Seamless Navigation)
  // --------------------------------------------------------------------------
  async function navigateTo(viewName) {
    if (!authDb.isAuthenticated()) {
      checkAuthAndRoute();
      return;
    }

    // Role-protection for Admin Panel
    if (viewName === 'admin-panel') {
      const user = authDb.getCurrentUser();
      if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
        showToast('Access Denied: Administration privileges required.');
        navigateTo('dashboard');
        return;
      }
    }

    currentActiveView = viewName;
    window.location.hash = `#${viewName}`;

    // Hide all view sections
    document.querySelectorAll('.app-view-section').forEach((sec) => {
      sec.style.display = 'none';
    });

    // Show target section
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.style.display = 'block';
    } else {
      document.getElementById('view-dashboard').style.display = 'block';
    }

    // Update active nav link
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      }
    });

    // Render corresponding view data
    if (viewName === 'dashboard') await renderDashboardView();
    else if (viewName === 'syllabus') renderSyllabusView();
    else if (viewName === 'notes') await renderNotesView();
    else if (viewName === 'pyqs') renderQuestionsView();
    else if (viewName === 'chat') renderChatView();
    else if (viewName === 'my-uploads') await renderMyUploadsView();
    else if (viewName === 'progress') renderProgressView();
    else if (viewName === 'bookmarks') await renderBookmarksView();
    else if (viewName === 'admin-panel') renderAdminView();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleViewRouting() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  }

  window.addEventListener('hashchange', () => {
    if (authDb.isAuthenticated()) {
      handleViewRouting();
    } else {
      checkAuthAndRoute();
    }
  });

  // Attach data-view clicks
  document.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const v = el.getAttribute('data-view');
      if (userDropdownMenu) userDropdownMenu.style.display = 'none';
      navigateTo(v);
    });
  });

  // --------------------------------------------------------------------------
  // 3. AUTHENTICATION FORMS (Login, Signup, Forgot Password)
  // --------------------------------------------------------------------------
  const tabBtnLogin = document.getElementById('tab-btn-login');
  const tabBtnSignup = document.getElementById('tab-btn-signup');
  const tabBtnForgot = document.getElementById('tab-btn-forgot');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotForm = document.getElementById('forgot-form');

  function switchAuthTab(tab) {
    [tabBtnLogin, tabBtnSignup, tabBtnForgot].forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    [loginForm, signupForm, forgotForm].forEach(f => f.style.display = 'none');

    if (tab === 'login') {
      tabBtnLogin.classList.add('active');
      tabBtnLogin.setAttribute('aria-selected', 'true');
      loginForm.style.display = 'block';
    } else if (tab === 'signup') {
      tabBtnSignup.classList.add('active');
      tabBtnSignup.setAttribute('aria-selected', 'true');
      signupForm.style.display = 'block';
    } else if (tab === 'forgot') {
      tabBtnForgot.classList.add('active');
      tabBtnForgot.setAttribute('aria-selected', 'true');
      forgotForm.style.display = 'block';
    }
  }

  if (tabBtnLogin) tabBtnLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabBtnSignup) tabBtnSignup.addEventListener('click', () => switchAuthTab('signup'));
  if (tabBtnForgot) tabBtnForgot.addEventListener('click', () => switchAuthTab('forgot'));
  document.getElementById('link-goto-forgot').addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('forgot'); });

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const errBox = document.getElementById('login-error-box');
      const submitBtn = document.getElementById('btn-login-submit');

      try {
        errBox.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Signing In...</span>';
        }

        const user = await authDb.login(email, pass);
        showToast(`✓ Welcome back, ${user.fullName}!`);
        checkAuthAndRoute();
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In to Dashboard</span><i data-lucide="arrow-right"></i>';
          if (window.lucide) lucide.createIcons();
        }
      }
    });
  }

  // Signup Submit
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signup-fullname').value;
      const studentId = document.getElementById('signup-roll').value;
      const email = document.getElementById('signup-email').value;
      const college = document.getElementById('signup-college').value;
      const semester = document.getElementById('signup-semester').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const errBox = document.getElementById('signup-error-box');
      const submitBtn = document.getElementById('btn-signup-submit');

      if (password !== confirmPassword) {
        errBox.textContent = 'Passwords do not match.';
        errBox.style.display = 'block';
        return;
      }

      try {
        errBox.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Creating Account...</span>';
        }

        const user = await authDb.signup({ fullName, studentId, email, college, semester, password });
        showToast(`🎉 Account created! Welcome, ${user.fullName}.`);
        checkAuthAndRoute();
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="user-plus"></i><span>Create Student Account</span>';
          if (window.lucide) lucide.createIcons();
        }
      }
    });
  }

  // Forgot Password Submit
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;
      const succBox = document.getElementById('forgot-success-box');
      const errBox = document.getElementById('forgot-error-box');

      try {
        errBox.style.display = 'none';
        await authDb.resetPassword(email);
        succBox.textContent = `A password reset link has been dispatched to ${email}.`;
        succBox.style.display = 'block';
      } catch (err) {
        succBox.style.display = 'none';
        errBox.textContent = err.message;
        errBox.style.display = 'block';
      }
    });
  }

  // User Profile Dropdown Toggle & Logout
  if (userProfileTrigger && userDropdownMenu) {
    userProfileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = userDropdownMenu.style.display === 'block';
      userDropdownMenu.style.display = isExpanded ? 'none' : 'block';
      userProfileTrigger.setAttribute('aria-expanded', !isExpanded);
    });
    document.addEventListener('click', () => {
      userDropdownMenu.style.display = 'none';
      userProfileTrigger.setAttribute('aria-expanded', 'false');
    });
  }

  if (btnUserLogout) {
    btnUserLogout.addEventListener('click', async () => {
      await authDb.logout();
      showToast('Logged out successfully.');
      checkAuthAndRoute();
    });
  }

  // Theme Toggle
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      if (isDark) {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('theme-icon-sun').style.display = 'block';
        document.getElementById('theme-icon-moon').style.display = 'none';
      } else {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('theme-icon-sun').style.display = 'none';
        document.getElementById('theme-icon-moon').style.display = 'block';
      }
    });
  }

  // Password Visibility Toggle
  document.querySelectorAll('.btn-toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. RENDER DASHBOARD VIEW
  // --------------------------------------------------------------------------
  async function renderDashboardView() {
    const recentNotesList = document.getElementById('dash-recent-notes-list');
    const annList = document.getElementById('dash-announcements-list');
    const calList = document.getElementById('dash-calendar-list');

    // Recent Notes Feed
    if (recentNotesList) {
      const allNotes = await authDb.getAllNotesAsync();
      const notes = allNotes.slice(0, 4);

      if (notes.length === 0) {
        recentNotesList.innerHTML = `
          <div style="padding: 2rem; text-align: center; color: var(--text-dim);">
            <p>No notes have been shared yet. Be the first to upload!</p>
          </div>
        `;
      } else {
        recentNotesList.innerHTML = notes.map(note => {
          const initials = note.uploaderName ? note.uploaderName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'ST';
          return `
            <div class="dash-feed-item">
              <div class="feed-item-left">
                <div class="feed-item-avatar" style="background: ${note.uploaderAvatar || 'linear-gradient(135deg, #3b82f6, #06b6d4)'}">${initials}</div>
                <div class="feed-item-text">
                  <h4>${escapeHTML(note.title)}</h4>
                  <div class="feed-item-meta">
                    <span>${escapeHTML(note.subjectName)}</span> · 
                    <span>Uploaded by <strong>${escapeHTML(note.uploaderName)}</strong></span> · 
                    <span>📥 ${note.downloadsCount || 0}</span>
                  </div>
                </div>
              </div>
              <button class="btn btn-sm btn-outline btn-open-note-detail" data-id="${note.id}">
                <i data-lucide="eye"></i>
                <span>View</span>
              </button>
            </div>
          `;
        }).join('');
      }
    }

    // Announcements
    if (annList) {
      const announcements = authDb.getAnnouncements().slice(0, 3);
      annList.innerHTML = announcements.map(ann => `
        <div class="announcement-card ${ann.category === 'MAKAUT' ? 'makaut' : (ann.badgeType === 'URGENT' ? 'urgent' : '')}">
          <div class="ann-header">
            <span class="ann-tag">${escapeHTML(ann.badgeType)} · ${escapeHTML(ann.category)}</span>
            <span class="ann-time">${window.formatTimeAgo ? window.formatTimeAgo(ann.createdAt) : 'Recently'}</span>
          </div>
          <h4 class="ann-title">${escapeHTML(ann.title)}</h4>
          <p class="ann-content">${escapeHTML(ann.content)}</p>
        </div>
      `).join('');
    }

    // Calendar
    if (calList) {
      const events = authDb.getCalendarEvents();
      calList.innerHTML = events.map(ev => {
        const d = new Date(ev.eventDate);
        const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
        const day = d.getDate();
        return `
          <div class="cal-event-item">
            <div class="cal-date-badge">
              <div>${day}</div>
              <div style="font-size: 0.65rem;">${month}</div>
            </div>
            <div class="cal-event-info">
              <h5>${escapeHTML(ev.title)}</h5>
              <p>${escapeHTML(ev.courseCode)} · ${escapeHTML(ev.description)}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    calculateOverallProgress();

    if (window.lucide) lucide.createIcons();
    attachNoteActionListeners();
  }

  function calculateOverallProgress() {
    const user = authDb.getCurrentUser();
    if (!user) return;
    const progress = authDb.getUserProgress();
    const sem1Courses = syllabusData.semester1;

    let totalTopics = 0;
    let completedTopics = 0;

    sem1Courses.forEach(c => {
      if (c.modules) {
        c.modules.forEach(m => {
          totalTopics += m.topics.length;
        });
        const comp = (progress[c.id] || []).length;
        completedTopics += comp;
      }
    });

    const percent = totalTopics > 0 ? Math.min(100, Math.round((completedTopics / totalTopics) * 100)) : 0;
    const dashArc = document.getElementById('dash-progress-arc');
    const dashText = document.getElementById('dash-progress-text');
    if (dashArc) dashArc.setAttribute('stroke-dasharray', `${percent}, 100`);
    if (dashText) dashText.textContent = `${percent}%`;
  }

  // --------------------------------------------------------------------------
  // 5. RENDER MAKAUT SYLLABUS VIEW (sem126-details Source of Truth)
  // --------------------------------------------------------------------------
  function renderSyllabusView() {
    const content = document.getElementById('syllabus-tab-content');
    if (!content) return;

    if (currentSyllabusTab === 'sem1' || currentSyllabusTab === 'sem2') {
      const courses = currentSyllabusTab === 'sem1' ? syllabusData.semester1 : syllabusData.semester2;
      content.innerHTML = `
        <div class="syllabus-courses-grid">
          ${courses.map(course => createCourseSyllabusCardHTML(course)).join('')}
        </div>
      `;
    } else if (currentSyllabusTab === 'obe') {
      content.innerHTML = `
        <div class="obe-po-grid">
          ${syllabusData.programmeOutcomes.map(po => `
            <div class="po-card">
              <span class="po-code">${escapeHTML(po.code)}</span>
              <h4>${escapeHTML(po.title)}</h4>
              <p>${escapeHTML(po.desc)}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (currentSyllabusTab === 'bridge') {
      content.innerHTML = `
        <div class="obe-po-grid">
          ${syllabusData.bridgePrerequisites.map(b => `
            <div class="po-card">
              <span class="po-code">${escapeHTML(b.subject)}</span>
              <ul style="margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.4rem;">
                ${b.topics.map(t => `<li style="font-size: 0.88rem; color: var(--text-muted);"><i data-lucide="check" style="width: 14px; height: 14px; color: var(--accent-emerald);"></i> ${escapeHTML(t)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `;
    } else if (currentSyllabusTab === 'rotation') {
      content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <div class="po-card">
            <span class="po-code">Group A Branches</span>
            <p><strong>Departments:</strong> ${escapeHTML(syllabusData.groupRotation.groupA.branches)}</p>
            <div style="margin-top: 1rem;">
              <p><strong>Semester I Courses:</strong> ${escapeHTML(syllabusData.groupRotation.groupA.sem1)}</p>
              <p><strong>Semester II Courses:</strong> ${escapeHTML(syllabusData.groupRotation.groupA.sem2)}</p>
            </div>
          </div>
          <div class="po-card">
            <span class="po-code">Group B Branches</span>
            <p><strong>Departments:</strong> ${escapeHTML(syllabusData.groupRotation.groupB.branches)}</p>
            <div style="margin-top: 1rem;">
              <p><strong>Semester I Courses:</strong> ${escapeHTML(syllabusData.groupRotation.groupB.sem1)}</p>
              <p><strong>Semester II Courses:</strong> ${escapeHTML(syllabusData.groupRotation.groupB.sem2)}</p>
            </div>
          </div>
        </div>
      `;
    }

    if (window.lucide) lucide.createIcons();

    // Attach "Add Note to this Module / Topic" prefilled triggers
    document.querySelectorAll('.btn-add-note-to-topic').forEach(btn => {
      btn.addEventListener('click', () => {
        const subjId = btn.getAttribute('data-subject-id');
        const modName = btn.getAttribute('data-module');
        const topicName = btn.getAttribute('data-topic');
        openUploadModalPrefilled(subjId, modName, topicName);
      });
    });
  }

  function createCourseSyllabusCardHTML(course) {
    const isPractical = course.courseType === 'Practical';

    return `
      <div class="course-syllabus-card" id="course-${course.id}">
        <div class="course-header-row">
          <div>
            <span class="course-code-pill">${escapeHTML(course.code)}</span>
            <h3 class="course-title">${escapeHTML(course.name)}</h3>
          </div>
          <div class="course-meta-tags">
            <span class="meta-tag">Credits: ${course.credits}</span>
            <span class="meta-tag">L-T-P: ${course.ltp}</span>
            <span class="meta-tag">${course.contactHours} Contact Hours</span>
            <span class="meta-tag">${course.courseType}</span>
          </div>
        </div>

        <p class="course-desc">${escapeHTML(course.description)}</p>

        <!-- Theory Modules or Practical Experiments -->
        ${!isPractical && course.modules ? `
          <h4 style="font-size: 1.05rem; margin-bottom: 0.8rem; color: #fff;">Course Modules & Topics:</h4>
          <div class="modules-accordion-box">
            ${course.modules.map(mod => `
              <div class="module-row-card">
                <div class="module-header-line">
                  <h4>${escapeHTML(mod.title)}</h4>
                  <span class="module-hours">${mod.hours} Hours</span>
                </div>
                <div class="module-topics-list">
                  ${mod.topics.map(topic => `
                    <div class="topic-item">
                      <span class="topic-bullet">▸</span>
                      <span>${escapeHTML(topic)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="module-action-buttons">
                  <button class="btn btn-sm btn-outline btn-add-note-to-topic" data-subject-id="${course.id}" data-module="${escapeHTML(mod.title)}" data-topic="${escapeHTML(mod.topics[0])}">
                    <i data-lucide="plus-circle"></i>
                    <span>+ Add Note to this Module</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${isPractical && course.experiments ? `
          <h4 style="font-size: 1.05rem; margin-bottom: 0.8rem; color: #fff;">Official Laboratory Experiments (MAKAUT sem126):</h4>
          <div class="experiments-list">
            ${course.experiments.map(exp => `
              <div class="experiment-card">
                <div class="exp-num">Experiment ${exp.num}</div>
                <h4>${escapeHTML(exp.title)}</h4>
                <p>${escapeHTML(exp.desc)}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Syllabus Tab Switcher Handlers
  document.querySelectorAll('.syl-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.syl-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSyllabusTab = btn.getAttribute('data-syl-tab');
      renderSyllabusView();
    });
  });

  // --------------------------------------------------------------------------
  // 6. RENDER COMMUNITY NOTES REPOSITORY
  // --------------------------------------------------------------------------
  async function renderNotesView() {
    const grid = document.getElementById('community-notes-grid');
    if (!grid) return;

    let notes = await authDb.getAllNotesAsync();

    // Subject Filter
    if (currentNotesSubject !== 'all') {
      notes = notes.filter(n => n.subjectId === currentNotesSubject || n.subjectName.includes(currentNotesSubject));
    }

    // Category Filter
    if (currentNotesCategory !== 'all') {
      notes = notes.filter(n => n.category === currentNotesCategory);
    }

    // Global Search
    if (currentGlobalSearch.trim()) {
      const q = currentGlobalSearch.toLowerCase().trim();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.subjectName.toLowerCase().includes(q) ||
        n.moduleName.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (currentNotesSort === 'popular') {
      notes.sort((a, b) => (b.downloadsCount * 2 + (b.ratingSum || 0)) - (a.downloadsCount * 2 + (a.ratingSum || 0)));
    } else if (currentNotesSort === 'recent') {
      notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentNotesSort === 'highest-rated') {
      notes.sort((a, b) => {
        const rA = a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0;
        const rB = b.ratingCount > 0 ? b.ratingSum / b.ratingCount : 0;
        return rB - rA;
      });
    } else if (currentNotesSort === 'most-downloaded') {
      notes.sort((a, b) => b.downloadsCount - a.downloadsCount);
    } else if (currentNotesSort === 'bookmarked') {
      notes = notes.filter(n => authDb.isBookmarked(n.id));
    }

    if (notes.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <i data-lucide="file-question" style="width: 52px; height: 52px; color: var(--text-dim); margin-bottom: 0.8rem;"></i>
          <h3>No study materials found</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.2rem;">Be the first classmate to upload notes for this topic!</p>
          <button class="btn btn-primary" id="btn-empty-upload-notes"><i data-lucide="plus-circle"></i><span>+ Upload Note Now</span></button>
        </div>
      `;
      if (document.getElementById('btn-empty-upload-notes')) {
        document.getElementById('btn-empty-upload-notes').addEventListener('click', () => openUploadModalPrefilled());
      }
      if (window.lucide) lucide.createIcons();
      return;
    }

    grid.innerHTML = notes.map(note => createNoteCardHTML(note)).join('');

    if (window.lucide) lucide.createIcons();
    attachNoteActionListeners();
  }

  function createNoteCardHTML(note) {
    const isBookmarked = authDb.isBookmarked(note.id);
    const avgRating = note.ratingCount > 0 ? (note.ratingSum / note.ratingCount).toFixed(1) : '5.0';
    const timeAgoStr = window.formatTimeAgo ? window.formatTimeAgo(note.createdAt) : 'Recently';

    let badgeClass = 'badge-class';
    if (note.category && note.category.includes('Handwritten')) badgeClass = 'badge-handwritten';
    else if (note.category && note.category.includes('Lecture')) badgeClass = 'badge-lecture';
    else if (note.category && (note.category.includes('Important') || note.category.includes('Questions'))) badgeClass = 'badge-questions';
    else if (note.category && note.category.includes('Lab')) badgeClass = 'badge-lab';
    else if (note.category && note.category.includes('Short')) badgeClass = 'badge-short';

    const uploaderInitials = note.uploaderName ? note.uploaderName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'ST';

    return `
      <div class="note-card" data-id="${note.id}">
        <div class="note-card-header">
          <span class="category-tag-badge ${badgeClass}">${escapeHTML(note.category || 'Notes')}</span>
          <span class="meta-tag">v${note.version || 1}</span>
        </div>

        <h3 class="note-card-title">${escapeHTML(note.title)}</h3>
        <div class="note-subject-pill">${escapeHTML(note.subjectName)}</div>
        <div class="note-module-text">${escapeHTML(note.moduleName)}</div>
        
        <p class="note-desc-snippet">${escapeHTML(note.description)}</p>

        <div class="note-uploader-row">
          <div class="uploader-pill">
            <div class="uploader-mini-avatar" style="background: ${note.uploaderAvatar || 'linear-gradient(135deg, #3b82f6, #06b6d4)'}">
              ${uploaderInitials}
            </div>
            <span>Uploaded by <strong>${escapeHTML(note.uploaderName)}</strong></span>
          </div>
          <span class="time-text">${timeAgoStr}</span>
        </div>

        <div class="note-stats-bar">
          <div class="stat-stars">
            <i data-lucide="star" style="width: 15px; height: 15px; fill: currentColor;"></i>
            <span>${avgRating} (${note.ratingCount || 0})</span>
          </div>
          <div class="stat-downloads">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i>
            <span>${note.downloadsCount || 0} Downloads</span>
          </div>
        </div>

        <div class="note-actions-row">
          <button class="btn btn-outline btn-card-action btn-open-note-detail" data-id="${note.id}">
            <i data-lucide="eye"></i>
            <span>View</span>
          </button>
          <button class="btn btn-primary btn-card-action btn-download-note" data-id="${note.id}">
            <i data-lucide="download"></i>
            <span>Download</span>
          </button>
          <button class="btn-icon-action btn-bookmark-note ${isBookmarked ? 'bookmarked' : ''}" data-id="${note.id}" title="Bookmark note" aria-label="Bookmark note">
            <i data-lucide="bookmark"></i>
          </button>
          <button class="btn-icon-action btn-report-note" data-id="${note.id}" title="Report content" aria-label="Report content">
            <i data-lucide="flag"></i>
          </button>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 7. NOTE ACTION LISTENERS (View, Download, Bookmark, Report)
  // --------------------------------------------------------------------------
  function attachNoteActionListeners() {
    // View details
    document.querySelectorAll('.btn-open-note-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        openNoteDetailModal(id);
      });
    });

    // Download note
    document.querySelectorAll('.btn-download-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        downloadNote(id);
      });
    });

    // Bookmark
    document.querySelectorAll('.btn-bookmark-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const note = authDb.getNoteById(id);
        if (!note) return;

        const isSaved = authDb.toggleBookmark('NOTE', id, note.title, note.subjectName);
        btn.classList.toggle('bookmarked', isSaved);
        showToast(isSaved ? '✓ Added to your saved bookmarks' : 'Removed from bookmarks');
        if (currentNotesSort === 'bookmarked') renderNotesView();
      });
    });

    // Report
    document.querySelectorAll('.btn-report-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        document.getElementById('report-item-id').value = id;
        reportModal.classList.add('open');
      });
    });
  }

  function downloadNote(id) {
    const note = authDb.getNoteById(id);
    if (!note) return;

    authDb.incrementDownload(id);
    showToast(`📥 Downloading "${note.fileName}"...`);

    // 1. If real Supabase Storage URL exists
    if (note.fileUrl) {
      const a = document.createElement('a');
      a.href = note.fileUrl;
      a.download = note.fileName || 'Study_Notes.pdf';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 2. If real binary Blob exists in local memory / session
    const blob = authDb.getFileBlob(id);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = note.fileName || 'Study_Notes.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    }

    // 3. Fallback sample PDF generation
    const samplePdfData = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF`;
    const fallbackBlob = new Blob([samplePdfData], { type: 'application/pdf' });
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    const a = document.createElement('a');
    a.href = fallbackUrl;
    a.download = note.fileName || 'Study_Notes.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(fallbackUrl), 10000);
  }

  function openNoteDetailModal(id) {
    const note = authDb.getNoteById(id);
    if (!note) return;

    const content = document.getElementById('note-detail-content');
    if (!content) return;

    const avgRating = note.ratingCount > 0 ? (note.ratingSum / note.ratingCount).toFixed(1) : '5.0';
    const userRating = authDb.getUserRatingForNote(id);
    const timeAgoStr = window.formatTimeAgo ? window.formatTimeAgo(note.createdAt) : 'Recently';

    content.innerHTML = `
      <div class="detail-main-content">
        <div class="detail-header-badges">
          <span class="category-tag-badge badge-handwritten">${escapeHTML(note.category)}</span>
          <span class="meta-tag">Version ${note.version || 1}</span>
          <span class="meta-tag">${escapeHTML(note.fileType || 'PDF')} (${escapeHTML(note.fileSize || '2.4 MB')})</span>
        </div>

        <h2 class="detail-title">${escapeHTML(note.title)}</h2>
        <div class="detail-subject-line">${escapeHTML(note.subjectName)} · ${escapeHTML(note.moduleName)}</div>
        <p style="font-size: 0.85rem; color: var(--text-dim);">Topic: <strong>${escapeHTML(note.topicName || 'General Module Overview')}</strong></p>

        <div class="detail-uploader-card">
          <div class="uploader-pill">
            <div class="uploader-mini-avatar" style="width: 36px; height: 36px; background: ${note.uploaderAvatar || 'linear-gradient(135deg, #3b82f6, #06b6d4)'}">
              ${note.uploaderName ? note.uploaderName.slice(0, 2) : 'ST'}
            </div>
            <div>
              <div style="font-weight: 700; color: #fff;">${escapeHTML(note.uploaderName)}</div>
              <span style="font-size: 0.75rem; color: var(--text-dim);">Uploaded ${timeAgoStr}</span>
            </div>
          </div>
          <div style="font-weight: 700; color: var(--accent-emerald);">📥 ${note.downloadsCount || 0} Downloads</div>
        </div>

        <div>
          <h4 style="font-size: 0.95rem; margin-bottom: 0.4rem; color: #fff;">Study Material Overview</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">${escapeHTML(note.description)}</p>
        </div>

        <div class="detail-file-preview-box">
          <i data-lucide="file-text" class="preview-file-icon"></i>
          <div>
            <h4 style="color: #fff; font-size: 1.05rem;">${escapeHTML(note.fileName)}</h4>
            <span style="color: var(--text-dim); font-size: 0.8rem;">Official Student Verified Material · ${escapeHTML(note.fileSize || '2.4 MB')}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline" id="btn-modal-view-action">
              <i data-lucide="external-link"></i>
              <span>View File</span>
            </button>
            <button class="btn btn-primary" id="btn-modal-download-action">
              <i data-lucide="download"></i>
              <span>Download (${escapeHTML(note.fileSize || '2.4 MB')})</span>
            </button>
          </div>
        </div>
      </div>

      <div class="detail-sidebar-col">
        <!-- 1-5 Star Ratings -->
        <div class="rating-widget-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 0.95rem; color: #fff;">Community Rating</h4>
            <span style="font-weight: 800; color: var(--accent-amber);">⭐ ${avgRating} / 5</span>
          </div>
          <div class="star-rating-row">
            <span class="star-btn ${userRating >= 1 ? 'rated' : ''}" data-star="1">★</span>
            <span class="star-btn ${userRating >= 2 ? 'rated' : ''}" data-star="2">★</span>
            <span class="star-btn ${userRating >= 3 ? 'rated' : ''}" data-star="3">★</span>
            <span class="star-btn ${userRating >= 4 ? 'rated' : ''}" data-star="4">★</span>
            <span class="star-btn ${userRating >= 5 ? 'rated' : ''}" data-star="5">★</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-dim);">Click to submit your star rating</span>
        </div>

        <!-- Comments List -->
        <div class="comments-section">
          <h4 style="font-size: 0.95rem; color: #fff;">Classmate Discussion</h4>
          <div class="comments-list" id="modal-comments-list">
            <p style="color: var(--text-dim); font-size: 0.85rem; font-style: italic;">No comments yet on this document.</p>
          </div>
          <div class="comment-input-box">
            <input type="text" id="modal-new-comment-text" placeholder="Write a comment..." class="form-input" style="padding: 0.5rem 0.8rem; font-size: 0.85rem;">
            <button type="button" class="btn btn-sm btn-primary" id="btn-modal-post-comment" aria-label="Post comment"><i data-lucide="send"></i></button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Modal download & view actions
    document.getElementById('btn-modal-download-action').addEventListener('click', () => {
      downloadNote(id);
    });

    document.getElementById('btn-modal-view-action').addEventListener('click', () => {
      if (note.fileUrl) {
        window.open(note.fileUrl, '_blank');
      } else {
        const blob = authDb.getFileBlob(id);
        if (blob) {
          window.open(URL.createObjectURL(blob), '_blank');
        } else {
          downloadNote(id);
        }
      }
    });

    // Star rating clicks
    document.querySelectorAll('.star-btn').forEach(starBtn => {
      starBtn.addEventListener('click', () => {
        const star = parseInt(starBtn.getAttribute('data-star'), 10);
        authDb.rateNote(id, star);
        showToast(`✓ Rated note ${star} out of 5 stars!`);
        openNoteDetailModal(id);
      });
    });

    detailModal.classList.add('open');
  }

  // --------------------------------------------------------------------------
  // 8. UPLOAD MODAL, DROPZONE & DUPLICATE DETECTION
  // --------------------------------------------------------------------------
  function resetDropzoneUI() {
    if (noteFileInput) noteFileInput.value = '';
    if (selectedFilePill) selectedFilePill.style.display = 'none';
    if (dropzonePrompt) dropzonePrompt.style.display = 'block';
  }

  function handleFileSelection(file) {
    if (!file) return;

    // Check size limit: 25 MB
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File size exceeds 25 MB limit. Please select a smaller file.');
      resetDropzoneUI();
      return;
    }

    if (selectedFileName) selectedFileName.textContent = file.name;
    if (selectedFileSize) selectedFileSize.textContent = authDb.formatFileSize(file.size);
    if (dropzonePrompt) dropzonePrompt.style.display = 'none';
    if (selectedFilePill) selectedFilePill.style.display = 'flex';
  }

  if (fileDropzone && noteFileInput) {
    fileDropzone.addEventListener('click', (e) => {
      if (e.target.closest('#btn-remove-file')) return;
      noteFileInput.click();
    });

    noteFileInput.addEventListener('change', () => {
      if (noteFileInput.files && noteFileInput.files.length > 0) {
        handleFileSelection(noteFileInput.files[0]);
      }
    });

    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.classList.add('drag-over');
    });

    fileDropzone.addEventListener('dragleave', () => {
      fileDropzone.classList.remove('drag-over');
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        noteFileInput.files = e.dataTransfer.files;
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', (e) => {
      e.stopPropagation();
      resetDropzoneUI();
    });
  }

  function openUploadModalPrefilled(subjectId = '', moduleName = '', topicName = '') {
    const form = document.getElementById('upload-notes-form');
    if (form) form.reset();
    resetDropzoneUI();

    if (subjectId) document.getElementById('upload-note-subject').value = subjectId;
    if (moduleName) document.getElementById('upload-note-module').value = moduleName;
    if (topicName) document.getElementById('upload-note-topic').value = topicName;

    uploadModal.classList.add('open');
  }

  // Trigger buttons for Upload Modal
  [
    document.getElementById('btn-trigger-upload-modal'),
    document.getElementById('dash-btn-upload'),
    document.getElementById('quick-act-add-note'),
    document.getElementById('btn-explore-notes-upload'),
    document.getElementById('btn-my-uploads-upload-trigger')
  ].forEach(btn => {
    if (btn) btn.addEventListener('click', () => openUploadModalPrefilled());
  });

  const uploadForm = document.getElementById('upload-notes-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!noteFileInput || !noteFileInput.files || noteFileInput.files.length === 0) {
        showToast('Please select or drop a file to upload.');
        return;
      }

      const file = noteFileInput.files[0];
      const title = document.getElementById('upload-note-title').value.trim();
      const subjectId = document.getElementById('upload-note-subject').value;
      const subjectSelect = document.getElementById('upload-note-subject');
      const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
      const moduleName = document.getElementById('upload-note-module').value.trim();
      const topicName = document.getElementById('upload-note-topic').value.trim();
      const category = document.getElementById('upload-note-category').value;
      const description = document.getElementById('upload-note-description').value.trim();
      const tags = document.getElementById('upload-note-tags').value.trim();

      const noteData = {
        title,
        subjectId,
        subjectName,
        moduleName,
        topicName,
        category,
        description,
        tags
      };

      // DUPLICATE DETECTION
      const duplicate = authDb.checkDuplicate(title, subjectId);
      if (duplicate) {
        pendingDuplicateUpload = noteData;
        pendingDuplicateFile = file;
        const prev = document.getElementById('duplicate-existing-preview');
        if (prev) {
          prev.innerHTML = `
            <strong>${escapeHTML(duplicate.title)}</strong>
            <p style="font-size: 0.8rem; color: var(--text-dim);">${escapeHTML(duplicate.subjectName)} · Uploaded by ${escapeHTML(duplicate.uploaderName)}</p>
          `;
        }
        uploadModal.classList.remove('open');
        duplicateModal.classList.add('open');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-upload');
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Uploading File...</span>';
        }

        await authDb.addNoteAsync(noteData, file);
        uploadModal.classList.remove('open');
        resetDropzoneUI();
        showToast('🎉 Your study material has been published and shared with classmates!');

        await renderNotesView();
        await renderMyUploadsView();
        await renderDashboardView();
        navigateTo('my-uploads');
      } catch (err) {
        showToast(`Upload Error: ${err.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="upload"></i><span>Upload & Publish to Classmates</span>';
          if (window.lucide) lucide.createIcons();
        }
      }
    });
  }

  // Duplicate Modal Actions
  document.getElementById('btn-upload-anyway').addEventListener('click', async () => {
    if (pendingDuplicateUpload && pendingDuplicateFile) {
      try {
        await authDb.addNoteAsync(pendingDuplicateUpload, pendingDuplicateFile);
        pendingDuplicateUpload = null;
        pendingDuplicateFile = null;
        showToast('✓ Note uploaded.');
        duplicateModal.classList.remove('open');
        resetDropzoneUI();
        await renderNotesView();
        await renderMyUploadsView();
        navigateTo('my-uploads');
      } catch (err) {
        showToast(`Upload Error: ${err.message}`);
      }
    }
  });

  document.getElementById('btn-view-existing-note').addEventListener('click', () => {
    duplicateModal.classList.remove('open');
    if (pendingDuplicateUpload) {
      const dup = authDb.checkDuplicate(pendingDuplicateUpload.title, pendingDuplicateUpload.subjectId);
      if (dup) openNoteDetailModal(dup.id);
    }
  });

  // --------------------------------------------------------------------------
  // 9. "MY UPLOADS" VIEW
  // --------------------------------------------------------------------------
  async function renderMyUploadsView() {
    const user = authDb.getCurrentUser();
    if (!user) return;

    const stats = authDb.getUserStats(user.id);
    document.getElementById('stats-uploads-count').textContent = stats.totalUploads;
    document.getElementById('stats-downloads-count').textContent = stats.totalDownloads;
    document.getElementById('stats-avg-rating').textContent = stats.avgRating;
    document.getElementById('stats-karma-badge').textContent = stats.badge;

    const list = document.getElementById('my-uploads-rendered-list');
    if (!list) return;

    const allNotes = await authDb.getAllNotesAsync();
    const myNotes = allNotes.filter(n => n.uploaderId === user.id);

    if (myNotes.length === 0) {
      list.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: var(--text-dim);">
          <i data-lucide="folder-open" style="width: 48px; height: 48px; margin-bottom: 0.8rem;"></i>
          <p style="font-size: 1.05rem; margin-bottom: 1rem;">You haven't uploaded any study materials yet.</p>
          <button class="btn btn-primary" onclick="document.getElementById('btn-trigger-upload-modal').click()">
            <i data-lucide="plus-circle"></i>
            <span>Upload Your First Note</span>
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    list.innerHTML = myNotes.map(note => {
      const timeAgoStr = window.formatTimeAgo ? window.formatTimeAgo(note.updatedAt || note.createdAt) : 'Recently';
      return `
        <div class="my-upload-row">
          <div class="my-upload-info">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
              <span class="category-tag-badge badge-handwritten">${escapeHTML(note.category)}</span>
              <span class="meta-tag">Version ${note.version || 1}</span>
            </div>
            <h4>${escapeHTML(note.title)}</h4>
            <div class="my-upload-meta">
              <span>${escapeHTML(note.subjectName)}</span> · 
              <span>Updated ${timeAgoStr}</span> · 
              <span>📥 ${note.downloadsCount || 0} Downloads</span>
            </div>
          </div>
          <div class="my-upload-actions">
            <button class="btn btn-sm btn-outline btn-open-note-detail" data-id="${note.id}"><i data-lucide="eye"></i><span>View</span></button>
            <button class="btn btn-sm btn-outline btn-edit-my-note" data-id="${note.id}"><i data-lucide="edit-3"></i><span>Edit</span></button>
            <button class="btn btn-sm btn-danger btn-delete-my-note" data-id="${note.id}" aria-label="Delete note"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();

    // Edit My Note
    document.querySelectorAll('.btn-edit-my-note').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const note = authDb.getNoteById(id);
        if (!note) return;
        document.getElementById('edit-note-id').value = note.id;
        document.getElementById('edit-note-title').value = note.title;
        document.getElementById('edit-note-description').value = note.description;
        document.getElementById('edit-next-version').textContent = `v${(note.version || 1) + 1}`;
        editModal.classList.add('open');
      });
    });

    // Delete My Note
    document.querySelectorAll('.btn-delete-my-note').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this upload?')) {
          await authDb.deleteNoteAsync(id);
          showToast('Note deleted.');
          await renderMyUploadsView();
          await renderNotesView();
          await renderDashboardView();
        }
      });
    });
  }

  // Edit Note Submit
  const editForm = document.getElementById('edit-notes-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-note-id').value;
      const title = document.getElementById('edit-note-title').value.trim();
      const description = document.getElementById('edit-note-description').value.trim();
      const fileInput = document.getElementById('edit-file-input');

      const updates = { title, description };
      const newFile = (fileInput && fileInput.files && fileInput.files.length > 0) ? fileInput.files[0] : null;

      try {
        await authDb.updateNoteAsync(id, updates, newFile);
        editModal.classList.remove('open');
        showToast('✓ Note updated with new version.');
        await renderMyUploadsView();
        await renderNotesView();
      } catch (err) {
        showToast(`Update Error: ${err.message}`);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 10. ACADEMIC Q&A FORUM
  // --------------------------------------------------------------------------
  function renderQuestionsView() {
    const list = document.getElementById('questions-list-container');
    if (!list) return;

    const questions = authDb.getAllQuestions();

    list.innerHTML = questions.map(q => `
      <div class="question-card" data-id="${q.id}">
        <div class="q-header-row">
          <span class="course-code-pill">${escapeHTML(q.courseId)}</span>
          <span style="font-size: 0.78rem; color: var(--text-dim);">${window.formatTimeAgo ? window.formatTimeAgo(q.createdAt) : 'Recently'}</span>
        </div>
        <h3 class="q-title">${escapeHTML(q.title)}</h3>
        <p class="q-details">${escapeHTML(q.details)}</p>

        <!-- Answers -->
        <div class="answers-thread-box">
          <h4 style="font-size: 0.88rem; color: #fff; margin-bottom: 0.6rem;">Answers (${(q.answers || []).length})</h4>
          ${(q.answers || []).map(ans => `
            <div class="answer-item">
              <div class="answer-author">${escapeHTML(ans.userName)}</div>
              <div class="answer-text">${escapeHTML(ans.text)}</div>
            </div>
          `).join('')}

          <form class="form-row q-answer-form" data-qid="${q.id}" style="margin-top: 0.8rem;">
            <input type="text" required placeholder="Write a verified answer..." class="form-input" style="padding: 0.5rem 0.8rem; font-size: 0.85rem;">
            <button type="submit" class="btn btn-sm btn-primary">Post Answer</button>
          </form>
        </div>
      </div>
    `).join('');

    // Answer form submit
    document.querySelectorAll('.q-answer-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const qid = form.getAttribute('data-qid');
        const input = form.querySelector('input');
        const text = input.value.trim();
        if (!text) return;

        authDb.answerQuestion(qid, text);
        input.value = '';
        showToast('✓ Answer posted! Earned +30 Karma Points.');
        renderQuestionsView();
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Ask Question Modal Submit
  const askForm = document.getElementById('ask-question-form');
  if (askForm) {
    askForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('ask-title').value.trim();
      const courseId = document.getElementById('ask-course').value;
      const moduleName = document.getElementById('ask-module').value.trim();
      const details = document.getElementById('ask-details').value.trim();
      const tags = document.getElementById('ask-tags').value.trim();

      authDb.askQuestion(title, courseId, moduleName, details, tags);
      askModal.classList.remove('open');
      askForm.reset();
      showToast('🎉 Question posted to MAKAUT Academic Forum.');
      renderQuestionsView();
    });
  }

  document.getElementById('btn-open-ask-modal').addEventListener('click', () => {
    askModal.classList.add('open');
  });

  // --------------------------------------------------------------------------
  // 11. COMMUNITY CHAT
  // --------------------------------------------------------------------------
  function renderChatView() {
    const messagesBody = document.getElementById('chat-messages-body');
    const channelTitle = document.getElementById('active-channel-title');
    if (!messagesBody) return;

    if (channelTitle) channelTitle.textContent = `# ${activeChatChannel}`;
    const messages = authDb.getChatMessages(activeChatChannel);

    messagesBody.innerHTML = messages.map(msg => `
      <div class="chat-message-row">
        <div class="msg-avatar" style="background: ${msg.userAvatar || 'linear-gradient(135deg, #3b82f6, #06b6d4)'}">
          ${msg.userName ? msg.userName.slice(0, 2) : 'ST'}
        </div>
        <div class="msg-content">
          <div class="msg-header">
            <span class="msg-author">${escapeHTML(msg.userName)}</span>
            <span class="msg-time">${window.formatTimeAgo ? window.formatTimeAgo(msg.createdAt) : ''}</span>
          </div>
          <div class="msg-bubble">${escapeHTML(msg.text)}</div>
        </div>
      </div>
    `).join('');

    messagesBody.scrollTop = messagesBody.scrollHeight;
  }

  // Channel switcher
  document.querySelectorAll('.channel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.channel-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeChatChannel = btn.getAttribute('data-channel');
      renderChatView();
    });
  });

  // Send Message
  const chatForm = document.getElementById('chat-send-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-text-input');
      const text = input.value.trim();
      if (!text) return;

      authDb.sendChatMessage(activeChatChannel, text);
      input.value = '';
      renderChatView();
    });
  }

  // --------------------------------------------------------------------------
  // 12. PERSONAL PROGRESS TRACKER
  // --------------------------------------------------------------------------
  function renderProgressView() {
    const grid = document.getElementById('progress-subjects-grid');
    if (!grid) return;

    const sem1Courses = syllabusData.semester1.filter(c => c.modules);
    const userProg = authDb.getUserProgress();

    grid.innerHTML = sem1Courses.map(course => {
      let allTopics = [];
      course.modules.forEach(m => { allTopics = allTopics.concat(m.topics); });

      const completed = (userProg[course.id] || []).length;
      const pct = allTopics.length > 0 ? Math.round((completed / allTopics.length) * 100) : 0;

      return `
        <div class="prog-subject-card">
          <div class="prog-header">
            <span class="course-code-pill">${escapeHTML(course.code)}</span>
            <span style="font-weight: 800; font-size: 1.1rem; color: var(--accent-emerald);">${pct}% Complete</span>
          </div>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">${escapeHTML(course.name)}</h3>
          
          <div class="prog-bar-track">
            <div class="prog-bar-fill" style="width: ${pct}%;"></div>
          </div>

          <h5 style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.6rem;">Topics Checklist (Click to update):</h5>
          <div class="topic-check-list">
            ${allTopics.map(topic => {
              const isDone = (userProg[course.id] || []).includes(topic);
              return `
                <label class="topic-check-label ${isDone ? 'completed' : ''}">
                  <input type="checkbox" class="topic-chk" data-cid="${course.id}" data-topic="${escapeHTML(topic)}" ${isDone ? 'checked' : ''}>
                  <span>${escapeHTML(topic)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.topic-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const cid = chk.getAttribute('data-cid');
        const topic = chk.getAttribute('data-topic');
        const isDone = authDb.toggleTopicProgress(cid, topic);
        showToast(isDone ? '✓ Topic marked as completed (+10 Karma)!' : 'Topic marked as incomplete.');
        renderProgressView();
      });
    });
  }

  // --------------------------------------------------------------------------
  // 13. BOOKMARKS VIEW
  // --------------------------------------------------------------------------
  async function renderBookmarksView() {
    const grid = document.getElementById('bookmarks-notes-grid');
    if (!grid) return;

    const bms = authDb.getUserBookmarks();
    if (bms.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-card); border-radius: var(--radius-lg);">
          <i data-lucide="bookmark" style="width: 48px; height: 48px; color: var(--text-dim); margin-bottom: 0.8rem;"></i>
          <h3>No saved bookmarks yet</h3>
          <p style="color: var(--text-muted);">Bookmark notes, formulas, and PYQs to access them quickly here.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const allNotes = await authDb.getAllNotesAsync();
    const bookmarkedNotes = allNotes.filter(n => bms.some(b => b.itemId === n.id));
    grid.innerHTML = bookmarkedNotes.map(n => createNoteCardHTML(n)).join('');
    if (window.lucide) lucide.createIcons();
    attachNoteActionListeners();
  }

  // --------------------------------------------------------------------------
  // 14. ADMIN PANEL & USER MANAGEMENT
  // --------------------------------------------------------------------------
  let pendingRoleChange = null;
  const roleConfirmModal = document.getElementById('modal-role-confirm-backdrop');
  let adminUsersSearchQuery = '';
  let adminUsersRoleFilter = 'ALL';

  async function renderAdminView() {
    const user = authDb.getCurrentUser();
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) return;

    // 1. Reports Queue
    const reportsList = document.getElementById('admin-reports-list');
    const reports = authDb.getAllReports();

    if (reportsList) {
      if (reports.length === 0) {
        reportsList.innerHTML = `<p style="color: var(--text-dim); font-size: 0.88rem;">No pending reports. All student materials are compliant.</p>`;
      } else {
        reportsList.innerHTML = reports.map(r => `
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); padding: 0.8rem; border-radius: var(--radius-sm); margin-bottom: 0.6rem;">
            <strong>Flagged: ${escapeHTML(r.reason)}</strong>
            <p style="font-size: 0.8rem; color: var(--text-dim);">Reported by ${escapeHTML(r.reporterName)} on ${new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        `).join('');
      }
    }

    // 2. User Management Roster (Admin Only)
    const tableBody = document.getElementById('admin-users-table-body');
    if (tableBody && user.role === 'ADMIN') {
      try {
        let allUsers = await authDb.getAllUsersAsync();

        // Search Filter
        if (adminUsersSearchQuery.trim()) {
          const q = adminUsersSearchQuery.toLowerCase().trim();
          allUsers = allUsers.filter(u =>
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.studentId && u.studentId.toLowerCase().includes(q)) ||
            (u.college && u.college.toLowerCase().includes(q))
          );
        }

        // Role Filter
        if (adminUsersRoleFilter !== 'ALL') {
          allUsers = allUsers.filter(u => u.role === adminUsersRoleFilter);
        }

        if (allUsers.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-dim);">
                No users found matching the filter criteria.
              </td>
            </tr>
          `;
        } else {
          tableBody.innerHTML = allUsers.map(u => {
            const initials = u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'ST';
            const roleClass = u.role === 'ADMIN' ? 'role-badge-admin' : (u.role === 'MODERATOR' ? 'role-badge-mod' : 'role-badge-student');
            const isSelf = u.id === user.id;

            let actionButtons = '';
            if (isSelf) {
              actionButtons = `<span style="color: var(--text-dim); font-size: 0.78rem;">(Your Active Session)</span>`;
            } else if (u.role === 'STUDENT') {
              actionButtons = `
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-outline btn-change-role" data-uid="${u.id}" data-name="${escapeHTML(u.fullName)}" data-email="${escapeHTML(u.email)}" data-oldrole="${u.role}" data-newrole="MODERATOR">
                    <i data-lucide="shield"></i> Make Moderator
                  </button>
                  <button class="btn btn-sm btn-outline btn-change-role" data-uid="${u.id}" data-name="${escapeHTML(u.fullName)}" data-email="${escapeHTML(u.email)}" data-oldrole="${u.role}" data-newrole="ADMIN">
                    <i data-lucide="shield-alert"></i> Make Admin
                  </button>
                </div>
              `;
            } else if (u.role === 'MODERATOR') {
              actionButtons = `
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-outline btn-change-role" data-uid="${u.id}" data-name="${escapeHTML(u.fullName)}" data-email="${escapeHTML(u.email)}" data-oldrole="${u.role}" data-newrole="STUDENT">
                    <i data-lucide="user-minus"></i> Demote to Student
                  </button>
                  <button class="btn btn-sm btn-outline btn-change-role" data-uid="${u.id}" data-name="${escapeHTML(u.fullName)}" data-email="${escapeHTML(u.email)}" data-oldrole="${u.role}" data-newrole="ADMIN">
                    <i data-lucide="shield-alert"></i> Make Admin
                  </button>
                </div>
              `;
            } else if (u.role === 'ADMIN') {
              actionButtons = `
                <button class="btn btn-sm btn-danger btn-change-role" data-uid="${u.id}" data-name="${escapeHTML(u.fullName)}" data-email="${escapeHTML(u.email)}" data-oldrole="${u.role}" data-newrole="STUDENT">
                  <i data-lucide="user-x"></i> Demote to Student
                </button>
              `;
            }

            return `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.7rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${u.avatarGradient || 'linear-gradient(135deg, #3b82f6, #06b6d4)'}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #fff;">
                      ${initials}
                    </div>
                    <div>
                      <strong style="color: #fff; font-size: 0.9rem; display: block;">${escapeHTML(u.fullName)}</strong>
                      <span style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(u.email)}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">${escapeHTML(u.studentId || 'N/A')}</span>
                  <span style="display: block; font-size: 0.75rem; color: var(--text-dim);">${escapeHTML(u.branch || 'CSE')} (${escapeHTML(u.semester || 'Sem I')})</span>
                </td>
                <td style="font-size: 0.82rem; color: var(--text-muted);">${escapeHTML(u.college || 'MAKAUT')}</td>
                <td><span class="role-badge ${roleClass}">${u.role}</span></td>
                <td><span style="font-size: 0.85rem; font-weight: 700; color: var(--accent-amber);">⭐ ${u.karmaPoints || 100}</span></td>
                <td>${actionButtons}</td>
              </tr>
            `;
          }).join('');

          if (window.lucide) lucide.createIcons();

          // Attach role change buttons
          document.querySelectorAll('.btn-change-role').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetUserId = btn.getAttribute('data-uid');
              const targetName = btn.getAttribute('data-name');
              const targetEmail = btn.getAttribute('data-email');
              const oldRole = btn.getAttribute('data-oldrole');
              const newRole = btn.getAttribute('data-newrole');

              pendingRoleChange = { targetUserId, targetName, targetEmail, oldRole, newRole };

              document.getElementById('role-confirm-user-name').textContent = targetName;
              document.getElementById('role-confirm-user-email').textContent = targetEmail;
              document.getElementById('role-confirm-old-badge').textContent = oldRole;
              document.getElementById('role-confirm-new-badge').textContent = newRole;

              if (roleConfirmModal) roleConfirmModal.classList.add('open');
            });
          });
        }
      } catch (err) {
        console.error('Error rendering admin user table:', err);
      }
    }
  }

  // Admin User Search & Role Filters
  const adminUserSearchInput = document.getElementById('admin-user-search-input');
  if (adminUserSearchInput) {
    adminUserSearchInput.addEventListener('input', (e) => {
      adminUsersSearchQuery = e.target.value;
      renderAdminView();
    });
  }

  const adminUserRoleFilterSelect = document.getElementById('admin-user-role-filter');
  if (adminUserRoleFilterSelect) {
    adminUserRoleFilterSelect.addEventListener('change', (e) => {
      adminUsersRoleFilter = e.target.value;
      renderAdminView();
    });
  }

  // Role Confirmation Submit
  const btnSubmitRoleConfirm = document.getElementById('btn-submit-role-confirm');
  if (btnSubmitRoleConfirm) {
    btnSubmitRoleConfirm.addEventListener('click', async () => {
      if (!pendingRoleChange) return;

      try {
        btnSubmitRoleConfirm.disabled = true;
        btnSubmitRoleConfirm.innerHTML = '<span>Updating...</span>';

        await authDb.changeUserRoleAsync(pendingRoleChange.targetUserId, pendingRoleChange.newRole);
        showToast(`✓ User role for "${pendingRoleChange.targetName}" updated to ${pendingRoleChange.newRole}!`);

        if (roleConfirmModal) roleConfirmModal.classList.remove('open');
        pendingRoleChange = null;

        await renderAdminView();
      } catch (err) {
        showToast(`Role Update Error: ${err.message}`);
      } finally {
        btnSubmitRoleConfirm.disabled = false;
        btnSubmitRoleConfirm.innerHTML = '<i data-lucide="check"></i><span>Confirm & Update Role</span>';
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // Admin Broadcast Announcement
  const broadcastForm = document.getElementById('admin-broadcast-form');
  if (broadcastForm) {
    broadcastForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('admin-ann-title').value.trim();
      const cat = document.getElementById('admin-ann-cat').value;
      const badge = document.getElementById('admin-ann-badge').value;
      const content = document.getElementById('admin-ann-content').value.trim();

      authDb.addAnnouncement(title, cat, content, badge);
      broadcastForm.reset();
      showToast('📢 Official Announcement broadcasted to all students.');
      renderDashboardView();
    });
  }

  // --------------------------------------------------------------------------
  // 15. PDF VIEWER MODAL & NAVIGATION
  // --------------------------------------------------------------------------
  document.getElementById('btn-open-pdf-viewer-modal').addEventListener('click', () => {
    pdfModal.classList.add('open');
  });

  document.getElementById('pdf-prev-page').addEventListener('click', () => {
    if (pdfCurrentPage > 1) {
      pdfCurrentPage--;
      document.getElementById('pdf-curr-page').textContent = pdfCurrentPage;
    }
  });

  document.getElementById('pdf-next-page').addEventListener('click', () => {
    if (pdfCurrentPage < pdfTotalPages) {
      pdfCurrentPage++;
      document.getElementById('pdf-curr-page').textContent = pdfCurrentPage;
    }
  });

  // --------------------------------------------------------------------------
  // 16. MODAL CLOSE HANDLERS
  // --------------------------------------------------------------------------
  function setupModalClose(btnId, modalElem) {
    const btn = document.getElementById(btnId);
    if (btn && modalElem) {
      btn.addEventListener('click', () => modalElem.classList.remove('open'));
    }
    if (modalElem) {
      modalElem.addEventListener('click', (e) => {
        if (e.target === modalElem) modalElem.classList.remove('open');
      });
    }
  }

  setupModalClose('close-upload-modal', uploadModal);
  setupModalClose('btn-cancel-upload', uploadModal);
  setupModalClose('close-duplicate-modal', duplicateModal);
  setupModalClose('close-detail-modal', detailModal);
  setupModalClose('close-edit-modal', editModal);
  setupModalClose('btn-cancel-edit', editModal);
  setupModalClose('close-report-modal', reportModal);
  setupModalClose('btn-cancel-report', reportModal);
  setupModalClose('close-ask-modal', askModal);
  setupModalClose('btn-cancel-ask', askModal);
  setupModalClose('close-pdf-modal', pdfModal);
  setupModalClose('close-role-confirm-modal', roleConfirmModal);
  setupModalClose('btn-cancel-role-confirm', roleConfirmModal);

  // --------------------------------------------------------------------------
  // 17. GLOBAL SEARCH & TOAST HELPER
  // --------------------------------------------------------------------------
  const searchInput = document.getElementById('app-global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentGlobalSearch = e.target.value;
      if (currentActiveView !== 'notes') {
        navigateTo('notes');
      } else {
        renderNotesView();
      }
    });
  }

  function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="info" style="width: 18px; height: 18px; color: var(--primary);"></i><span>${escapeHTML(msg)}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------------------------
  // 17. SUPABASE BACKEND SETTINGS MODAL
  // --------------------------------------------------------------------------
  const supabaseConfigModal = document.getElementById('modal-supabase-config-backdrop');
  const btnOpenSupabaseConfig = document.getElementById('btn-open-supabase-config');
  const formSupabaseConfig = document.getElementById('form-supabase-config');
  const cfgUrlInput = document.getElementById('cfg-supabase-url');
  const cfgKeyInput = document.getElementById('cfg-supabase-key');
  const statusIndicator = document.getElementById('supabase-status-indicator');

  function refreshSupabaseConfigUI() {
    const isConn = window.EduNotesSupabase && window.EduNotesSupabase.isConfigured();
    if (statusIndicator) {
      statusIndicator.textContent = isConn ? '🟢 Connected to Live Supabase Backend' : '🟡 Standalone Local Mode (Supabase not configured)';
      statusIndicator.style.color = isConn ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    }
    if (cfgUrlInput) cfgUrlInput.value = localStorage.getItem('EDUNOTES_SUPABASE_URL') || '';
    if (cfgKeyInput) cfgKeyInput.value = localStorage.getItem('EDUNOTES_SUPABASE_KEY') || '';
  }

  if (btnOpenSupabaseConfig && supabaseConfigModal) {
    btnOpenSupabaseConfig.addEventListener('click', (e) => {
      e.preventDefault();
      if (userDropdownMenu) userDropdownMenu.style.display = 'none';
      refreshSupabaseConfigUI();
      supabaseConfigModal.classList.add('open');
    });
  }

  if (formSupabaseConfig) {
    formSupabaseConfig.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = cfgUrlInput.value.trim();
      const key = cfgKeyInput.value.trim();

      if (url && key) {
        window.EduNotesSupabase.reconfigure(url, key);
        showToast('✓ Supabase credentials saved and backend connected!');
      } else {
        localStorage.removeItem('EDUNOTES_SUPABASE_URL');
        localStorage.removeItem('EDUNOTES_SUPABASE_KEY');
        window.EduNotesSupabase.reconfigure('', '');
        showToast('Switched to standalone offline mode.');
      }

      if (supabaseConfigModal) supabaseConfigModal.classList.remove('open');
      checkAuthAndRoute();
    });
  }

  setupModalClose('close-supabase-config-modal', supabaseConfigModal);
  setupModalClose('btn-cancel-supabase-config', supabaseConfigModal);

  // --------------------------------------------------------------------------
  // 18. INITIALIZE APPLICATION
  // --------------------------------------------------------------------------
  checkAuthAndRoute();
});
