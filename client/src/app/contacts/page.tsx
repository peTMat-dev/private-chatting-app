export default function ContactsPage() {
  return (
    <div className="mobile-chats-screen">
      <section className="chats-list-card">
        <div className="chats-card-titlebar">
          <span className="chats-card-title">Contacts</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true" />
          <h2>Contacts coming soon</h2>
          <p>This page will list your saved contacts.</p>
        </div>
      </section>
    </div>
  );
}
