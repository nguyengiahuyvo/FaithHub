export type Language = "en" | "de" | "vi";

export const languageLabels: Record<Language, string> = {
  en: "English",
  de: "Deutsch",
  vi: "Tiếng Việt",
};

const translations = {
  // Tab bar
  tab_home: { en: "Home", de: "Startseite", vi: "Trang chủ" },
  tab_tasks: { en: "Tasks", de: "Aufgaben", vi: "Công việc" },
  tab_calendar: { en: "Calendar", de: "Kalender", vi: "Lịch" },
  tab_profile: { en: "Profile", de: "Profil", vi: "Hồ sơ" },

  // Auth screen
  auth_brand: { en: "✞ ​FaithHub", de: "✞ FaithHub", vi: "✞ FaithHub" },
  auth_login_title: {
    en: "Welcome back.",
    de: "Willkommen zurück.",
    vi: "Chào mừng trở lại.",
  },
  auth_login_desc: {
    en: "Sign in to continue your reading plan, saved prayers, and community updates.",
    de: "Melde dich an, um deinen Leseplan, gespeicherte Gebete und Neuigkeiten fortzusetzen.",
    vi: "Đăng nhập để tiếp tục kế hoạch đọc, lời cầu nguyện và cập nhật cộng đồng.",
  },
  auth_login_action: { en: "Log In", de: "Anmelden", vi: "Đăng nhập" },
  auth_login_switch_label: {
    en: "New here?",
    de: "Neu hier?",
    vi: "Mới ở đây?",
  },
  auth_login_switch_action: {
    en: "Create an account",
    de: "Konto erstellen",
    vi: "Tạo tài khoản",
  },
  auth_signup_title: {
    en: "Create your account.",
    de: "Erstelle dein Konto.",
    vi: "Tạo tài khoản.",
  },
  auth_signup_desc: {
    en: "Start with a simple profile so FaithHub can keep your progress and preferences in sync.",
    de: "Beginne mit einem einfachen Profil, damit FaithHub deinen Fortschritt synchronisieren kann.",
    vi: "Bắt đầu với hồ sơ đơn giản để FaithHub đồng bộ tiến trình của bạn.",
  },
  auth_signup_action: { en: "Sign Up", de: "Registrieren", vi: "Đăng ký" },
  auth_signup_switch_label: {
    en: "Already have an account?",
    de: "Bereits ein Konto?",
    vi: "Đã có tài khoản?",
  },
  auth_signup_switch_action: {
    en: "Log in instead",
    de: "Stattdessen anmelden",
    vi: "Đăng nhập",
  },
  auth_full_name: {
    en: "Full name",
    de: "Vollständiger Name",
    vi: "Họ và tên",
  },
  auth_full_name_placeholder: {
    en: "Enter your full name",
    de: "Gib deinen vollständigen Namen ein",
    vi: "Nhập họ và tên",
  },
  auth_email: { en: "Email", de: "E-Mail", vi: "Email" },
  auth_email_placeholder: {
    en: "you@example.com",
    de: "du@beispiel.de",
    vi: "ban@example.com",
  },
  auth_password: { en: "Password", de: "Passwort", vi: "Mật khẩu" },
  auth_password_placeholder_login: {
    en: "Enter your password",
    de: "Passwort eingeben",
    vi: "Nhập mật khẩu",
  },
  auth_password_placeholder_signup: {
    en: "Create a password",
    de: "Passwort erstellen",
    vi: "Tạo mật khẩu",
  },
  auth_confirm_password: {
    en: "Confirm password",
    de: "Passwort bestätigen",
    vi: "Xác nhận mật khẩu",
  },
  auth_confirm_password_placeholder: {
    en: "Re-enter your password",
    de: "Passwort erneut eingeben",
    vi: "Nhập lại mật khẩu",
  },
  auth_pill_devotionals: {
    en: "Daily devotionals",
    de: "Tägliche Andachten",
    vi: "Suy ngẫm hàng ngày",
  },
  auth_pill_prayer: {
    en: "Prayer journal",
    de: "Gebetstagebuch",
    vi: "Nhật ký cầu nguyện",
  },
  auth_or: { en: "or", de: "oder", vi: "hoặc" },
  auth_terms: {
    en: "By continuing, you agree to FaithHub\u2019s terms and privacy policy.",
    de: "Mit der Fortsetzung stimmst du den Nutzungsbedingungen und der Datenschutzrichtlinie zu.",
    vi: "Bằng việc tiếp tục, bạn đồng ý với điều khoản và chính sách bảo mật.",
  },
  auth_error_missing: {
    en: "Missing fields",
    de: "Fehlende Felder",
    vi: "Thiếu thông tin",
  },
  auth_error_missing_msg: {
    en: "Please fill in your email and password to continue.",
    de: "Bitte gib deine E-Mail und dein Passwort ein.",
    vi: "Vui lòng nhập email và mật khẩu để tiếp tục.",
  },
  auth_error_mismatch: {
    en: "Passwords don't match",
    de: "Passwörter stimmen nicht überein",
    vi: "Mật khẩu không khớp",
  },
  auth_error_mismatch_msg: {
    en: "The passwords you entered don't match. Please try again.",
    de: "Die eingegebenen Passwörter stimmen nicht überein. Bitte versuche es erneut.",
    vi: "Mật khẩu bạn nhập không khớp. Vui lòng thử lại.",
  },
  auth_error_short: {
    en: "Password too short",
    de: "Passwort zu kurz",
    vi: "Mật khẩu quá ngắn",
  },
  auth_error_short_msg: {
    en: "Your password must be at least 6 characters long.",
    de: "Dein Passwort muss mindestens 6 Zeichen lang sein.",
    vi: "Mật khẩu phải có ít nhất 6 ký tự.",
  },
  auth_error_login: {
    en: "Login failed",
    de: "Anmeldung fehlgeschlagen",
    vi: "Đăng nhập thất bại",
  },
  auth_error_signup: {
    en: "Sign-up failed",
    de: "Registrierung fehlgeschlagen",
    vi: "Đăng ký thất bại",
  },
  auth_error_apple: {
    en: "Apple Sign-In failed",
    de: "Apple-Anmeldung fehlgeschlagen",
    vi: "Đăng nhập Apple thất bại",
  },
  auth_try_again: { en: "Try Again", de: "Erneut versuchen", vi: "Thử lại" },

  // Email verification
  verify_title: {
    en: "Verify your email",
    de: "E-Mail bestätigen",
    vi: "Xác minh email",
  },
  verify_desc: {
    en: "We've sent a verification link to your email. Please check your inbox and tap the link to continue.",
    de: "Wir haben einen Bestätigungslink an deine E-Mail gesendet. Bitte prüfe dein Postfach und tippe auf den Link.",
    vi: "Chúng tôi đã gửi liên kết xác minh đến email của bạn. Vui lòng kiểm tra hộp thư và nhấn vào liên kết.",
  },
  verify_resend: {
    en: "Resend email",
    de: "Erneut senden",
    vi: "Gửi lại email",
  },
  verify_resent: {
    en: "Email sent!",
    de: "E-Mail gesendet!",
    vi: "Đã gửi email!",
  },
  verify_check: {
    en: "I've verified my email",
    de: "Ich habe meine E-Mail bestätigt",
    vi: "Tôi đã xác minh email",
  },
  verify_not_yet: {
    en: "Email not verified yet. Please check your inbox.",
    de: "E-Mail noch nicht bestätigt. Bitte prüfe dein Postfach.",
    vi: "Email chưa được xác minh. Vui lòng kiểm tra hộp thư.",
  },
  verify_signout: {
    en: "Sign out",
    de: "Abmelden",
    vi: "Đăng xuất",
  },

  // Reset password
  auth_forgot_password: {
    en: "Forgot password?",
    de: "Passwort vergessen?",
    vi: "Quên mật khẩu?",
  },
  auth_reset_title: {
    en: "Reset password",
    de: "Passwort zurücksetzen",
    vi: "Đặt lại mật khẩu",
  },
  auth_reset_desc: {
    en: "Enter your email and we'll send you a link to reset your password.",
    de: "Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.",
    vi: "Nhập email và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.",
  },
  auth_reset_send: {
    en: "Send reset link",
    de: "Link senden",
    vi: "Gửi liên kết",
  },
  auth_reset_sent: {
    en: "Password reset email sent! Check your inbox.",
    de: "E-Mail zum Zurücksetzen gesendet! Prüfe dein Postfach.",
    vi: "Đã gửi email đặt lại mật khẩu! Kiểm tra hộp thư.",
  },
  auth_reset_error: {
    en: "Could not send reset email. Please check your email and try again.",
    de: "E-Mail konnte nicht gesendet werden. Bitte überprüfe deine E-Mail.",
    vi: "Không thể gửi email. Vui lòng kiểm tra email và thử lại.",
  },
  profile_reset_password: {
    en: "Reset password",
    de: "Passwort zurücksetzen",
    vi: "Đặt lại mật khẩu",
  },
  profile_reset_sent: {
    en: "Reset link sent to your email!",
    de: "Link zum Zurücksetzen an deine E-Mail gesendet!",
    vi: "Đã gửi liên kết đặt lại đến email!",
  },

  // Firebase errors
  firebase_invalid_email: {
    en: "The email address you entered isn't valid. Please check and try again.",
    de: "Die eingegebene E-Mail-Adresse ist ungültig. Bitte überprüfe sie.",
    vi: "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.",
  },
  firebase_user_disabled: {
    en: "This account has been disabled. Please contact support for help.",
    de: "Dieses Konto wurde deaktiviert. Bitte kontaktiere den Support.",
    vi: "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.",
  },
  firebase_wrong_password: {
    en: "The email or password you entered is incorrect. Please try again.",
    de: "E-Mail oder Passwort ist falsch. Bitte versuche es erneut.",
    vi: "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
  },
  firebase_email_in_use: {
    en: "An account with this email already exists. Try logging in instead.",
    de: "Ein Konto mit dieser E-Mail existiert bereits. Versuche dich anzumelden.",
    vi: "Tài khoản với email này đã tồn tại. Hãy thử đăng nhập.",
  },
  firebase_weak_password: {
    en: "Your password must be at least 6 characters long.",
    de: "Dein Passwort muss mindestens 6 Zeichen lang sein.",
    vi: "Mật khẩu phải có ít nhất 6 ký tự.",
  },
  firebase_too_many: {
    en: "Too many attempts. Please wait a moment and try again.",
    de: "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.",
    vi: "Quá nhiều lần thử. Vui lòng đợi và thử lại.",
  },
  firebase_network: {
    en: "Unable to connect. Please check your internet connection.",
    de: "Keine Verbindung. Bitte überprüfe deine Internetverbindung.",
    vi: "Không thể kết nối. Vui lòng kiểm tra kết nối internet.",
  },
  firebase_default: {
    en: "Something went wrong. Please try again.",
    de: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    vi: "Đã xảy ra lỗi. Vui lòng thử lại.",
  },

  // Home — join org
  join_title: {
    en: "Join your organization",
    de: "Tritt deiner Organisation bei",
    vi: "Tham gia tổ chức",
  },
  join_desc: {
    en: "Enter the code shared by your church or group leader to connect with your community.",
    de: "Gib den Code ein, den du von deiner Gemeinde erhalten hast.",
    vi: "Nhập mã được chia sẻ bởi nhà thờ hoặc trưởng nhóm của bạn.",
  },
  join_label: {
    en: "Organization code",
    de: "Organisationscode",
    vi: "Mã tổ chức",
  },
  join_placeholder: {
    en: "e.g. GRACE-2024",
    de: "z.B. GRACE-2024",
    vi: "VD: GRACE-2024",
  },
  join_button: {
    en: "Join Organization",
    de: "Organisation beitreten",
    vi: "Tham gia tổ chức",
  },
  join_error_title: {
    en: "Couldn't join",
    de: "Beitritt fehlgeschlagen",
    vi: "Không thể tham gia",
  },
  join_error_empty: {
    en: "Please enter an organization code.",
    de: "Bitte gib einen Organisationscode ein.",
    vi: "Vui lòng nhập mã tổ chức.",
  },

  // Home — dashboard
  home_welcome: { en: "Welcome", de: "Willkommen", vi: "Chào mừng" },
  home_desc: {
    en: "Manage tasks and events with your community from the tabs below.",
    de: "Verwalte Aufgaben und Termine mit deiner Gemeinschaft über die Tabs unten.",
    vi: "Quản lý công việc và sự kiện cộng đồng từ các tab bên dưới.",
  },
  home_members: { en: "Members", de: "Mitglieder", vi: "Thành viên" },
  home_no_members: {
    en: "No members yet.",
    de: "Noch keine Mitglieder.",
    vi: "Chưa có thành viên.",
  },
  home_member_fallback: { en: "Member", de: "Mitglied", vi: "Thành viên" },

  // Tasks
  tasks_title: { en: "Tasks", de: "Aufgaben", vi: "Công việc" },
  tasks_empty: {
    en: "No tasks yet",
    de: "Noch keine Aufgaben",
    vi: "Chưa có công việc",
  },
  tasks_empty_hint: {
    en: "Tap + to create your first task",
    de: "Tippe auf + für die erste Aufgabe",
    vi: "Nhấn + để tạo công việc đầu tiên",
  },
  tasks_new: { en: "New Task", de: "Neue Aufgabe", vi: "Công việc mới" },
  tasks_edit: { en: "Edit Task", de: "Aufgabe bearbeiten", vi: "Sửa công việc" },
  tasks_title_label: { en: "Title", de: "Titel", vi: "Tiêu đề" },
  tasks_title_placeholder: {
    en: "What needs to be done?",
    de: "Was muss erledigt werden?",
    vi: "Cần làm gì?",
  },
  tasks_desc_label: {
    en: "Description (optional)",
    de: "Beschreibung (optional)",
    vi: "Mô tả (tùy chọn)",
  },
  tasks_desc_placeholder: {
    en: "Add details...",
    de: "Details hinzufügen...",
    vi: "Thêm chi tiết...",
  },
  tasks_by: { en: "by", de: "von", vi: "bởi" },
  tasks_priority: {
    en: "Priority",
    de: "Priorität",
    vi: "Mức độ ưu tiên",
  },
  tasks_priority_low: { en: "Low", de: "Niedrig", vi: "Thấp" },
  tasks_priority_medium: { en: "Medium", de: "Mittel", vi: "Trung bình" },
  tasks_priority_high: { en: "High", de: "Hoch", vi: "Cao" },
  tasks_priority_urgent: { en: "Urgent", de: "Dringend", vi: "Khẩn cấp" },
  tasks_assign_to: {
    en: "Assign to",
    de: "Zuweisen an",
    vi: "Giao cho",
  },
  tasks_unassigned: {
    en: "Unassigned",
    de: "Nicht zugewiesen",
    vi: "Chưa giao",
  },
  tasks_select_member: {
    en: "Select a member...",
    de: "Mitglied auswählen...",
    vi: "Chọn thành viên...",
  },
  tasks_comments: { en: "Comments", de: "Kommentare", vi: "Bình luận" },
  tasks_no_comments: {
    en: "No comments yet",
    de: "Noch keine Kommentare",
    vi: "Chưa có bình luận",
  },
  tasks_add_comment: {
    en: "Write a comment...",
    de: "Kommentar schreiben...",
    vi: "Viết bình luận...",
  },
  tasks_delete_comment_msg: {
    en: "Are you sure you want to delete this comment?",
    de: "Möchtest du diesen Kommentar wirklich löschen?",
    vi: "Bạn có chắc chắn muốn xóa bình luận này không?",
  },
  tasks_created: { en: "Created", de: "Erstellt", vi: "Tạo lúc" },

  // Calendar
  cal_title: { en: "Calendar", de: "Kalender", vi: "Lịch" },
  cal_new: { en: "New Event", de: "Neues Ereignis", vi: "Sự kiện mới" },
  cal_event_name: {
    en: "Event name",
    de: "Veranstaltungsname",
    vi: "Tên sự kiện",
  },
  cal_date: { en: "Date", de: "Datum", vi: "Ngày" },
  cal_time: { en: "Time", de: "Uhrzeit", vi: "Giờ" },
  cal_time_placeholder: { en: "e.g. 14:00", de: "z.B. 14:00", vi: "VD: 14:00" },
  cal_no_events: {
    en: "No events",
    de: "Keine Ereignisse",
    vi: "Không có sự kiện",
  },
  cal_all_day: { en: "All day", de: "Ganztägig", vi: "Cả ngày" },
  cal_attend: { en: "Attend", de: "Teilnehmen", vi: "Tham gia" },
  cal_attending: { en: "Attending", de: "Teilnahme", vi: "Đã tham gia" },
  cal_attendees: { en: "attendees", de: "Teilnehmer", vi: "người tham gia" },
  cal_attendee: { en: "attendee", de: "Teilnehmer", vi: "người tham gia" },
  cal_comments: { en: "Comments", de: "Kommentare", vi: "Bình luận" },
  cal_no_comments: {
    en: "No comments yet",
    de: "Noch keine Kommentare",
    vi: "Chưa có bình luận",
  },
  cal_add_comment: {
    en: "Write a comment...",
    de: "Kommentar schreiben...",
    vi: "Viết bình luận...",
  },
  cal_send: { en: "Send", de: "Senden", vi: "Gửi" },
  cal_just_now: { en: "Just now", de: "Gerade eben", vi: "Vừa xong" },
  cal_minutes_ago: { en: "m ago", de: "Min.", vi: "phút trước" },
  cal_hours_ago: { en: "h ago", de: "Std.", vi: "giờ trước" },
  cal_days_ago: { en: "d ago", de: "T. her", vi: "ngày trước" },
  cal_delete_comment_msg: {
    en: "Are you sure you want to delete this comment?",
    de: "Möchtest du diesen Kommentar wirklich löschen?",
    vi: "Bạn có chắc chắn muốn xóa bình luận này không?",
  },
  cal_months: {
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    de: [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ],
    vi: [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ],
  },
  cal_days: {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    vi: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  },

  // Profile
  profile_change_photo: {
    en: "Change photo",
    de: "Foto ändern",
    vi: "Đổi ảnh",
  },
  profile_photo_pick: {
    en: "Choose from library",
    de: "Aus Galerie wählen",
    vi: "Chọn từ thư viện",
  },
  profile_photo_remove: {
    en: "Remove photo",
    de: "Foto entfernen",
    vi: "Xóa ảnh",
  },
  profile_account: { en: "Account", de: "Konto", vi: "Tài khoản" },
  profile_display_name: {
    en: "Display name",
    de: "Anzeigename",
    vi: "Tên hiển thị",
  },
  profile_not_set: { en: "Not set", de: "Nicht festgelegt", vi: "Chưa đặt" },
  profile_email: { en: "Email", de: "E-Mail", vi: "Email" },
  profile_account_id: { en: "Account ID", de: "Konto-ID", vi: "ID tài khoản" },
  profile_org: { en: "Organization", de: "Organisation", vi: "Tổ chức" },
  profile_leave_org: {
    en: "Leave organization",
    de: "Organisation verlassen",
    vi: "Rời tổ chức",
  },
  profile_preferences: {
    en: "Preferences",
    de: "Einstellungen",
    vi: "Cài đặt",
  },
  profile_notifications: {
    en: "Notifications",
    de: "Benachrichtigungen",
    vi: "Thông báo",
  },
  profile_appearance: {
    en: "Appearance",
    de: "Erscheinungsbild",
    vi: "Giao diện",
  },
  profile_language: { en: "Language", de: "Sprache", vi: "Ngôn ngữ" },
  profile_signout: { en: "Sign Out", de: "Abmelden", vi: "Đăng xuất" },
  profile_signout_title: { en: "Sign Out", de: "Abmelden", vi: "Đăng xuất" },
  profile_signout_msg: {
    en: "Are you sure you want to sign out of your account?",
    de: "Möchtest du dich wirklich abmelden?",
    vi: "Bạn có chắc chắn muốn đăng xuất không?",
  },
  profile_signout_failed: {
    en: "Sign-out failed",
    de: "Abmeldung fehlgeschlagen",
    vi: "Đăng xuất thất bại",
  },
  profile_signout_error: {
    en: "Something went wrong. Please try again.",
    de: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    vi: "Đã xảy ra lỗi. Vui lòng thử lại.",
  },
  profile_member_fallback: {
    en: "FaithHub Member",
    de: "FaithHub-Mitglied",
    vi: "Thành viên FaithHub",
  },
  profile_delete_account: {
    en: "Delete account",
    de: "Konto löschen",
    vi: "Xóa tài khoản",
  },
  profile_delete_title: {
    en: "Delete Account?",
    de: "Konto löschen?",
    vi: "Xóa tài khoản?",
  },
  profile_delete_msg: {
    en: "This will permanently delete your account and all associated data. This action cannot be undone.",
    de: "Dein Konto und alle zugehörigen Daten werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",
    vi: "Tài khoản và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.",
  },
  profile_delete_password_msg: {
    en: "Enter your password to confirm account deletion.",
    de: "Gib dein Passwort ein, um die Kontolöschung zu bestätigen.",
    vi: "Nhập mật khẩu để xác nhận xóa tài khoản.",
  },
  profile_delete_confirm: {
    en: "Delete My Account",
    de: "Mein Konto löschen",
    vi: "Xóa tài khoản của tôi",
  },
  profile_delete_failed: {
    en: "Deletion failed",
    de: "Löschung fehlgeschlagen",
    vi: "Xóa thất bại",
  },
  profile_delete_error: {
    en: "Could not delete your account. You may need to sign in again before deleting.",
    de: "Konto konnte nicht gelöscht werden. Möglicherweise musst du dich erneut anmelden.",
    vi: "Không thể xóa tài khoản. Bạn có thể cần đăng nhập lại trước khi xóa.",
  },

  // Display name editing
  profile_edit_name_title: {
    en: "Update Display Name",
    de: "Anzeigename ändern",
    vi: "Cập nhật tên hiển thị",
  },
  profile_edit_name_msg: {
    en: "Enter your new display name.",
    de: "Gib deinen neuen Anzeigenamen ein.",
    vi: "Nhập tên hiển thị mới của bạn.",
  },
  profile_edit_name_placeholder: {
    en: "Enter your name",
    de: "Name eingeben",
    vi: "Nhập tên của bạn",
  },
  profile_edit_name_error: {
    en: "Could not update your display name. Please try again.",
    de: "Anzeigename konnte nicht aktualisiert werden. Bitte versuche es erneut.",
    vi: "Không thể cập nhật tên hiển thị. Vui lòng thử lại.",
  },

  // Apple Sign-In display name prompt
  apple_name_prompt_title: {
    en: "Welcome to FaithHub!",
    de: "Willkommen bei FaithHub!",
    vi: "Chào mừng đến FaithHub!",
  },
  apple_name_prompt_msg: {
    en: "Please set a display name so others in your community can recognize you.",
    de: "Bitte lege einen Anzeigenamen fest, damit andere dich erkennen können.",
    vi: "Vui lòng đặt tên hiển thị để mọi người trong cộng đồng nhận ra bạn.",
  },
  apple_name_prompt_skip: {
    en: "Skip for now",
    de: "Jetzt überspringen",
    vi: "Bỏ qua",
  },

  // Shared
  cancel: { en: "Cancel", de: "Abbrechen", vi: "Hủy" },
  create: { en: "Create", de: "Erstellen", vi: "Tạo" },
  try_again: { en: "Try Again", de: "Erneut versuchen", vi: "Thử lại" },
  continue: { en: "Continue", de: "Weiter", vi: "Tiếp tục" },
  save: { en: "Save", de: "Speichern", vi: "Lưu" },
  delete: { en: "Delete", de: "Löschen", vi: "Xóa" },
  delete_title: { en: "Delete?", de: "Löschen?", vi: "Xóa?" },
  delete_task_msg: {
    en: "Are you sure you want to delete this task? This cannot be undone.",
    de: "Möchtest du diese Aufgabe wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
    vi: "Bạn có chắc chắn muốn xóa công việc này không? Không thể hoàn tác.",
  },
  delete_event_msg: {
    en: "Are you sure you want to delete this event? This cannot be undone.",
    de: "Möchtest du dieses Ereignis wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
    vi: "Bạn có chắc chắn muốn xóa sự kiện này không? Không thể hoàn tác.",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  const value = entry[lang] ?? entry.en;
  if (typeof value === "string") return value;
  return key;
}

export function tArray(
  key: "cal_months" | "cal_days",
  lang: Language,
): readonly string[] {
  const entry = translations[key];
  return entry[lang] ?? entry.en;
}
