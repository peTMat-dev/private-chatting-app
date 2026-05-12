export default function ChatDetail({ params }: { params: { id: string } }) {
  const chatId = params.id;

  const homeUser = "You";
  const thread = [
    { contact: homeUser, text: "Hello there" },
    { contact: "Alice", text: "Hi! How can I help?" },
    { contact: homeUser, text: "Just testing the chat view." },
  ];

  return (
    <div className="auth-card">
      <MessageBox>
        {thread.map((m, idx) => (
          <Message key={idx} contact_name={m.contact} home_user={homeUser}>
            {m.text}
          </Message>
        ))}
      </MessageBox>
    </div>
  );
}
