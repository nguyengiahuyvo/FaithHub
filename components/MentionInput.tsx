import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { Pressable } from "@/components/HapticPressable";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import UserAvatar from "./UserAvatar";

type Member = { uid: string; displayName: string | null };

/**
 * A TextInput that shows an autocomplete dropdown when the user types `@`.
 * The dropdown is positioned absolutely so it overlays other elements.
 */
export default function MentionInput({
  orgId,
  value,
  onChangeText,
  style,
  ...rest
}: TextInputProps & {
  orgId: string | undefined;
  value: string;
  onChangeText: (text: string) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [atIndex, setAtIndex] = useState(-1);

  useEffect(() => {
    if (!orgId) return;
    getDocs(collection(db, "organizations", orgId, "members")).then((snap) => {
      setMembers(
        snap.docs
          .map((d) => ({ uid: d.id, displayName: d.data().displayName || null }))
          .filter((m) => m.displayName),
      );
    }).catch(() => {});
  }, [orgId]);

  function handleTextChange(text: string) {
    onChangeText(text);

    const lastAt = text.lastIndexOf("@");
    if (lastAt === -1) {
      setMentionQuery(null);
      setSuggestions([]);
      return;
    }

    const afterAt = text.slice(lastAt + 1);
    if (afterAt.includes(" ") && afterAt.indexOf(" ") < afterAt.length - 1) {
      setMentionQuery(null);
      setSuggestions([]);
      return;
    }

    const q = afterAt.trimEnd().toLowerCase();
    setAtIndex(lastAt);
    setMentionQuery(q);

    if (q.length === 0) {
      setSuggestions(members.slice(0, 5));
    } else {
      setSuggestions(
        members
          .filter((m) => m.displayName!.toLowerCase().includes(q))
          .slice(0, 5),
      );
    }
  }

  function selectMember(member: Member) {
    const name = member.displayName!;
    const hasSpace = name.includes(" ");
    const mention = hasSpace ? `@"${name}" ` : `@${name} `;
    const before = value.slice(0, atIndex);
    const newText = before + mention;
    onChangeText(newText);
    setMentionQuery(null);
    setSuggestions([]);
  }

  const showDropdown = suggestions.length > 0 && mentionQuery !== null;
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={s.wrapper}>
      {showDropdown && (
        <View style={s.dropdownAnchor}>
          <ScrollView
            style={s.dropdown}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
          >
            {suggestions.map((item) => (
              <Pressable key={item.uid} onPress={() => selectMember(item)} style={s.item}>
                <UserAvatar uid={item.uid} name={item.displayName} size={24} />
                <Text style={s.name} numberOfLines={1}>
                  {item.displayName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleTextChange}
        style={style}
        {...rest}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  dropdownAnchor: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    zIndex: 999,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 4,
    maxHeight: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E2C",
  },
});
