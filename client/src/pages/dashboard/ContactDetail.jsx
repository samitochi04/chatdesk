import { useParams } from "react-router-dom";

export default function ContactDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Contact #{id}
      </h1>
    </div>
  );
}
