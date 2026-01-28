"use client";

import { useRouter } from "next/navigation";
import Contact from "../components/Contact";

type ContactSummary = {
  id: string;
  name: string;
  lastMessage: string;
};

export default function ChatsListPage() {
  const router = useRouter();

  // No active chats yet; keep empty to show the empty state
  const contacts: ContactSummary[] = [];

  const openChat = (id: string) => {
    // Navigate to a dedicated chat page (to be implemented later)
    router.push(`/chat/${id}`);
  };

  return (
    <div className="mobile-chats-screen">
      <header className="chats-header">
        <h1 className="chats-title">Chats</h1>
      </header>

      <section className="chats-list-card">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" />
            <h2>No active chats yet</h2>
            <p>
              When users message you, they’ll appear here as a simple list.
            </p>
          </div>
        ) : (
          <ul className="list-group list-group-flush">
            {contacts.map((c) => (
              <Contact
                key={c.id}
                contact_name={c.name}
                onClick={() => openChat(c.id)}
              >
                {c.lastMessage}
              </Contact>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
