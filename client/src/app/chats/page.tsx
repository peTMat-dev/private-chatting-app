import { redirect } from "next/navigation";

export default function ChatsPage() {
  redirect("/home");
}

type ContactSummary = {
  id: number | string;
  name: string;
  lastMessage: string;
};

type ApiChatsResponse = {
  success: boolean;
  count?: number;
  data?: Array<{ id: number; name: string; lastMessage: string }>;
  error?: string;
};

export default function ChatsListPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const username = useMemo(() => {
    try {
      return localStorage.getItem("cubcha_username") || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let aborted = false;
    const fetchChats = async () => {
      if (!username) {
        router.replace("/");
        return;
      }
      try {
        const url = buildApiUrl(`/chats?username=${encodeURIComponent(username)}`);
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        const data = (await res.json()) as ApiChatsResponse;
        if (!res.ok || !data.success) {
          if (!aborted) setError(data.error || "Unable to load chats");
          return;
        }
        const list: ContactSummary[] = (data.data || []).map((d) => ({
          id: d.id,
          name: d.name,
          lastMessage: d.lastMessage || "",
        }));
        if (!aborted) setContacts(list);
      } catch (err) {
        if (!aborted) setError((err as Error).message);
      }
    };
    fetchChats();
    return () => {
      aborted = true;
    };
  }, [username, router]);

  const openChat = (id: number | string) => {
    router.push(`/chat/${id}`);
  };

  return (
    <div className="mobile-chats-screen">
      <section className="chats-list-card">
        <div className="chats-card-titlebar">
          <span className="chats-card-title">Conversations</span>
        </div>
        {error ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" />
            <h2>Could not load chats</h2>
            <p>{error}</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" />
            <h2>No active chats yet</h2>
            <p>When users message you, they’ll appear here.</p>
          </div>
        ) : (
          <ul className="list-group list-group-flush chats-list">
            {contacts.map((c) => (
              <Contact key={c.id} contact_name={c.name} onClick={() => openChat(c.id)}>
                {c.lastMessage}
              </Contact>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
