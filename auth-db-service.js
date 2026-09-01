/**
 * ============================================================================
 * EDUNOTES — AUTHENTICATION & MULTI-USER DATABASE SERVICE
 * Enterprise-grade client service supporting Supabase REST/PostgreSQL/Auth/Storage
 * with binary file preservation, collision-free storage, and zero hardcoded credentials.
 * ============================================================================
 */

(function () {
  'use strict';

  // Storage Keys for Clean Real Sessions (v6)
  const STORAGE_SESSION = 'edunotes_auth_session_v6';
  const STORAGE_DEV_USERS = 'edunotes_users_v6';
  const STORAGE_DEV_NOTES = 'edunotes_notes_v6';
  const STORAGE_DEV_ANNOUNCEMENTS = 'edunotes_announcements_v6';
  const STORAGE_DEV_QUESTIONS = 'edunotes_questions_v6';
  const STORAGE_DEV_CHAT = 'edunotes_chat_v6';
  const STORAGE_DEV_CALENDAR = 'edunotes_calendar_v6';
  const STORAGE_DEV_BOOKMARKS = 'edunotes_bookmarks_v6';
  const STORAGE_DEV_PROGRESS = 'edunotes_progress_v6';
  const STORAGE_DEV_RATINGS = 'edunotes_ratings_v6';
  const STORAGE_DEV_REPORTS = 'edunotes_reports_v6';

  // AGGRESSIVELY PURGE ALL LEGACY MOCK/SEED DATA & OVERRIDE KEYS FROM LOCALSTORAGE
  try {
    const keysToPurge = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('dev_users') ||
        key.includes('dev_notes') ||
        key.includes('dev_announcements') ||
        key.includes('dev_questions') ||
        key.includes('demo') ||
        key.includes('mock') ||
        key.includes('sample') ||
        key.includes('_v1') ||
        key.includes('_v2') ||
        key.includes('_v3') ||
        key.includes('_v4') ||
        key.includes('_v5') ||
        key === 'EDUNOTES_SUPABASE_URL' ||
        key === 'EDUNOTES_SUPABASE_KEY'
      )) {
        keysToPurge.push(key);
      }
    }
    keysToPurge.forEach(k => localStorage.removeItem(k));
  } catch (e) {}

  // In-memory / session Binary Blob storage for local offline file integrity
  const fileBlobsMap = new Map();

  class AuthDbService {
    constructor() {
      this.currentUser = this.loadLocalSession();
      this.initDevStorage();
      this.initSupabaseListener();
    }

    getSupabase() {
      return window.EduNotesSupabase ? window.EduNotesSupabase.getClient() : null;
    }

    isUsingSupabase() {
      return Boolean(this.getSupabase());
    }

    loadLocalSession() {
      try {
        const data = localStorage.getItem(STORAGE_SESSION);
        if (!data) return null;
        const user = JSON.parse(data);
        if (user && user.email && user.email.toLowerCase() === 'sayangorai298@gmail.com') {
          user.role = 'ADMIN';
        }
        return user;
      } catch (e) {
        return null;
      }
    }

    saveLocalSession(user) {
      this.currentUser = user;
      if (user) {
        if (user.email && user.email.toLowerCase() === 'sayangorai298@gmail.com') {
          user.role = 'ADMIN';
        }
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_SESSION);
      }
    }

    initDevStorage() {
      if (!localStorage.getItem(STORAGE_DEV_USERS)) {
        localStorage.setItem(STORAGE_DEV_USERS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_DEV_NOTES)) {
        localStorage.setItem(STORAGE_DEV_NOTES, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_DEV_ANNOUNCEMENTS)) {
        localStorage.setItem(STORAGE_DEV_ANNOUNCEMENTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_DEV_QUESTIONS)) {
        localStorage.setItem(STORAGE_DEV_QUESTIONS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_DEV_CHAT)) {
        localStorage.setItem(STORAGE_DEV_CHAT, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_DEV_CALENDAR)) {
        localStorage.setItem(STORAGE_DEV_CALENDAR, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_DEV_BOOKMARKS)) {
        localStorage.setItem(STORAGE_DEV_BOOKMARKS, JSON.stringify({}));
      }
      if (!localStorage.getItem(STORAGE_DEV_PROGRESS)) {
        localStorage.setItem(STORAGE_DEV_PROGRESS, JSON.stringify({}));
      }
      if (!localStorage.getItem(STORAGE_DEV_RATINGS)) {
        localStorage.setItem(STORAGE_DEV_RATINGS, JSON.stringify({}));
      }
      if (!localStorage.getItem(STORAGE_DEV_REPORTS)) {
        localStorage.setItem(STORAGE_DEV_REPORTS, JSON.stringify([]));
      }

      // Ensure active primary admin sayangorai298@gmail.com is ADMIN
      if (this.currentUser && this.currentUser.email && this.currentUser.email.toLowerCase() === 'sayangorai298@gmail.com') {
        this.currentUser.role = 'ADMIN';
        this.saveLocalSession(this.currentUser);
      }
    }

    async initSupabaseListener() {
      const supabase = this.getSupabase();
      if (!supabase) return;

      try {
        const { data } = await supabase.auth.getSession();
        if (data && data.session && data.session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profile) {
            this.saveLocalSession({
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name,
              studentId: profile.student_id,
              college: profile.college,
              branch: profile.branch,
              semester: profile.semester,
              academicYear: profile.academic_year,
              role: profile.role || 'STUDENT',
              avatarGradient: profile.avatar_url || 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              karmaPoints: profile.karma_points || 100
            });
          }
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            this.saveLocalSession(null);
          } else if (session && session.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              this.saveLocalSession({
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                studentId: profile.student_id,
                college: profile.college,
                branch: profile.branch,
                semester: profile.semester,
                academicYear: profile.academic_year,
                role: profile.role || 'STUDENT',
                avatarGradient: profile.avatar_url || 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                karmaPoints: profile.karma_points || 100
              });
            }
          }
        });
      } catch (err) {
        console.warn('Supabase session initialization warning:', err);
      }
    }

    isAuthenticated() {
      return this.currentUser !== null;
    }

    getCurrentUser() {
      return this.currentUser;
    }

    // ------------------------------------------------------------------------
    // AUTHENTICATION: LOGIN, SIGNUP, FORGOT, LOGOUT
    // ------------------------------------------------------------------------
    async login(email, password) {
      const cleanEmail = email.toLowerCase().trim();
      const supabase = this.getSupabase();

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (error) throw new Error(error.message);

        // Fetch user profile from Supabase profiles table
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileErr || !profile) {
          const meta = data.user.user_metadata || {};
          const isSayang = cleanEmail === 'sayangorai298@gmail.com';
          const fallbackUser = {
            id: data.user.id,
            email: data.user.email,
            fullName: meta.full_name || (isSayang ? 'Samir Gorai' : 'Verified Student'),
            studentId: meta.student_id || 'Not provided',
            college: meta.college || 'Not provided',
            branch: meta.branch || 'Computer Science & Engineering',
            semester: meta.semester || 'Semester I',
            role: isSayang ? 'ADMIN' : 'STUDENT',
            avatarGradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            karmaPoints: 0
          };
          this.saveLocalSession(fallbackUser);
          return fallbackUser;
        }

        const isSayang = cleanEmail === 'sayangorai298@gmail.com';
        const userObj = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          studentId: profile.student_id || 'Not provided',
          college: profile.college || 'Not provided',
          branch: profile.branch || 'Computer Science & Engineering',
          semester: profile.semester || 'Semester I',
          academicYear: profile.academic_year || '2026-2027',
          role: (profile.role && profile.role !== 'STUDENT') ? profile.role : (isSayang ? 'ADMIN' : (profile.role || 'STUDENT')),
          avatarGradient: profile.avatar_url || 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          bio: profile.bio || '',
          karmaPoints: profile.karma_points || 0
        };

        this.saveLocalSession(userObj);
        return userObj;
      }

      // Development / Local Fallback Authentication
      const users = JSON.parse(localStorage.getItem(STORAGE_DEV_USERS) || '[]');
      let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      const isSayang = cleanEmail === 'sayangorai298@gmail.com';

      if (!user) {
        if (isSayang) {
          user = {
            id: 'usr_admin_sayang',
            email: cleanEmail,
            fullName: 'Samir Gorai',
            studentId: 'Not provided',
            college: 'Not provided',
            branch: 'Computer Science & Engineering',
            semester: 'Semester I',
            academicYear: '2026-2027',
            role: 'ADMIN',
            avatarGradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            bio: 'University Administrator / Academic Dean',
            karmaPoints: 0,
            createdAt: new Date().toISOString()
          };
          users.push(user);
          localStorage.setItem(STORAGE_DEV_USERS, JSON.stringify(users));
        } else {
          throw new Error('Invalid credentials. Please verify your email and password, or create a new account.');
        }
      }

      if (user.passwordHash && user.passwordHash !== password) {
        throw new Error('Invalid password for this student account.');
      }

      if (isSayang) {
        user.role = 'ADMIN';
      }

      const sessionUser = { ...user };
      delete sessionUser.passwordHash;
      this.saveLocalSession(sessionUser);
      return sessionUser;
    }

    async signup(formData) {
      const cleanEmail = formData.email.toLowerCase().trim();
      const isSayang = cleanEmail === 'sayangorai298@gmail.com';
      const supabase = this.getSupabase();

      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName.trim(),
              student_id: formData.studentId ? formData.studentId.trim() : 'Not provided',
              college: formData.college ? formData.college.trim() : 'Not provided',
              branch: formData.branch || 'Computer Science & Engineering',
              semester: formData.semester || 'Semester I'
            }
          }
        });

        if (error) throw new Error(error.message);

        const userObj = {
          id: data.user ? data.user.id : 'usr_' + Date.now(),
          email: cleanEmail,
          fullName: formData.fullName.trim(),
          studentId: formData.studentId ? formData.studentId.trim() : 'Not provided',
          college: formData.college ? formData.college.trim() : 'Not provided',
          branch: formData.branch || 'Computer Science & Engineering',
          semester: formData.semester || 'Semester I',
          role: isSayang ? 'ADMIN' : 'STUDENT',
          avatarGradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          karmaPoints: 0
        };

        this.saveLocalSession(userObj);
        return userObj;
      }

      // Development / Local Fallback Sign-up
      const users = JSON.parse(localStorage.getItem(STORAGE_DEV_USERS) || '[]');
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        throw new Error('An account with this email address already exists.');
      }

      const id = 'usr_' + Date.now();
      const gradients = [
        'linear-gradient(135deg, #6366f1, #a855f7)',
        'linear-gradient(135deg, #3b82f6, #06b6d4)',
        'linear-gradient(135deg, #10b981, #34d399)',
        'linear-gradient(135deg, #f59e0b, #fbbf24)',
        'linear-gradient(135deg, #ec4899, #f43f5e)'
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      const newUser = {
        id,
        email: cleanEmail,
        fullName: formData.fullName.trim(),
        studentId: formData.studentId ? formData.studentId.trim() : 'Not provided',
        college: formData.college ? formData.college.trim() : 'Not provided',
        branch: formData.branch || 'Computer Science & Engineering',
        semester: formData.semester || 'Semester I',
        academicYear: '2026-2027',
        role: isSayang ? 'ADMIN' : 'STUDENT', // Strictly default to STUDENT unless primary admin
        passwordHash: formData.password,
        avatarGradient: randomGradient,
        bio: '',
        karmaPoints: 0,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_DEV_USERS, JSON.stringify(users));

      const sessionUser = { ...newUser };
      delete sessionUser.passwordHash;
      this.saveLocalSession(sessionUser);
      return sessionUser;
    }

    async resetPassword(email) {
      const cleanEmail = email.toLowerCase().trim();
      const supabase = this.getSupabase();
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (error) throw new Error(error.message);
        return true;
      }
      return true;
    }

    async logout() {
      const supabase = this.getSupabase();
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Supabase signout warning:', e);
        }
      }
      this.saveLocalSession(null);
    }

    // ------------------------------------------------------------------------
    // COMMUNITY NOTES CRUD & STORAGE (Multi-User, Raw File Upload)
    // ------------------------------------------------------------------------
    async getAllNotesAsync() {
      const supabase = this.getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map(n => ({
              id: n.id,
              uploaderId: n.uploader_id,
              uploaderName: n.uploader_name,
              uploaderAvatar: n.uploader_avatar,
              title: n.title,
              subjectId: n.subject_id,
              subjectName: n.subject_name,
              moduleName: n.module_name,
              topicName: n.topic_name,
              category: n.category,
              description: n.description,
              tags: n.tags || [],
              storagePath: n.storage_path,
              fileUrl: n.file_url || '',
              fileName: n.file_name,
              fileType: n.file_type,
              fileSize: n.file_size,
              version: n.version,
              downloadsCount: n.downloads_count || 0,
              viewsCount: n.views_count || 0,
              ratingSum: n.rating_sum || 0,
              ratingCount: n.rating_count || 0,
              isVerified: n.is_verified !== false,
              createdAt: n.created_at,
              updatedAt: n.updated_at
            }));
          }
        } catch (err) {
          console.warn('Supabase notes query error:', err);
        }
      }
      return this.getAllNotes();
    }

    getAllNotes() {
      return JSON.parse(localStorage.getItem(STORAGE_DEV_NOTES) || '[]');
    }

    getNoteById(id) {
      const notes = this.getAllNotes();
      return notes.find((n) => n.id === id);
    }

    getFileBlob(noteId) {
      return fileBlobsMap.get(noteId) || null;
    }

    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async addNoteAsync(data, file) {
      if (!this.currentUser) throw new Error('You must be authenticated to share notes.');
      if (!file) throw new Error('Please select a valid file to upload.');

      const cleanFileName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : 'Study_Notes.pdf';
      const fileExt = cleanFileName.split('.').pop().toUpperCase() || 'PDF';
      const formattedSize = this.formatFileSize(file.size);
      const uniqueNoteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const storagePath = `notes/${this.currentUser.id}/${uniqueNoteId}/${cleanFileName}`;

      const supabase = this.getSupabase();
      if (supabase) {
        // 1. Upload original File directly to Supabase Storage bucket
        const { data: uploadRes, error: uploadErr } = await supabase.storage
          .from('community-notes')
          .upload(storagePath, file, {
            contentType: file.type || 'application/pdf',
            upsert: false
          });

        if (uploadErr) {
          throw new Error(`Storage upload failed: ${uploadErr.message}`);
        }

        // 2. Get Public or Signed URL
        const { data: urlData } = supabase.storage
          .from('community-notes')
          .getPublicUrl(storagePath);
        const fileUrl = urlData ? urlData.publicUrl : '';

        // 3. Create Note record in PostgreSQL notes table
        const { data: inserted, error: dbErr } = await supabase
          .from('notes')
          .insert([{
            uploader_id: this.currentUser.id, // Strictly authenticated user ID
            uploader_name: this.currentUser.fullName,
            uploader_avatar: this.currentUser.avatarGradient,
            title: data.title.trim(),
            subject_id: data.subjectId || 'BS-M101',
            subject_name: data.subjectName || data.subject,
            module_name: data.moduleName || 'Module I',
            topic_name: data.topicName || '',
            category: data.category || 'Handwritten Notes',
            description: data.description || '',
            tags: data.tags && Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
            storage_path: storagePath,
            file_url: fileUrl,
            file_name: cleanFileName,
            file_type: fileExt,
            file_size: formattedSize,
            version: 1
          }])
          .select()
          .single();

        if (dbErr) {
          // Cleanup orphaned storage object
          try { await supabase.storage.from('community-notes').remove([storagePath]); } catch (e) {}
          throw new Error(`Database record failed: ${dbErr.message}`);
        }

        return inserted;
      }

      // Offline / Local Dev Fallback: Retain exact binary Blob in memory map
      fileBlobsMap.set(uniqueNoteId, file);
      const blobUrl = URL.createObjectURL(file);

      const notes = this.getAllNotes();
      const newNote = {
        id: uniqueNoteId,
        uploaderId: this.currentUser.id,
        uploaderName: this.currentUser.fullName,
        uploaderAvatar: this.currentUser.avatarGradient,
        title: data.title.trim(),
        subjectId: data.subjectId || 'BS-M101',
        subjectName: data.subjectName || data.subject,
        moduleName: data.moduleName || 'Module I',
        topicName: data.topicName || '',
        category: data.category || 'Handwritten Notes',
        description: data.description || '',
        tags: data.tags && Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
        storagePath: storagePath,
        fileUrl: blobUrl,
        fileName: cleanFileName,
        fileType: fileExt,
        fileSize: formattedSize,
        version: 1,
        downloadsCount: 0,
        viewsCount: 1,
        ratingSum: 0,
        ratingCount: 0,
        isVerified: true,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      notes.unshift(newNote);
      localStorage.setItem(STORAGE_DEV_NOTES, JSON.stringify(notes));
      this.addKarmaPoints(this.currentUser.id, 50);
      return newNote;
    }

    async updateNoteAsync(id, updatedFields, newFile = null) {
      if (!this.currentUser) throw new Error('Not authenticated');

      const supabase = this.getSupabase();
      if (supabase) {
        const updatePayload = {
          title: updatedFields.title,
          description: updatedFields.description,
          updated_at: new Date().toISOString()
        };

        if (newFile) {
          const cleanFileName = newFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileExt = cleanFileName.split('.').pop().toUpperCase() || 'PDF';
          const formattedSize = this.formatFileSize(newFile.size);
          const uniqueId = 'v' + Date.now();
          const storagePath = `notes/${this.currentUser.id}/${uniqueId}/${cleanFileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('community-notes')
            .upload(storagePath, newFile, { contentType: newFile.type || 'application/pdf', upsert: false });

          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('community-notes').getPublicUrl(storagePath);
            updatePayload.storage_path = storagePath;
            updatePayload.file_url = urlData ? urlData.publicUrl : '';
            updatePayload.file_name = cleanFileName;
            updatePayload.file_type = fileExt;
            updatePayload.file_size = formattedSize;
          }
        }

        const { data, error } = await supabase
          .from('notes')
          .update(updatePayload)
          .eq('id', id)
          .eq('uploader_id', this.currentUser.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }

      // Offline / Local Dev
      const notes = this.getAllNotes();
      const note = notes.find((n) => n.id === id);
      if (!note) throw new Error('Note not found');

      if (note.uploaderId !== this.currentUser.id && this.currentUser.role !== 'ADMIN') {
        throw new Error('Permission denied: You can only edit your own uploads.');
      }

      if (newFile) {
        fileBlobsMap.set(id, newFile);
        updatedFields.fileUrl = URL.createObjectURL(newFile);
        updatedFields.fileName = newFile.name;
        updatedFields.fileSize = this.formatFileSize(newFile.size);
        updatedFields.version = (note.version || 1) + 1;
      }

      const updated = notes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      });

      localStorage.setItem(STORAGE_DEV_NOTES, JSON.stringify(updated));
      return this.getNoteById(id);
    }

    async deleteNoteAsync(id) {
      if (!this.currentUser) throw new Error('Not authenticated');

      const supabase = this.getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
      }

      const notes = this.getAllNotes();
      const note = notes.find((n) => n.id === id);
      if (!note) return false;

      if (note.uploaderId !== this.currentUser.id && !['ADMIN', 'MODERATOR'].includes(this.currentUser.role)) {
        throw new Error('Permission denied: You can only delete your own uploads.');
      }

      fileBlobsMap.delete(id);
      const filtered = notes.filter((n) => n.id !== id);
      localStorage.setItem(STORAGE_DEV_NOTES, JSON.stringify(filtered));
      return true;
    }

    incrementDownload(id) {
      const notes = this.getAllNotes();
      const updated = notes.map((n) => {
        if (n.id === id) {
          return { ...n, downloadsCount: (n.downloadsCount || 0) + 1 };
        }
        return n;
      });
      localStorage.setItem(STORAGE_DEV_NOTES, JSON.stringify(updated));
      return this.getNoteById(id);
    }

    // ------------------------------------------------------------------------
    // DUPLICATE DETECTION
    // ------------------------------------------------------------------------
    checkDuplicate(title, subjectId) {
      if (!title) return null;
      const cleanTitle = title.toLowerCase().trim();
      const notes = this.getAllNotes();

      return notes.find((n) => {
        const isSameSubj = subjectId ? (n.subjectId === subjectId || n.subjectName.toLowerCase().includes(subjectId.toLowerCase())) : true;
        const nTitle = n.title.toLowerCase();
        const isSimilar = nTitle.includes(cleanTitle) || cleanTitle.includes(nTitle) || this.computeSimilarity(cleanTitle, nTitle) > 0.6;
        return isSameSubj && isSimilar;
      });
    }

    computeSimilarity(s1, s2) {
      const w1 = s1.split(/\s+/);
      const w2 = s2.split(/\s+/);
      let match = 0;
      w1.forEach(w => { if (w.length > 2 && w2.includes(w)) match++; });
      return (match * 2) / (w1.length + w2.length);
    }

    // ------------------------------------------------------------------------
    // RATINGS & REVIEWS
    // ------------------------------------------------------------------------
    rateNote(noteId, stars) {
      if (!this.currentUser) throw new Error('Must be authenticated to rate.');
      stars = Math.max(1, Math.min(5, parseInt(stars, 10)));

      const ratings = JSON.parse(localStorage.getItem(STORAGE_DEV_RATINGS) || '{}');
      const userRatings = ratings[this.currentUser.id] || {};
      const previousStars = userRatings[noteId];

      userRatings[noteId] = stars;
      ratings[this.currentUser.id] = userRatings;
      localStorage.setItem(STORAGE_DEV_RATINGS, JSON.stringify(ratings));

      const notes = this.getAllNotes();
      const updated = notes.map((n) => {
        if (n.id === noteId) {
          let sum = n.ratingSum || 0;
          let count = n.ratingCount || 0;
          if (previousStars) {
            sum = sum - previousStars + stars;
          } else {
            sum += stars;
            count += 1;
          }
          return { ...n, ratingSum: sum, ratingCount: count };
        }
        return n;
      });
      localStorage.setItem(STORAGE_DEV_NOTES, JSON.stringify(updated));
      return this.getNoteById(noteId);
    }

    getUserRatingForNote(noteId) {
      if (!this.currentUser) return 0;
      const ratings = JSON.parse(localStorage.getItem(STORAGE_DEV_RATINGS) || '{}');
      const userRatings = ratings[this.currentUser.id] || {};
      return userRatings[noteId] || 0;
    }

    // ------------------------------------------------------------------------
    // BOOKMARKS (User-Specific)
    // ------------------------------------------------------------------------
    getUserBookmarks() {
      if (!this.currentUser) return [];
      const allBookmarks = JSON.parse(localStorage.getItem(STORAGE_DEV_BOOKMARKS) || '{}');
      return allBookmarks[this.currentUser.id] || [];
    }

    toggleBookmark(itemType, itemId, title, subtitle) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const allBookmarks = JSON.parse(localStorage.getItem(STORAGE_DEV_BOOKMARKS) || '{}');
      let userList = allBookmarks[this.currentUser.id] || [];

      const exists = userList.some((b) => b.itemId === itemId);
      if (exists) {
        userList = userList.filter((b) => b.itemId !== itemId);
      } else {
        userList.push({
          id: 'bm_' + Date.now(),
          itemType,
          itemId,
          title,
          subtitle,
          savedAt: new Date().toISOString()
        });
      }

      allBookmarks[this.currentUser.id] = userList;
      localStorage.setItem(STORAGE_DEV_BOOKMARKS, JSON.stringify(allBookmarks));
      return !exists;
    }

    isBookmarked(itemId) {
      const list = this.getUserBookmarks();
      return list.some((b) => b.itemId === itemId);
    }

    // ------------------------------------------------------------------------
    // USER-SPECIFIC TOPIC PROGRESS
    // ------------------------------------------------------------------------
    getUserProgress() {
      if (!this.currentUser) return {};
      const allProg = JSON.parse(localStorage.getItem(STORAGE_DEV_PROGRESS) || '{}');
      return allProg[this.currentUser.id] || {};
    }

    toggleTopicProgress(courseId, topicName) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const allProg = JSON.parse(localStorage.getItem(STORAGE_DEV_PROGRESS) || '{}');
      const userProg = allProg[this.currentUser.id] || {};
      const courseProg = userProg[courseId] || [];

      const idx = courseProg.indexOf(topicName);
      if (idx > -1) {
        courseProg.splice(idx, 1);
      } else {
        courseProg.push(topicName);
        this.addKarmaPoints(this.currentUser.id, 10);
      }

      userProg[courseId] = courseProg;
      allProg[this.currentUser.id] = userProg;
      localStorage.setItem(STORAGE_DEV_PROGRESS, JSON.stringify(allProg));
      return courseProg.includes(topicName);
    }

    // ------------------------------------------------------------------------
    // ACADEMIC Q&A FORUM
    // ------------------------------------------------------------------------
    getAllQuestions() {
      return JSON.parse(localStorage.getItem(STORAGE_DEV_QUESTIONS) || '[]');
    }

    askQuestion(title, courseId, moduleName, details, tags) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const questions = this.getAllQuestions();
      const newQ = {
        id: 'q_' + Date.now(),
        userId: this.currentUser.id,
        userName: this.currentUser.fullName,
        userAvatar: this.currentUser.avatarGradient,
        title: title.trim(),
        courseId,
        moduleName,
        details: details.trim(),
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        upvotes: 1,
        isSolved: false,
        answers: [],
        createdAt: new Date().toISOString()
      };

      questions.unshift(newQ);
      localStorage.setItem(STORAGE_DEV_QUESTIONS, JSON.stringify(questions));
      this.addKarmaPoints(this.currentUser.id, 20);
      return newQ;
    }

    answerQuestion(questionId, text) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const questions = this.getAllQuestions();
      const q = questions.find((item) => item.id === questionId);
      if (!q) throw new Error('Question not found');

      const newAns = {
        id: 'ans_' + Date.now(),
        userId: this.currentUser.id,
        userName: this.currentUser.fullName,
        userAvatar: this.currentUser.avatarGradient,
        text: text.trim(),
        upvotes: 0,
        isAccepted: false,
        createdAt: new Date().toISOString()
      };

      q.answers.push(newAns);
      localStorage.setItem(STORAGE_DEV_QUESTIONS, JSON.stringify(questions));
      this.addKarmaPoints(this.currentUser.id, 30);
      return newAns;
    }

    // ------------------------------------------------------------------------
    // COMMUNITY CHAT
    // ------------------------------------------------------------------------
    getChatMessages(channel = 'general') {
      const all = JSON.parse(localStorage.getItem(STORAGE_DEV_CHAT) || '[]');
      return all.filter((m) => m.channel === channel);
    }

    sendChatMessage(channel, text) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const all = JSON.parse(localStorage.getItem(STORAGE_DEV_CHAT) || '[]');
      const newMsg = {
        id: 'msg_' + Date.now(),
        channel,
        userId: this.currentUser.id,
        userName: this.currentUser.fullName,
        userRole: this.currentUser.role,
        userAvatar: this.currentUser.avatarGradient,
        text: text.trim(),
        createdAt: new Date().toISOString()
      };

      all.push(newMsg);
      localStorage.setItem(STORAGE_DEV_CHAT, JSON.stringify(all));
      return newMsg;
    }

    // ------------------------------------------------------------------------
    // ANNOUNCEMENTS & CALENDAR
    // ------------------------------------------------------------------------
    getAnnouncements() {
      return JSON.parse(localStorage.getItem(STORAGE_DEV_ANNOUNCEMENTS) || '[]');
    }

    addAnnouncement(title, category, content, badgeType = 'OFFICIAL') {
      if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
        throw new Error('Permission denied: Only ADMIN can broadcast announcements.');
      }
      const annList = this.getAnnouncements();
      const newAnn = {
        id: 'ann_' + Date.now(),
        title: title.trim(),
        category,
        badgeType,
        authorName: this.currentUser.fullName,
        content: content.trim(),
        isPinned: false,
        createdAt: new Date().toISOString()
      };
      annList.unshift(newAnn);
      localStorage.setItem(STORAGE_DEV_ANNOUNCEMENTS, JSON.stringify(annList));
      return newAnn;
    }

    getCalendarEvents() {
      return JSON.parse(localStorage.getItem(STORAGE_DEV_CALENDAR) || '[]');
    }

    // ------------------------------------------------------------------------
    // MODERATION & REPORTS
    // ------------------------------------------------------------------------
    reportContent(itemType, itemId, reason) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const reports = JSON.parse(localStorage.getItem(STORAGE_DEV_REPORTS) || '[]');
      const newReport = {
        id: 'rep_' + Date.now(),
        reporterId: this.currentUser.id,
        reporterName: this.currentUser.fullName,
        itemType,
        itemId,
        reason,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      reports.unshift(newReport);
      localStorage.setItem(STORAGE_DEV_REPORTS, JSON.stringify(reports));
      return newReport;
    }

    getAllReports() {
      return JSON.parse(localStorage.getItem(STORAGE_DEV_REPORTS) || '[]');
    }

    // ------------------------------------------------------------------------
    // USER STATS & KARMA
    // ------------------------------------------------------------------------
    getUserStats(userId = null) {
      const targetUserId = userId || (this.currentUser ? this.currentUser.id : null);
      if (!targetUserId) {
        return { totalUploads: 0, totalDownloads: 0, avgRating: '0.0', karmaPoints: 0, badge: 'New Student' };
      }

      const notes = this.getAllNotes().filter((n) => n.uploaderId === targetUserId);
      const totalUploads = notes.length;
      const totalDownloads = notes.reduce((acc, n) => acc + (n.downloadsCount || 0), 0);

      let sum = 0;
      let count = 0;
      notes.forEach((n) => {
        if (n.ratingCount > 0) {
          sum += n.ratingSum;
          count += n.ratingCount;
        }
      });
      const avgRating = count > 0 ? (sum / count).toFixed(1) : '0.0';

      const users = JSON.parse(localStorage.getItem(STORAGE_DEV_USERS) || '[]');
      const user = users.find((u) => u.id === targetUserId);
      const karma = user ? (user.karmaPoints || user.karma_points || 0) : (this.currentUser && this.currentUser.id === targetUserId ? (this.currentUser.karmaPoints || 0) : 0);

      let badge = 'Student Contributor 📚';
      if (totalDownloads > 100 || karma > 400) badge = 'Master Contributor ⭐';
      if (user && user.role === 'ADMIN') badge = 'Academic Dean 🏛️';
      if (user && user.role === 'MODERATOR') badge = 'Faculty Moderator 🛡️';

      return {
        totalUploads,
        totalDownloads,
        avgRating,
        karmaPoints: karma,
        badge
      };
    }

    addKarmaPoints(userId, pts) {
      const users = JSON.parse(localStorage.getItem(STORAGE_DEV_USERS) || '[]');
      const idx = users.findIndex((u) => u.id === userId);
      if (idx > -1) {
        users[idx].karmaPoints = (users[idx].karmaPoints || 0) + pts;
        localStorage.setItem(STORAGE_DEV_USERS, JSON.stringify(users));
        if (this.currentUser && this.currentUser.id === userId) {
          this.saveLocalSession(users[idx]);
        }
      }
    }

    // ------------------------------------------------------------------------
    // ADMIN USER MANAGEMENT & ROLE ASSIGNMENT (DATABASE-PROTECTED)
    // ------------------------------------------------------------------------
    async getAllUsersAsync() {
      if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
        throw new Error('Access Denied: Only an existing ADMIN can view the user management roster.');
      }

      const supabase = this.getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, student_id, college, branch, semester, academic_year, role, avatar_url, karma_points, created_at')
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map(u => ({
              id: u.id,
              email: u.email,
              fullName: u.full_name,
              studentId: u.student_id || 'Not provided',
              college: u.college || 'Not provided',
              branch: u.branch || 'Computer Science & Engineering',
              semester: u.semester || 'Semester I',
              academicYear: u.academic_year || '2026-2027',
              role: u.role || 'STUDENT',
              avatarGradient: u.avatar_url || 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              karmaPoints: u.karma_points || 0,
              createdAt: u.created_at
            }));
          }
        } catch (err) {
          console.warn('Supabase profiles fetch warning:', err);
        }
      }

      const users = JSON.parse(localStorage.getItem(STORAGE_DEV_USERS) || '[]');
      if (users.length === 0 && this.currentUser) {
        return [{
          id: this.currentUser.id,
          email: this.currentUser.email,
          fullName: this.currentUser.fullName || 'Samir Gorai',
          studentId: this.currentUser.studentId || 'Not provided',
          college: this.currentUser.college || 'Not provided',
          branch: this.currentUser.branch || 'Computer Science & Engineering',
          semester: this.currentUser.semester || 'Semester I',
          academicYear: this.currentUser.academicYear || '2026-2027',
          role: this.currentUser.role || 'ADMIN',
          avatarGradient: this.currentUser.avatarGradient || 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          karmaPoints: this.currentUser.karmaPoints || 0,
          createdAt: new Date().toISOString()
        }];
      }

      return users.map(u => {
        const safeUser = { ...u };
        delete safeUser.passwordHash;
        delete safeUser.password;
        safeUser.karmaPoints = safeUser.karmaPoints || 0;
        safeUser.studentId = safeUser.studentId || 'Not provided';
        safeUser.college = safeUser.college || 'Not provided';
        return safeUser;
      });
    }

    async changeUserRoleAsync(targetUserId, newRole) {
      if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
        throw new Error('Access Denied: Only an existing ADMIN can change user roles.');
      }

      if (!['STUDENT', 'MODERATOR', 'ADMIN'].includes(newRole)) {
        throw new Error('Invalid role specified. Must be STUDENT, MODERATOR, or ADMIN.');
      }

      const supabase = this.getSupabase();
      if (supabase) {
        // Try RPC first (defined in schema)
        const { error: rpcErr } = await supabase.rpc('admin_set_user_role', {
          target_user_id: targetUserId,
          new_role: newRole
        });

        if (rpcErr) {
          // Direct table update fallback (governed by protect_profile_role_update trigger)
          const { error: tableErr } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUserId);

          if (tableErr) {
            throw new Error(`Role update failed: ${tableErr.message}`);
          }
        }

        return true;
      }

      // Local Fallback Mode
      const users = JSON.parse(localStorage.getItem(STORAGE_DEV_USERS) || '[]');
      const userIndex = users.findIndex(u => u.id === targetUserId);
      if (userIndex === -1) {
        throw new Error('Target user not found.');
      }

      users[userIndex].role = newRole;
      localStorage.setItem(STORAGE_DEV_USERS, JSON.stringify(users));

      if (this.currentUser.id === targetUserId) {
        this.currentUser.role = newRole;
        this.saveLocalSession(this.currentUser);
      }

      return true;
    }
  }

  // Export Singleton
  window.EduNotesAuthDB = new AuthDbService();
})();
