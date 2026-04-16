import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";

type OrgInfo = {
  orgId: string;
  orgName: string;
  role: string;
} | null;

type OrgState = {
  org: OrgInfo;
  isLoading: boolean;
  joinOrg: (code: string) => Promise<void>;
  leaveOrg: () => Promise<void>;
};

const OrgContext = createContext<OrgState>({
  org: null,
  isLoading: true,
  joinOrg: async () => {},
  leaveOrg: async () => {},
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [org, setOrg] = useState<OrgInfo>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrg(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let cancelled = false;

    async function findUserOrg() {
      try {
        // Check all organizations for this user's membership
        const orgsSnap = await getDocs(collection(db, "organizations"));
        for (const orgDoc of orgsSnap.docs) {
          const memberRef = doc(
            db,
            "organizations",
            orgDoc.id,
            "members",
            user!.uid
          );
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists() && !cancelled) {
            setOrg({
              orgId: orgDoc.id,
              orgName: orgDoc.data().name,
              role: memberSnap.data().role,
            });
            setIsLoading(false);
            return;
          }
        }
        if (!cancelled) {
          setOrg(null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setOrg(null);
          setIsLoading(false);
        }
      }
    }

    findUserOrg();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function joinOrg(code: string) {
    if (!user) throw new Error("Not signed in");

    const orgsQuery = query(
      collection(db, "organizations"),
      where("code", "==", code.trim())
    );
    const snap = await getDocs(orgsQuery);

    if (snap.empty) {
      throw new Error("Invalid organization code");
    }

    const orgDoc = snap.docs[0];
    const memberRef = doc(
      db,
      "organizations",
      orgDoc.id,
      "members",
      user.uid
    );

    await setDoc(memberRef, {
      role: "member",
      joinedAt: serverTimestamp(),
      displayName: user.displayName || null,
      email: user.email,
    });

    setOrg({
      orgId: orgDoc.id,
      orgName: orgDoc.data().name,
      role: "member",
    });
  }

  async function leaveOrg() {
    if (!user || !org) return;
    try {
      await deleteDoc(
        doc(db, "organizations", org.orgId, "members", user.uid)
      );
    } catch {
      // ignore
    }
    setOrg(null);
  }

  return (
    <OrgContext.Provider value={{ org, isLoading, joinOrg, leaveOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
