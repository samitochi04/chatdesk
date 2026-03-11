import { useParams } from "react-router-dom";

export default function BlogPost() {
  const { slug } = useParams();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        {slug}
      </h1>
    </div>
  );
}
