"use client";
import React from "react";
import Contact from "../components/Contact";
import { useRouter } from "next/navigation";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const contacts = [
    { id: 1, name: "Alice", lastMessage: "Hey!" },
    { id: 2, name: "Bob", lastMessage: "See you soon" },
    { id: 3, name: "Charlie", lastMessage: "Ping me later" },
  ];
  const router = useRouter();
  const openChat = (id: number | string) => {
    router.push(`/chat/${id}`);
  };

  return (
    <div className="container-fluid py-3">
      <div className="row g-3">
        {/* Left: Contacts */}
        <aside className="col-12 col-lg-3">
          <div className="chats-list-card">
            <div className="chats-card-titlebar">
              <span className="chats-card-title">Contacts</span>
            </div>
            <ul className="list-group list-group-flush chats-list">
              {contacts.map((c) => (
                <Contact key={c.id} contact_name={c.name} onClick={() => openChat(c.id)}>
                  {c.lastMessage}
                </Contact>
              ))}
            </ul>
          </div>
        </aside>

        {/* Middle: Placeholder */}
        <section className="col-12 col-lg-3">
          <div className="hero-panel">
            <div className="hero-content">
              <h2 className="cubcha-heading">Workspace</h2>
              <p className="hero-copy">This panel is reserved for future features.</p>
            </div>
          </div>
        </section>

        {/* Right: Chat content */}
        <main className="col-12 col-lg-6">
          {children}
        </main>
      </div>
    </div>
  );
}
