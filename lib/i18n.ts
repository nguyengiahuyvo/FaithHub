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
  tab_game: { en: "Quest", de: "Quest", vi: "Thử thách" },

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

  // Prayer requests
  prayer_title: { en: "Prayer Requests", de: "Gebetsanliegen", vi: "Nan đề cầu nguyện" },
  prayer_empty: {
    en: "No prayer requests yet",
    de: "Noch keine Gebetsanliegen",
    vi: "Chưa có nan đề cầu nguyện",
  },
  prayer_placeholder: {
    en: "Share a prayer request...",
    de: "Teile ein Gebetsanliegen...",
    vi: "Chia sẻ nan đề cầu nguyện...",
  },
  prayer_anonymous: { en: "Post anonymously", de: "Anonym posten", vi: "Đăng ẩn danh" },
  prayer_anonymous_label: { en: "Anonymous", de: "Anonym", vi: "Ẩn danh" },
  prayer_delete_msg: {
    en: "Are you sure you want to delete this prayer request?",
    de: "Möchtest du dieses Gebetsanliegen wirklich löschen?",
    vi: "Bạn có chắc chắn muốn xóa nan đề cầu nguyện này không?",
  },
  prayer_praying: { en: "Praying", de: "Bete", vi: "Cầu nguyện" },
  prayer_my_requests: { en: "My Prayer Requests", de: "Meine Gebetsanliegen", vi: "Nan đề của tôi" },
  prayer_my_empty: {
    en: "You haven't shared any prayer requests yet",
    de: "Du hast noch keine Gebetsanliegen geteilt",
    vi: "Bạn chưa chia sẻ nan đề cầu nguyện nào",
  },

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
  tasks_offer_help: { en: "Offer Help", de: "Hilfe anbieten", vi: "Hỗ trợ" },
  tasks_helping: { en: "Helping", de: "Helfe mit", vi: "Đang hỗ trợ" },
  tasks_helpers: { en: "helpers", de: "Helfer", vi: "người hỗ trợ" },
  tasks_helper: { en: "helper", de: "Helfer", vi: "người hỗ trợ" },
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

  // Create choice
  tasks_add_task: { en: "New Task", de: "Neue Aufgabe", vi: "Công việc mới" },
  tasks_add_vote: { en: "New Vote", de: "Neue Abstimmung", vi: "Bình chọn mới" },

  // Votes
  vote_title_label: { en: "Question", de: "Frage", vi: "Câu hỏi" },
  vote_title_placeholder: {
    en: "What should we vote on?",
    de: "Worüber soll abgestimmt werden?",
    vi: "Bình chọn về điều gì?",
  },
  vote_option: { en: "Option", de: "Option", vi: "Lựa chọn" },
  vote_add_option: { en: "Add option", de: "Option hinzufügen", vi: "Thêm lựa chọn" },
  vote_deadline: { en: "Deadline", de: "Frist", vi: "Hạn chót" },
  vote_deadline_placeholder: { en: "YYYY-MM-DD", de: "JJJJ-MM-TT", vi: "YYYY-MM-DD" },
  vote_no_votes: { en: "No votes yet", de: "Noch keine Abstimmungen", vi: "Chưa có bình chọn" },
  vote_votes: { en: "votes", de: "Stimmen", vi: "phiếu" },
  vote_vote: { en: "vote", de: "Stimme", vi: "phiếu" },
  vote_ended: { en: "Ended", de: "Beendet", vi: "Đã kết thúc" },
  vote_ends: { en: "Ends", de: "Endet", vi: "Kết thúc" },
  vote_days_left: { en: "d left", de: "T übrig", vi: "ngày còn" },
  vote_today: { en: "Today", de: "Heute", vi: "Hôm nay" },
  vote_comments: { en: "Comments", de: "Kommentare", vi: "Bình luận" },
  vote_no_comments: {
    en: "No comments yet",
    de: "Noch keine Kommentare",
    vi: "Chưa có bình luận",
  },
  vote_add_comment: {
    en: "Write a comment...",
    de: "Kommentar schreiben...",
    vi: "Viết bình luận...",
  },
  vote_delete_comment_msg: {
    en: "Are you sure you want to delete this comment?",
    de: "Möchtest du diesen Kommentar wirklich löschen?",
    vi: "Bạn có chắc chắn muốn xóa bình luận này không?",
  },
  delete_vote_msg: {
    en: "Are you sure you want to delete this vote? This cannot be undone.",
    de: "Möchtest du diese Abstimmung wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
    vi: "Bạn có chắc chắn muốn xóa bình chọn này không? Không thể hoàn tác.",
  },

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
  cal_type_label: { en: "Type", de: "Art", vi: "Loại" },
  cal_type_event: { en: "Event", de: "Ereignis", vi: "Sự kiện" },
  cal_type_birthday: { en: "Birthday", de: "Geburtstag", vi: "Sinh nhật" },
  cal_birthday_name: {
    en: "Whose birthday?",
    de: "Wessen Geburtstag?",
    vi: "Sinh nhật của ai?",
  },
  cal_birthday_hint: {
    en: "Birthdays repeat every year — no time needed.",
    de: "Geburtstage wiederholen sich jedes Jahr — keine Uhrzeit nötig.",
    vi: "Sinh nhật lặp lại hàng năm — không cần giờ.",
  },
  cal_repeat_label: { en: "Repeat", de: "Wiederholen", vi: "Lặp lại" },
  cal_repeat_none: { en: "Once", de: "Einmalig", vi: "Một lần" },
  cal_repeat_daily: { en: "Daily", de: "Täglich", vi: "Hàng ngày" },
  cal_repeat_weekly: { en: "Weekly", de: "Wöchentlich", vi: "Hàng tuần" },
  cal_repeat_yearly: { en: "Yearly", de: "Jährlich", vi: "Hàng năm" },
  cal_repeat_hint: {
    en: "Repeats until the end of the current year.",
    de: "Wiederholt sich bis zum Ende des laufenden Jahres.",
    vi: "Lặp lại đến hết năm hiện tại.",
  },
  notif_new_event_title: {
    en: "New event",
    de: "Neues Ereignis",
    vi: "Sự kiện mới",
  },
  notif_new_birthday_title: {
    en: "New birthday",
    de: "Neuer Geburtstag",
    vi: "Sinh nhật mới",
  },
  notif_someone: { en: "Someone", de: "Jemand", vi: "Ai đó" },
  cal_no_events: {
    en: "No events",
    de: "Keine Ereignisse",
    vi: "Không có sự kiện",
  },
  cal_all_day: { en: "All day", de: "Ganztägig", vi: "Cả ngày" },
  cal_attend: { en: "Attend", de: "Teilnehmen", vi: "Tham gia" },
  cal_attending: { en: "Attending", de: "Teilnahme", vi: "Đã tham gia" },
  cal_maybe: { en: "Maybe", de: "Vielleicht", vi: "Có thể" },
  cal_interested: { en: "Interested", de: "Interessiert", vi: "Quan tâm" },
  cal_attendees: { en: "attendees", de: "Teilnehmer", vi: "người tham gia" },
  cal_attendees_title: { en: "Attendees", de: "Teilnehmer", vi: "Người tham gia" },
  cal_upcoming: { en: "Upcoming", de: "Demnächst", vi: "Sắp tới" },
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
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    vi: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
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
  profile_leave_title: {
    en: "Leave Organization?",
    de: "Organisation verlassen?",
    vi: "Rời tổ chức?",
  },
  profile_leave_msg: {
    en: "Are you sure you want to leave this organization? You will lose access to all shared tasks and events.",
    de: "Möchtest du diese Organisation wirklich verlassen? Du verlierst den Zugriff auf alle gemeinsamen Aufgaben und Termine.",
    vi: "Bạn có chắc chắn muốn rời tổ chức? Bạn sẽ mất quyền truy cập vào tất cả công việc và sự kiện chung.",
  },
  profile_leave_confirm: {
    en: "Leave",
    de: "Verlassen",
    vi: "Rời",
  },
  profile_leave_success: {
    en: "You have left the organization",
    de: "Du hast die Organisation verlassen",
    vi: "Bạn đã rời tổ chức",
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
  snack_deleted: { en: "Deleted successfully", de: "Erfolgreich gelöscht", vi: "Đã xóa thành công" },
  cancel: { en: "Cancel", de: "Abbrechen", vi: "Hủy" },
  close: { en: "Close", de: "Schließen", vi: "Đóng" },
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

  // Verse Quest (Bible trivia game)
  game_title: { en: "Verse Quest", de: "Verse Quest", vi: "Verse Quest" },
  game_subtitle: {
    en: "Answer Bible trivia, build streaks, and chase your best score.",
    de: "Beantworte Bibel-Quizfragen, baue Serien auf und jage deinen Bestwert.",
    vi: "Trả lời câu hỏi Kinh Thánh, xây chuỗi thắng và phá kỷ lục của bạn.",
  },
  game_best_score: { en: "Best score", de: "Bestwert", vi: "Điểm cao nhất" },
  game_questions: { en: "Questions", de: "Fragen", vi: "Câu hỏi" },
  game_hearts: { en: "Hearts", de: "Leben", vi: "Mạng" },
  game_time: { en: "Per question", de: "Pro Frage", vi: "Mỗi câu" },
  game_how_title: { en: "How to play", de: "So geht's", vi: "Cách chơi" },
  game_how_1: {
    en: "Pick the right answer to earn points.",
    de: "Wähle die richtige Antwort, um Punkte zu sammeln.",
    vi: "Chọn câu trả lời đúng để ghi điểm.",
  },
  game_how_2: {
    en: "Answer in a row to build a streak bonus.",
    de: "Richtige Antworten in Folge geben einen Serien-Bonus.",
    vi: "Trả lời liên tiếp để nhận thưởng chuỗi.",
  },
  game_how_3: {
    en: "Answer fast — speed gives bonus points.",
    de: "Antworte schnell — Tempo bringt Bonuspunkte.",
    vi: "Trả lời nhanh — tốc độ cho điểm thưởng.",
  },
  game_play: { en: "Play", de: "Spielen", vi: "Chơi" },
  game_play_again: { en: "Play again", de: "Nochmal spielen", vi: "Chơi lại" },
  game_done: { en: "Done", de: "Fertig", vi: "Xong" },
  game_streak: { en: "Streak", de: "Serie", vi: "Chuỗi" },
  game_correct: { en: "Correct", de: "Richtig", vi: "Đúng" },
  game_best_streak: { en: "Best streak", de: "Beste Serie", vi: "Chuỗi tốt nhất" },
  game_points: { en: "Points", de: "Punkte", vi: "Điểm" },
  game_new_best: { en: "New best score!", de: "Neuer Bestwert!", vi: "Kỷ lục mới!" },
  game_result_great: { en: "Outstanding!", de: "Ausgezeichnet!", vi: "Tuyệt vời!" },
  game_result_good: { en: "Well done!", de: "Gut gemacht!", vi: "Làm tốt lắm!" },
  game_result_try: { en: "Keep going!", de: "Weitermachen!", vi: "Cố lên!" },
  game_verse_great: {
    en: "\"Well done, good and faithful servant.\" — Matthew 25:21",
    de: "„Wohl, du treuer und getreuer Knecht.\" — Matthäus 25:21",
    vi: "„Hỡi đầy tớ ngay lành trung tín kia, được lắm.\" — Ma-thi-ơ 25:21",
  },
  game_verse_good: {
    en: "\"Your word is a lamp to my feet and a light to my path.\" — Psalm 119:105",
    de: "„Dein Wort ist meines Fußes Leuchte und ein Licht auf meinem Wege.\" — Psalm 119:105",
    vi: "„Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi.\" — Thi thiên 119:105",
  },
  game_verse_try: {
    en: "\"Be strong and courageous... for the Lord your God is with you.\" — Joshua 1:9",
    de: "„Sei mutig und stark... denn der Herr, dein Gott, ist mit dir.\" — Josua 1:9",
    vi: "„Hãy vững lòng bền chí... vì Giê-hô-va Đức Chúa Trời ngươi vẫn ở cùng ngươi.\" — Giô-suê 1:9",
  },

  // Verse Quest — onboarding (how to play)
  onboard_help: {
    en: "How to play",
    de: "Spielanleitung",
    vi: "Cách chơi",
  },
  onboard_skip: { en: "Skip", de: "Überspringen", vi: "Bỏ qua" },
  onboard_next: { en: "Next", de: "Weiter", vi: "Tiếp" },
  onboard_back: { en: "Back", de: "Zurück", vi: "Quay lại" },
  onboard_start: {
    en: "Let's play!",
    de: "Los geht's!",
    vi: "Bắt đầu!",
  },
  onboard_1_title: {
    en: "Challenges From Your Community",
    de: "Herausforderungen aus deiner Gemeinschaft",
    vi: "Thử thách từ cộng đồng",
  },
  onboard_1_desc: {
    en: "Answer trivia questions written by other members of your community. Each correct answer earns you 5 points.",
    de: "Beantworte Fragen, die andere Mitglieder deiner Gemeinschaft erstellt haben. Jede richtige Antwort bringt 5 Punkte.",
    vi: "Trả lời câu hỏi do các thành viên khác trong cộng đồng tạo ra. Mỗi câu đúng được 5 điểm.",
  },
  onboard_2_title: {
    en: "Three Lives. Use Them Well.",
    de: "Drei Leben. Geh sorgsam damit um.",
    vi: "Ba mạng. Hãy giữ gìn.",
  },
  onboard_2_desc: {
    en: "You have 3 lives per round. Lose them all and you'll have to wait 30 minutes before you can play again.",
    de: "Du hast 3 Leben pro Runde. Wenn du alle verlierst, musst du 30 Minuten warten, bevor du wieder spielen kannst.",
    vi: "Bạn có 3 mạng mỗi vòng. Mất hết mạng, bạn phải chờ 30 phút mới được chơi lại.",
  },
  onboard_3_title: {
    en: "10 Rounds a Day",
    de: "10 Runden pro Tag",
    vi: "10 lượt mỗi ngày",
  },
  onboard_3_desc: {
    en: "You can play up to 10 rounds each day. The highest-scoring players are honored on the leaderboard.",
    de: "Du kannst bis zu 10 Runden pro Tag spielen. Die besten Spieler werden auf der Bestenliste geehrt.",
    vi: "Bạn được chơi tối đa 10 lượt mỗi ngày. Người chơi điểm cao nhất sẽ được vinh danh trên bảng xếp hạng.",
  },
  onboard_4_title: {
    en: "Challenge Back",
    de: "Fordere zurück heraus",
    vi: "Thách thức ngược lại",
  },
  onboard_4_desc: {
    en: "Create your own questions to challenge other members. You earn 2 points per question — and your own questions won't appear in your rounds.",
    de: "Erstelle eigene Fragen, um andere herauszufordern. Du bekommst 2 Punkte pro Frage — und deine eigenen Fragen erscheinen nicht in deinen Runden.",
    vi: "Tạo câu hỏi của riêng bạn để thách thức người khác. Bạn nhận 2 điểm mỗi câu — và câu hỏi của bạn sẽ không xuất hiện trong vòng chơi của bạn.",
  },

  // Verse Quest — community-authored questions (Challenge Mode)
  game_challenge_title: {
    en: "Challenge Mode",
    de: "Challenge-Modus",
    vi: "Chế độ thử thách",
  },
  game_challenge_subtitle: {
    en: "Write your own questions to challenge other players in your community.",
    de: "Schreibe eigene Fragen, um andere in deiner Gemeinschaft herauszufordern.",
    vi: "Viết câu hỏi của riêng bạn để thử thách các thành viên khác.",
  },
  game_challenge_need_org: {
    en: "Join a community to create and share questions.",
    de: "Tritt einer Gemeinschaft bei, um Fragen zu erstellen.",
    vi: "Hãy tham gia cộng đồng để tạo và chia sẻ câu hỏi.",
  },
  game_challenge_pool: {
    en: "in the pool",
    de: "im Pool",
    vi: "trong kho",
  },
  game_challenge_create: {
    en: "Create Question",
    de: "Frage erstellen",
    vi: "Tạo câu hỏi",
  },
  game_challenge_mine: {
    en: "My questions",
    de: "Meine Fragen",
    vi: "Câu hỏi của tôi",
  },
  game_by: { en: "by", de: "von", vi: "của" },

  // Create Question modal
  game_cq_title: {
    en: "New Question",
    de: "Neue Frage",
    vi: "Câu hỏi mới",
  },
  game_cq_question: { en: "Question", de: "Frage", vi: "Câu hỏi" },
  game_cq_question_ph: {
    en: "e.g. Who led the Israelites out of Egypt?",
    de: "z.B. Wer führte die Israeliten aus Ägypten?",
    vi: "VD: Ai đã dẫn dân Israel ra khỏi Ai Cập?",
  },
  game_cq_choices: {
    en: "Answers",
    de: "Antworten",
    vi: "Lựa chọn",
  },
  game_cq_tap_correct: {
    en: "Tap the letter next to the correct answer.",
    de: "Tippe den Buchstaben neben der richtigen Antwort an.",
    vi: "Chạm vào chữ cái bên cạnh câu trả lời đúng.",
  },
  game_cq_choice_ph: {
    en: "Choice",
    de: "Antwort",
    vi: "Lựa chọn",
  },
  game_cq_reference: {
    en: "Bible reference (optional)",
    de: "Bibelstelle (optional)",
    vi: "Tham chiếu Kinh Thánh (tùy chọn)",
  },
  game_cq_reference_ph: {
    en: "e.g. Exodus 3:10",
    de: "z.B. 2. Mose 3:10",
    vi: "VD: Xuất 3:10",
  },
  game_cq_save: { en: "Save", de: "Speichern", vi: "Lưu" },
  game_cq_answer_label: {
    en: "Answer",
    de: "Antwort",
    vi: "Đáp án",
  },
  game_cq_success_label: {
    en: "Say something if they get it right (optional)",
    de: "Sag etwas, wenn sie richtig antworten (optional)",
    vi: "Nhắn gì đó nếu họ trả lời đúng (tùy chọn)",
  },
  game_cq_success_ph: {
    en: "e.g. Show-off! 😎 Lucky guess, huh?",
    de: "z.B. Angeber! 😎 Glückstreffer, was?",
    vi: "VD: Giỏi quá đấy! 😎 May mắn thôi chứ gì?",
  },
  game_cq_fail_label: {
    en: "Say something if they get it wrong (optional)",
    de: "Sag etwas, wenn sie falsch liegen (optional)",
    vi: "Nhắn gì đó nếu họ trả lời sai (tùy chọn)",
  },
  game_cq_fail_ph: {
    en: "e.g. Seriously?? Even my goldfish knew that 🐟",
    de: "z.B. Echt jetzt?? Das wusste sogar mein Goldfisch 🐟",
    vi: "VD: Thật hả?? Cá vàng của tôi còn biết 🐟",
  },

  // My Questions modal
  game_mq_title: {
    en: "My Questions",
    de: "Meine Fragen",
    vi: "Câu hỏi của tôi",
  },
  game_mq_empty: {
    en: "You haven't created any questions yet.",
    de: "Du hast noch keine Fragen erstellt.",
    vi: "Bạn chưa tạo câu hỏi nào.",
  },

  // Verse Quest — totals, limits & leaderboard
  game_total_score: {
    en: "Total score",
    de: "Gesamtpunkte",
    vi: "Tổng điểm",
  },
  game_plays_today: {
    en: "Plays left today",
    de: "Heute übrig",
    vi: "Lượt còn lại",
  },
  game_per_correct: {
    en: "Per correct",
    de: "Pro richtig",
    vi: "Mỗi câu đúng",
  },
  game_cooldown_msg: {
    en: "You ran out of lives. Come back in",
    de: "Du hast alle Leben verloren. Komm zurück in",
    vi: "Bạn đã hết mạng. Quay lại sau",
  },
  game_daily_limit_msg: {
    en: "You've used all 10 plays today. Come back tomorrow.",
    de: "Du hast heute alle 10 Spiele verbraucht. Komm morgen wieder.",
    vi: "Bạn đã dùng hết 10 lượt hôm nay. Hẹn gặp lại ngày mai.",
  },
  game_daily_limit_short: {
    en: "Come back tomorrow",
    de: "Komm morgen wieder",
    vi: "Hẹn ngày mai",
  },
  game_result_failed: {
    en: "Out of lives!",
    de: "Keine Leben mehr!",
    vi: "Hết mạng rồi!",
  },
  game_leaderboard_title: {
    en: "Leaderboard",
    de: "Bestenliste",
    vi: "Bảng xếp hạng",
  },
  game_leaderboard_subtitle: {
    en: "See the top players in your community.",
    de: "Sieh die besten Spieler deiner Gemeinschaft.",
    vi: "Xem những người chơi xuất sắc nhất trong cộng đồng.",
  },
  game_leaderboard_need_org: {
    en: "Join a community to see the leaderboard.",
    de: "Tritt einer Gemeinschaft bei, um die Bestenliste zu sehen.",
    vi: "Tham gia cộng đồng để xem bảng xếp hạng.",
  },
  game_leaderboard_empty: {
    en: "No scores yet — be the first to play!",
    de: "Noch keine Punkte — sei der Erste!",
    vi: "Chưa có điểm nào — hãy là người đầu tiên!",
  },
  game_leaderboard_you: {
    en: "you",
    de: "du",
    vi: "bạn",
  },
  game_no_questions_msg: {
    en: "No questions yet — be the first to add one!",
    de: "Noch keine Fragen — sei der Erste, der eine erstellt!",
    vi: "Chưa có câu hỏi nào — hãy là người đầu tiên tạo câu hỏi!",
  },
  game_only_own_msg: {
    en: "Only your own questions exist. Wait for someone else to add one.",
    de: "Es gibt nur deine eigenen Fragen. Warte, bis jemand anderes eine hinzufügt.",
    vi: "Chỉ có câu hỏi của bạn. Hãy chờ người khác tạo thêm.",
  },
  game_need_org_msg: {
    en: "Join a community to play and see the leaderboard.",
    de: "Tritt einer Gemeinschaft bei, um zu spielen und die Bestenliste zu sehen.",
    vi: "Tham gia cộng đồng để chơi và xem bảng xếp hạng.",
  },
  game_manage_questions: {
    en: "Manage questions",
    de: "Fragen verwalten",
    vi: "Quản lý câu hỏi",
  },

  // Quest Questions management page
  qq_title: {
    en: "Quest Questions",
    de: "Quest-Fragen",
    vi: "Câu hỏi Quest",
  },
  qq_need_org: {
    en: "Join a community to manage questions.",
    de: "Tritt einer Gemeinschaft bei, um Fragen zu verwalten.",
    vi: "Tham gia cộng đồng để quản lý câu hỏi.",
  },
  qq_add: {
    en: "New Question",
    de: "Neue Frage",
    vi: "Câu hỏi mới",
  },
  qq_mine: {
    en: "My Questions",
    de: "Meine Fragen",
    vi: "Câu hỏi của tôi",
  },
  qq_mine_empty: {
    en: "You haven't created any questions yet.",
    de: "Du hast noch keine Fragen erstellt.",
    vi: "Bạn chưa tạo câu hỏi nào.",
  },
  qq_community: {
    en: "Community Questions",
    de: "Fragen der Gemeinschaft",
    vi: "Câu hỏi cộng đồng",
  },
  qq_community_empty: {
    en: "No community questions yet — be the first!",
    de: "Noch keine Fragen — sei der Erste!",
    vi: "Chưa có câu hỏi nào — hãy là người đầu tiên!",
  },
  qq_form_title: {
    en: "Create a Question",
    de: "Frage erstellen",
    vi: "Tạo câu hỏi",
  },

  // Quest play screen — snackbar + next-button
  quest_correct_title: {
    en: "Correct!",
    de: "Richtig!",
    vi: "Chính xác!",
  },
  quest_wrong_title: {
    en: "Wrong answer",
    de: "Falsche Antwort",
    vi: "Trả lời sai",
  },
  quest_timeout_title: {
    en: "Out of time",
    de: "Zeit abgelaufen",
    vi: "Hết giờ",
  },
  quest_next: { en: "Next", de: "Weiter", vi: "Tiếp theo" },
  quest_finish: { en: "Finish", de: "Beenden", vi: "Kết thúc" },
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
