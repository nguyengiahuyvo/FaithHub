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

  // Shared
  cancel: { en: "Cancel", de: "Abbrechen", vi: "Hủy" },
  create: { en: "Create", de: "Erstellen", vi: "Tạo" },
  try_again: { en: "Try Again", de: "Erneut versuchen", vi: "Thử lại" },
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
