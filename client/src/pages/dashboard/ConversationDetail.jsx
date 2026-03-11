import { useParams } from "react-router-dom";

export default function ConversationDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Conversation #{id}
      </h1>
    </div>
  );
}
