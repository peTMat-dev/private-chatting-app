import { redirect } from "next/navigation";

export default function ChatsIdRedirect({ params }: { params: { id: string } }) {
  // Normalize: if users navigate to /chats/<id>, redirect to /chat/<id>
  redirect(`/chat/${encodeURIComponent(params.id)}`);
}
