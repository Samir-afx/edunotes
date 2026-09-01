/**
 * ============================================================================
 * EDUNOTES — AUTHENTICATION & MULTI-USER DATABASE SERVICE (SUPABASE PRODUCTION)
 * Connects directly to Supabase Auth, PostgreSQL, Storage, and Realtime.
 * Strictly zero local mock/fallback user database.
 * ============================================================================
 */

(function () {
  'use strict';

  // Storage Key for Client Session Persistence Only
  const STORAGE_SESSION = 'edunotes_auth_session_v7';

  // Aggressively clear any legacy mock user data from localStorage
  try {
    const keysToPurge = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('dev_users') ||
        key.includes('edunotes_users') ||
        key.includes('demo') ||
        key.includes('mock') ||
        key.includes('sample')
      )) {
        keysToPurge.push(key);
      }
    }
    keysToPurge.forEach(k => localStorage.removeItem(k));
  } catch (e) {}

  class AuthDbService {
    constructor() {
      this.currentUser = this.loadLocalSession();
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

    async initSupabaseListener() {
      const supabase = this.getSupabase();
      if (!supabase) return;

      try {
        const { data } = await supabase.auth.getSession();
        if (data && data.session && data.session.user) {
          await this.syncSessionUser(data.session.user);
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            this.saveLocalSession(null);
          } else if (session && session.user) {
            await this.syncSessionUser(session.user);
          }
        });
      } catch (err) {
        console.warn('Supabase session listener notice:', err);
      }
    }

    async syncSessionUser(authUser) {
      const supabase = this.getSupabase();
      if (!supabase || !authUser) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        const cleanEmail = authUser.email.toLowerCase();
        const isSayang = cleanEmail === 'sayangorai298@gmail.com';

        if (profile) {
          const syncedUser = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            studentId: profile.student_id || 'Not provided',
            college: profile.college || 'Not provided',
            branch: profile.branch || 'Computer Science & Engineering',
            semester: profile.semester || 'Semester I',
            academicYear: profile.academic_year || '2026-2027',
            role: isSayang ? 'ADMIN' : (profile.role || 'STUDENT'),
            avatarGradient: profile.avatar_url || 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            bio: profile.bio || '',
            karmaPoints: profile.karma_points || 0
          };
          this.saveLocalSession(syncedUser);
        } else {
          // Auto-upsert profile for newly authenticated user
          const meta = authUser.user_metadata || {};
          const fallbackUser = {
            id: authUser.id,
            email: cleanEmail,
            full_name: meta.full_name || (isSayang ? 'Samir Gorai' : 'MAKAUT Student'),
            student_id: meta.student_id || ('MAK-' + authUser.id.slice(0, 8)),
            college: meta.college || 'MAKAUT Affiliated Institute',
            branch: meta.branch || 'Computer Science & Engineering',
            semester: meta.semester || 'Semester I',
            role: isSayang ? 'ADMIN' : 'STUDENT'
          };

          try {
            await supabase.from('profiles').upsert([fallbackUser], { onConflict: 'id' });
          } catch (e) {}

          this.saveLocalSession({
            id: fallbackUser.id,
            email: fallbackUser.email,
            fullName: fallbackUser.full_name,
            studentId: fallbackUser.student_id,
            college: fallbackUser.college,
            branch: fallbackUser.branch,
            semester: fallbackUser.semester,
            academicYear: '2026-2027',
            role: fallbackUser.role,
            avatarGradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            karmaPoints: 0
          });
        }
      } catch (err) {
        console.warn('Error syncing session user:', err);
      }
    }

    isAuthenticated() {
      return this.currentUser !== null;
    }

    getCurrentUser() {
      return this.currentUser;
    }

    // ------------------------------------------------------------------------
    // AUTHENTICATION: LOGIN, SIGNUP, LOGOUT
    // ------------------------------------------------------------------------
    async login(email, password) {
      const cleanEmail = email.toLowerCase().trim();
      const supabase = this.getSupabase();

      if (!supabase) {
        throw new Error('Database Connection Error: Supabase backend is not initialized. Please verify your network.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.user) {
        throw new Error('Authentication Error: No user returned from Supabase Auth.');
      }

      // Fetch user profile from Supabase profiles table
      let profile = null;
      try {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profErr && prof) {
          profile = prof;
        }
      } catch (e) {
        console.warn('Profile fetch note:', e);
      }

      const isSayang = cleanEmail === 'sayangorai298@gmail.com';

      // If profile record does not exist yet, upsert it
      if (!profile) {
        const meta = data.user.user_metadata || {};
        const newProf = {
          id: data.user.id,
          email: cleanEmail,
          full_name: meta.full_name || (isSayang ? 'Samir Gorai' : 'MAKAUT Student'),
          student_id: meta.student_id || ('MAK-' + data.user.id.slice(0, 8)),
          college: meta.college || 'MAKAUT Affiliated Institute',
          branch: meta.branch || 'Computer Science & Engineering',
          semester: meta.semester || 'Semester I',
          role: isSayang ? 'ADMIN' : 'STUDENT'
        };

        try {
          const { data: inserted } = await supabase.from('profiles').upsert([newProf]).select().single();
          if (inserted) profile = inserted;
        } catch (e) {
          console.warn('Profile direct insert note:', e);
        }

        if (!profile) profile = newProf;
      }

      const userObj = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || 'Student',
        studentId: profile.student_id || 'Not provided',
        college: profile.college || 'Not provided',
        branch: profile.branch || 'Computer Science & Engineering',
        semester: profile.semester || 'Semester I',
        academicYear: profile.academic_year || '2026-2027',
        role: isSayang ? 'ADMIN' : (profile.role || 'STUDENT'),
        avatarGradient: profile.avatar_url || 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        bio: profile.bio || '',
        karmaPoints: profile.karma_points || 0
      };

      this.saveLocalSession(userObj);
      return userObj;
    }

    async signup(formData) {
      const cleanEmail = formData.email.toLowerCase().trim();
      const isSayang = cleanEmail === 'sayangorai298@gmail.com';
      const supabase = this.getSupabase();

      if (!supabase) {
        throw new Error('Database Connection Error: Supabase backend is not initialized. Please verify your network.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            student_id: formData.studentId ? formData.studentId.trim() : ('MAK-' + Date.now().toString(36)),
            college: formData.college ? formData.college.trim() : 'MAKAUT Affiliated Institute',
            branch: formData.branch || 'Computer Science & Engineering',
            semester: formData.semester || 'Semester I'
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.user) {
        throw new Error('Registration failed: Supabase did not return a user record.');
      }

      // Upsert profile in Supabase profiles table
      try {
        await supabase.from('profiles').upsert([{
          id: data.user.id,
          email: cleanEmail,
          full_name: formData.fullName.trim(),
          student_id: formData.studentId ? formData.studentId.trim() : ('MAK-' + data.user.id.slice(0, 8)),
          college: formData.college ? formData.college.trim() : 'MAKAUT Affiliated Institute',
          branch: formData.branch || 'Computer Science & Engineering',
          semester: formData.semester || 'Semester I',
          role: isSayang ? 'ADMIN' : 'STUDENT'
        }], { onConflict: 'id' });
      } catch (upsertErr) {
        console.warn('Profile direct creation note:', upsertErr);
      }

      const isEmailConfirmed = Boolean(data.session) || Boolean(data.user.confirmed_at);
      if (!isEmailConfirmed) {
        return {
          requiresEmailConfirmation: true,
          email: cleanEmail,
          message: 'Account created! Please check your email to verify your account before logging in.'
        };
      }

      const userObj = {
        id: data.user.id,
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

    async resetPassword(email) {
      const cleanEmail = email.toLowerCase().trim();
      const supabase = this.getSupabase();
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (error) throw new Error(error.message);
        return true;
      }
      throw new Error('Supabase backend not connected.');
    }

    async logout() {
      const supabase = this.getSupabase();
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Supabase signout notice:', e);
        }
      }
      this.saveLocalSession(null);
    }

    // ------------------------------------------------------------------------
    // COMMUNITY NOTES CRUD & STORAGE (Multi-User, Raw Binary File Upload)
    // ------------------------------------------------------------------------
    async getAllNotesAsync() {
      const supabase = this.getSupabase();
      if (!supabase) return [];

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
            isVerified: Boolean(n.is_verified),
            createdAt: n.created_at,
            updatedAt: n.updated_at
          }));
        }
      } catch (err) {
        console.warn('Supabase notes fetch notice:', err);
      }
      return [];
    }

    getAllNotes() {
      return [];
    }

    async getNoteByIdAsync(id) {
      const supabase = this.getSupabase();
      if (!supabase) return null;

      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            uploaderId: data.uploader_id,
            uploaderName: data.uploader_name,
            uploaderAvatar: data.uploader_avatar,
            title: data.title,
            subjectId: data.subject_id,
            subjectName: data.subject_name,
            moduleName: data.module_name,
            topicName: data.topic_name,
            category: data.category,
            description: data.description,
            tags: data.tags || [],
            storagePath: data.storage_path,
            fileUrl: data.file_url || '',
            fileName: data.file_name,
            fileType: data.file_type,
            fileSize: data.file_size,
            version: data.version,
            downloadsCount: data.downloads_count || 0,
            viewsCount: data.views_count || 0,
            ratingSum: data.rating_sum || 0,
            ratingCount: data.rating_count || 0,
            isVerified: Boolean(data.is_verified),
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (e) {}
      return null;
    }

    async uploadNoteAsync(data, file) {
      if (!this.currentUser) throw new Error('Not authenticated');
      if (!file) throw new Error('No study material file attached');

      const supabase = this.getSupabase();
      if (!supabase) {
        throw new Error('Supabase Storage connection not available.');
      }

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileExt = cleanFileName.split('.').pop().toUpperCase() || 'PDF';
      const formattedSize = this.formatFileSize(file.size);
      const uniqueTimestamp = Date.now();
      const storagePath = `notes/${this.currentUser.id}/${uniqueTimestamp}/${cleanFileName}`;

      // 1. Upload Binary File to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('community-notes')
        .upload(storagePath, file, {
          contentType: file.type || 'application/pdf',
          upsert: true
        });

      if (uploadErr) {
        throw new Error(`Supabase Storage upload failed: ${uploadErr.message}`);
      }

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from('community-notes')
        .getPublicUrl(storagePath);
      const fileUrl = urlData ? urlData.publicUrl : '';

      // 3. Create Note record in PostgreSQL
      const { data: inserted, error: dbErr } = await supabase
        .from('notes')
        .insert([{
          uploader_id: this.currentUser.id,
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
        throw new Error(`Database record failed: ${dbErr.message}`);
      }

      return inserted;
    }

    async deleteNoteAsync(id) {
      if (!this.currentUser) throw new Error('Not authenticated');
      const supabase = this.getSupabase();
      if (!supabase) throw new Error('Supabase not connected');

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    }

    async incrementDownloadAsync(id) {
      const supabase = this.getSupabase();
      if (!supabase) return;
      try {
        const { data: current } = await supabase.from('notes').select('downloads_count').eq('id', id).single();
        if (current) {
          await supabase.from('notes').update({ downloads_count: (current.downloads_count || 0) + 1 }).eq('id', id);
        }
      } catch (e) {}
    }

    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // ------------------------------------------------------------------------
    // BOOKMARKS (Cross-Device, User-Specific)
    // ------------------------------------------------------------------------
    async getUserBookmarksAsync() {
      if (!this.currentUser) return [];
      const supabase = this.getSupabase();
      if (!supabase) return [];

      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', this.currentUser.id);

        if (!error && data) {
          return data.map(b => ({
            id: b.id,
            itemType: b.item_type,
            itemId: b.item_id,
            title: b.title,
            subtitle: b.subtitle,
            savedAt: b.created_at
          }));
        }
      } catch (e) {}
      return [];
    }

    async toggleBookmarkAsync(itemType, itemId, title, subtitle) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const supabase = this.getSupabase();
      if (!supabase) throw new Error('Supabase not connected');

      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', this.currentUser.id)
        .eq('item_id', itemId)
        .maybeSingle();

      if (existing) {
        await supabase.from('bookmarks').delete().eq('id', existing.id);
        return false;
      } else {
        await supabase.from('bookmarks').insert([{
          user_id: this.currentUser.id,
          item_type: itemType,
          item_id: itemId,
          title: title,
          subtitle: subtitle || ''
        }]);
        return true;
      }
    }

    // ------------------------------------------------------------------------
    // STUDENT PROGRESS (Cross-Device, User-Specific)
    // ------------------------------------------------------------------------
    async getUserProgressAsync() {
      if (!this.currentUser) return {};
      const supabase = this.getSupabase();
      if (!supabase) return {};

      try {
        const { data, error } = await supabase
          .from('student_progress')
          .select('*')
          .eq('user_id', this.currentUser.id)
          .eq('is_completed', true);

        if (!error && data) {
          const progMap = {};
          data.forEach(p => {
            if (!progMap[p.course_id]) progMap[p.course_id] = [];
            progMap[p.course_id].push(p.topic_name);
          });
          return progMap;
        }
      } catch (e) {}
      return {};
    }

    async toggleTopicProgressAsync(courseId, topicName) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const supabase = this.getSupabase();
      if (!supabase) throw new Error('Supabase not connected');

      const { data: existing } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .eq('course_id', courseId)
        .eq('topic_name', topicName)
        .maybeSingle();

      if (existing && existing.is_completed) {
        await supabase.from('student_progress').delete().eq('id', existing.id);
        return false;
      } else {
        await supabase.from('student_progress').upsert([{
          user_id: this.currentUser.id,
          course_id: courseId,
          topic_name: topicName,
          is_completed: true
        }], { onConflict: 'user_id,course_id,topic_name' });
        return true;
      }
    }

    // ------------------------------------------------------------------------
    // COMMUNITY CHAT (Cross-Device, Realtime Ready)
    // ------------------------------------------------------------------------
    async getChatMessagesAsync(channel = 'general') {
      const supabase = this.getSupabase();
      if (!supabase) return [];

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('channel', channel)
          .order('created_at', { ascending: true })
          .limit(100);

        if (!error && data) {
          return data.map(m => ({
            id: m.id,
            channel: m.channel,
            userId: m.user_id,
            userName: m.user_name,
            userRole: m.user_role,
            userAvatar: m.user_avatar,
            text: m.text,
            createdAt: m.created_at
          }));
        }
      } catch (e) {}
      return [];
    }

    async sendChatMessageAsync(channel, text) {
      if (!this.currentUser) throw new Error('Authentication required.');
      const supabase = this.getSupabase();
      if (!supabase) throw new Error('Supabase not connected');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          channel: channel,
          user_id: this.currentUser.id,
          user_name: this.currentUser.fullName,
          user_role: this.currentUser.role,
          user_avatar: this.currentUser.avatarGradient,
          text: text.trim()
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // ------------------------------------------------------------------------
    // ANNOUNCEMENTS & CALENDAR (Cross-Device)
    // ------------------------------------------------------------------------
    async getAnnouncementsAsync() {
      const supabase = this.getSupabase();
      if (!supabase) return [];

      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          return data.map(a => ({
            id: a.id,
            title: a.title,
            category: a.category,
            authorName: a.author_name,
            content: a.content,
            badgeType: a.badge_type || 'OFFICIAL',
            branch: a.branch,
            semester: a.semester,
            isPinned: Boolean(a.is_pinned),
            createdAt: a.created_at
          }));
        }
      } catch (e) {}
      return [];
    }

    async addAnnouncementAsync(title, category, content, badgeType = 'OFFICIAL') {
      if (!this.currentUser || !['ADMIN', 'CR'].includes(this.currentUser.role)) {
        throw new Error('Permission denied: Only Admin or Class Representative can broadcast announcements.');
      }
      const supabase = this.getSupabase();
      if (!supabase) throw new Error('Supabase not connected');

      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          creator_id: this.currentUser.id,
          title: title.trim(),
          category: category,
          author_name: this.currentUser.fullName,
          content: content.trim(),
          badge_type: badgeType,
          branch: this.currentUser.branch || 'Computer Science & Engineering',
          semester: this.currentUser.semester || 'Semester I',
          is_pinned: false
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    async getCalendarEventsAsync() {
      const supabase = this.getSupabase();
      if (!supabase) return [];

      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .order('event_date', { ascending: true });

        if (!error && data) {
          return data.map(e => ({
            id: e.id,
            title: e.title,
            eventType: e.event_type,
            eventDate: e.event_date,
            courseCode: e.course_code,
            description: e.description,
            isOfficial: Boolean(e.is_official),
            createdAt: e.created_at
          }));
        }
      } catch (e) {}
      return [];
    }

    // ------------------------------------------------------------------------
    // CLASS REPRESENTATIVE (CR) CLASS-SCOPED METHODS
    // ------------------------------------------------------------------------
    isCR() {
      return Boolean(this.currentUser && this.currentUser.role === 'CR');
    }

    isClassRepresentativeOrAdmin() {
      return Boolean(this.currentUser && (this.currentUser.role === 'CR' || this.currentUser.role === 'ADMIN'));
    }

    async getClassMembersAsync() {
      if (!this.currentUser || (this.currentUser.role !== 'CR' && this.currentUser.role !== 'ADMIN')) {
        throw new Error('Access Denied: Only a Class Representative or Admin can view class members.');
      }

      const branch = this.currentUser.branch || 'Computer Science & Engineering';
      const semester = this.currentUser.semester || 'Semester I';

      const supabase = this.getSupabase();
      if (!supabase) return [];

      try {
        const query = supabase
          .from('profiles')
          .select('id, email, full_name, student_id, college, branch, semester, role, avatar_url, karma_points, created_at')
          .order('full_name', { ascending: true });

        if (this.currentUser.role === 'CR') {
          query.eq('branch', branch).eq('semester', semester);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map(u => ({
            id: u.id,
            email: u.email,
            fullName: u.full_name,
            studentId: u.student_id || 'Not provided',
            college: u.college || 'Not provided',
            branch: u.branch,
            semester: u.semester,
            role: u.role || 'STUDENT',
            avatarGradient: u.avatar_url || 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            karmaPoints: u.karma_points || 0,
            createdAt: u.created_at
          }));
        }
      } catch (e) {}
      return [];
    }

    // ------------------------------------------------------------------------
    // ADMIN USER MANAGEMENT & ROLE ASSIGNMENT (DATABASE-PROTECTED)
    // ------------------------------------------------------------------------
    async getAllUsersAsync() {
      if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
        throw new Error('Access Denied: Only an existing ADMIN can view the user management roster.');
      }

      const supabase = this.getSupabase();
      if (!supabase) {
        throw new Error('Supabase database connection not available.');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, student_id, college, branch, semester, academic_year, role, avatar_url, karma_points, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to load users from database: ${error.message}`);
      }

      if (Array.isArray(data)) {
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

      return [];
    }

    async changeUserRoleAsync(targetUserId, newRole) {
      if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
        throw new Error('Access Denied: Only an existing ADMIN can change user roles.');
      }

      if (!['STUDENT', 'CR', 'MODERATOR', 'ADMIN'].includes(newRole)) {
        throw new Error('Invalid role specified. Must be STUDENT, CR, MODERATOR, or ADMIN.');
      }

      const supabase = this.getSupabase();
      if (!supabase) {
        throw new Error('Supabase database connection not available.');
      }

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

    // ------------------------------------------------------------------------
    // OFFICIAL SYLLABUS PDF VERSIONING & AUDIT SYSTEM (CR & ADMIN)
    // ------------------------------------------------------------------------
    async getActiveSyllabusVersionAsync() {
      const defaultOfficial = {
        id: 'syl_v1_official',
        version: 1,
        fileName: 'MAKAUT-sem126.pdf',
        storagePath: 'assets/MAKAUT-sem126.pdf',
        fileUrl: 'https://samir-afx.github.io/edunotes/assets/MAKAUT-sem126.pdf',
        fileSize: 2457600,
        changeSummary: 'Official First-Year AICTE/MAKAUT Syllabus (sem126-details)',
        isActive: true,
        uploadedBy: 'system',
        uploaderName: 'MAKAUT Academic Board',
        uploaderRole: 'OFFICIAL',
        createdAt: '2026-08-01T00:00:00.000Z'
      };

      const supabase = this.getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('syllabus_versions')
            .select('*')
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              version: data.version,
              fileName: data.file_name,
              storagePath: data.storage_path,
              fileUrl: data.file_url,
              fileSize: data.file_size || 0,
              changeSummary: data.change_summary || '',
              isActive: Boolean(data.is_active),
              uploadedBy: data.uploaded_by,
              uploaderName: data.uploader_name || 'Academic Leadership',
              uploaderRole: data.uploader_role || 'CR',
              createdAt: data.created_at
            };
          }
        } catch (e) {}
      }
      return defaultOfficial;
    }

    async getAllSyllabusVersionsAsync() {
      const defaultOfficial = {
        id: 'syl_v1_official',
        version: 1,
        fileName: 'MAKAUT-sem126.pdf',
        storagePath: 'assets/MAKAUT-sem126.pdf',
        fileUrl: 'https://samir-afx.github.io/edunotes/assets/MAKAUT-sem126.pdf',
        fileSize: 2457600,
        changeSummary: 'Official First-Year AICTE/MAKAUT Syllabus (sem126-details)',
        isActive: true,
        uploadedBy: 'system',
        uploaderName: 'MAKAUT Academic Board',
        uploaderRole: 'OFFICIAL',
        createdAt: '2026-08-01T00:00:00.000Z'
      };

      const supabase = this.getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('syllabus_versions')
            .select('*')
            .order('version', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            return data.map(d => ({
              id: d.id,
              version: d.version,
              fileName: d.file_name,
              storagePath: d.storage_path,
              fileUrl: d.file_url,
              fileSize: d.file_size || 0,
              changeSummary: d.change_summary || '',
              isActive: Boolean(d.is_active),
              uploadedBy: d.uploaded_by,
              uploaderName: d.uploader_name || 'Academic Leadership',
              uploaderRole: d.uploader_role || 'CR',
              createdAt: d.created_at
            }));
          }
        } catch (e) {}
      }
      return [defaultOfficial];
    }

    async getSyllabusAuditLogsAsync() {
      if (!this.currentUser || (this.currentUser.role !== 'CR' && this.currentUser.role !== 'ADMIN')) {
        throw new Error('Access Denied: Only a Class Representative or Administrator can view the syllabus audit log.');
      }

      const supabase = this.getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('syllabus_audit_log')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            return data.map(a => ({
              id: a.id,
              userId: a.user_id,
              userName: a.user_name,
              userRole: a.user_role,
              action: a.action,
              previousVersion: a.previous_version,
              newVersion: a.new_version,
              changeSummary: a.change_summary,
              createdAt: a.created_at
            }));
          }
        } catch (e) {}
      }
      return [];
    }

    async publishNewSyllabusPDFAsync({ file, changeSummary }) {
      if (!this.currentUser || (this.currentUser.role !== 'CR' && this.currentUser.role !== 'ADMIN')) {
        throw new Error('Access Denied: Only a verified Class Representative (CR) or Administrator can publish a syllabus PDF.');
      }

      if (!file) throw new Error('No PDF file provided.');

      // 1. File Name and Size Validation
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Invalid file format: Only valid PDF documents (.pdf) are allowed.');
      }

      if (file.size <= 0) {
        throw new Error('Corrupted file: The selected file is empty.');
      }

      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_SIZE) {
        throw new Error('File size exceeds the 50MB limit.');
      }

      // 2. Binary Signature Validation (%PDF-)
      const slice = file.slice(0, 5);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const header = String.fromCharCode(...bytes);
      if (header !== '%PDF-') {
        throw new Error('Invalid PDF document: The file does not have a valid %PDF- binary header signature.');
      }

      const allVersions = await this.getAllSyllabusVersionsAsync();
      const nextVer = (allVersions.length > 0 ? Math.max(...allVersions.map(v => v.version)) : 1) + 1;
      const prevVer = (await this.getActiveSyllabusVersionAsync()).version || 1;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `syllabus/official-v${nextVer}-${Date.now()}-${safeName}`;

      const supabase = this.getSupabase();
      if (!supabase) throw new Error('Supabase connection not available.');

      // Upload binary to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('community-notes')
        .upload(storagePath, file, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadErr) {
        throw new Error(`Supabase Storage upload failed: ${uploadErr.message}`);
      }

      const { data: urlData } = supabase.storage.from('community-notes').getPublicUrl(storagePath);
      const publicUrl = urlData ? urlData.publicUrl : '';

      // Atomic RPC Database insertion and audit logging
      const { data: rpcData, error: rpcErr } = await supabase.rpc('publish_syllabus_version', {
        p_file_name: file.name,
        p_storage_path: storagePath,
        p_file_url: publicUrl,
        p_file_size: file.size,
        p_change_summary: changeSummary || `Updated by ${this.currentUser.fullName}`
      });

      if (rpcErr) {
        // Direct table fallback
        await supabase.from('syllabus_versions').update({ is_active: false }).eq('is_active', true);
        const { data: newRow, error: insertErr } = await supabase.from('syllabus_versions').insert([{
          version: nextVer,
          file_name: file.name,
          storage_path: storagePath,
          file_url: publicUrl,
          file_size: file.size,
          change_summary: changeSummary || `Updated by ${this.currentUser.fullName}`,
          is_active: true,
          uploaded_by: this.currentUser.id,
          uploader_name: this.currentUser.fullName,
          uploader_role: this.currentUser.role
        }]).select().single();

        if (insertErr) {
          throw new Error(`Failed to record syllabus version: ${insertErr.message}`);
        }

        await supabase.from('syllabus_audit_log').insert([{
          user_id: this.currentUser.id,
          user_name: this.currentUser.fullName,
          user_role: this.currentUser.role,
          action: 'UPLOAD_NEW_VERSION',
          previous_version: prevVer,
          new_version: nextVer,
          change_summary: changeSummary || `Updated by ${this.currentUser.fullName}`
        }]);

        return newRow;
      }

      return rpcData;
    }

    async restoreSyllabusVersionAsync(versionId) {
      if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
        throw new Error('Access Denied: Only an Administrator can restore previous syllabus versions.');
      }

      const supabase = this.getSupabase();
      if (!supabase) throw new Error('Supabase not connected');

      const { data, error } = await supabase.rpc('admin_restore_syllabus_version', {
        p_version_id: versionId
      });

      if (error) {
        await supabase.from('syllabus_versions').update({ is_active: false }).eq('is_active', true);
        const { data: restored, error: upErr } = await supabase
          .from('syllabus_versions')
          .update({ is_active: true })
          .eq('id', versionId)
          .select()
          .single();

        if (upErr) throw new Error(`Restore failed: ${upErr.message}`);
        return restored;
      }

      return data;
    }
  }

  // Export Singleton
  window.EduNotesAuthDB = new AuthDbService();
})();
