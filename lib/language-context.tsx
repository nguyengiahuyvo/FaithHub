import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import { type Language } from "./i18n";

type LanguageState = {
  lang: Language;
  setLang: (lang: Language) => Promise<void>;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageState>({
  lang: "en",
  setLang: async () => {},
  isLoading: true,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLangState("en");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadLang() {
      try {
        const snap = await getDoc(doc(db, "users", user!.uid));
        if (!cancelled && snap.exists() && snap.data().language) {
          setLangState(snap.data().language as Language);
        }
      } catch {
        // ignore — default to "en"
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLang();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function setLang(newLang: Language) {
    setLangState(newLang);
    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { language: newLang },
          { merge: true }
        );
      } catch {
        // ignore
      }
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
