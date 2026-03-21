import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineXMark,
  HiOutlineTag,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArchiveBox,
  HiOutlinePaperClip,
  HiOutlineBolt,
  HiOutlineMicrophone,
} from "react-icons/hi2";

const STATUS_TABS = ["open", "pending", "closed", "archived"];
const STATUS_ICONS = {
  open: HiOutlineChatBubbleLeftRight,
  pending: HiOutlineClock,
  closed: HiOutlineCheckCircle,
  archived: HiOutlineArchiveBox,
};

/* ── helpers ──────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function avatarFallback(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getConversationPhone(conversation) {
  return conversation?.contacts?.phone_number || conversation?.participant_phone || "";
}

function getConversationName(conversation) {
  return (
    conversation?.contacts?.name ||
    conversation?.participant_name ||
    getConversationPhone(conversation) ||
    "Unknown"
  );
}

/* ── Conversation List Item ──────────────── */

function ConvItem({ conv, isActive, onClick }) {
  const contact = conv.contacts;
  const displayName = getConversationName(conv);
  const displayPhone = getConversationPhone(conv);
  return (
    <button
      onClick={() => onClick(conv)}
      className={`flex w-full items-start gap-3 border-b border-[var(--color-border)] p-3 text-left transition-colors hover:bg-[var(--color-bg-secondary)] ${isActive ? "bg-[var(--color-primary)]/10" : ""}`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm font-semibold text-[var(--color-primary)]">
        {contact?.avatar_url ? (
          <img
            src={contact.avatar_url}
            className="h-full w-full rounded-full object-cover"
            alt=""
          />
        ) : (
          avatarFallback(displayName || displayPhone)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {displayName}
          </p>
          <span className="ml-2 shrink-0 text-xs text-[var(--color-text-tertiary)]">
            {timeAgo(conv.last_message_at)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
          {conv.last_message_preview || "No messages yet"}
        </p>
      </div>

      {conv.unread_count > 0 && (
        <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
          {conv.unread_count}
        </span>
      )}
    </button>
  );
}

/* ── Audio Player (WhatsApp-style) ───────── */

function AudioPlayer({ src, isOutgoing }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2.5 min-w-[200px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a?.duration) {
            setCurrentTime(a.currentTime);
            setProgress((a.currentTime / a.duration) * 100);
          }
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
      />
      <button
        onClick={toggle}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          isOutgoing
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-[var(--color-primary)] text-white hover:opacity-90"
        }`}
      >
        {playing ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg
            className="h-3.5 w-3.5 ml-0.5"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4 2.5v11l9-5.5L4 2.5z" />
          </svg>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div
          className="relative h-1 w-full cursor-pointer rounded-full"
          style={{
            backgroundColor: isOutgoing
              ? "rgba(255,255,255,0.2)"
              : "rgba(0,0,0,0.08)",
          }}
          onClick={handleSeek}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-100"
            style={{
              width: `${progress}%`,
              backgroundColor: isOutgoing
                ? "rgba(255,255,255,0.7)"
                : "var(--color-primary)",
            }}
          />
        </div>
        <span
          className={`text-[10px] leading-none ${
            isOutgoing ? "text-white/60" : "text-[var(--color-text-tertiary)]"
          }`}
        >
          {currentTime > 0 ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  );
}

/* ── Media Lightbox (fullscreen overlay) ─── */

function MediaLightbox({ url, type, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
      >
        <HiOutlineXMark className="h-6 w-6" />
      </button>
      <div
        className="max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {type === "image" ? (
          <img
            src={url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
          />
        )}
      </div>
    </div>
  );
}

/* ── Message Bubble ──────────────────────── */

const MEDIA_LABEL_SET = new Set([
  "📷 Photo",
  "🎥 Video",
  "🎤 Voice message",
  "📎 Document",
  "Sticker",
  "📍 Location",
  "📇 Contact",
]);

function MsgBubble({ msg, onMediaClick }) {
  const isCustomer = msg.sender_type === "customer";
  const isSystem = msg.sender_type === "system";
  const isOutgoing = !isCustomer;

  if (isSystem) {
    return (
      <div className="my-2 text-center text-xs text-[var(--color-text-tertiary)]">
        {msg.content}
      </div>
    );
  }

  const hasMedia = msg.media_url && msg.message_type !== "text";
  const isImage = hasMedia && msg.message_type === "image";
  const isVideo = hasMedia && msg.message_type === "video";
  const isAudio = hasMedia && msg.message_type === "audio";
  const isDoc =
    hasMedia &&
    (msg.message_type === "document" || msg.message_type === "sticker");
  const showContent =
    msg.content && !(hasMedia && MEDIA_LABEL_SET.has(msg.content));
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeColor = isCustomer
    ? "text-[var(--color-text-tertiary)]"
    : "text-white/70";

  return (
    <div
      className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-2`}
    >
      <div
        className={`max-w-[75%] overflow-hidden rounded-2xl text-sm ${
          isCustomer
            ? "rounded-bl-md bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            : "rounded-br-md bg-[var(--color-primary)] text-white"
        }`}
      >
        {/* Image */}
        {isImage && (
          <div
            className="cursor-pointer"
            onClick={() => onMediaClick?.(msg.media_url, "image")}
          >
            <img
              src={msg.media_url}
              alt=""
              className="w-full max-h-72 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Video thumbnail with play overlay */}
        {isVideo && (
          <div
            className="relative cursor-pointer"
            onClick={() => onMediaClick?.(msg.media_url, "video")}
          >
            <video
              src={msg.media_url}
              className="w-full max-h-72 object-cover"
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <svg
                  className="h-5 w-5 ml-0.5 text-white"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4 2.5v11l9-5.5L4 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Audio */}
        {isAudio && (
          <div className="px-3 py-2.5">
            <AudioPlayer src={msg.media_url} isOutgoing={isOutgoing} />
          </div>
        )}

        {/* Document / Sticker */}
        {isDoc && (
          <div className="px-3 pt-2.5">
            <a
              href={msg.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isOutgoing
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-black/5 text-[var(--color-text-primary)] hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              {msg.content && !MEDIA_LABEL_SET.has(msg.content)
                ? msg.content
                : "Document"}
            </a>
          </div>
        )}

        {/* Text + timestamp */}
        <div
          className={`${
            (isImage || isVideo) && !showContent ? "px-3 py-1" : "px-3 py-2"
          }`}
        >
          {showContent && (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          )}
          <p
            className={`text-right text-[10px] ${showContent ? "mt-1" : ""} ${timeColor}`}
          >
            {time}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Contact Sidebar ─────────────────────── */

function ContactPanel({
  conversation,
  notes,
  onAddNote,
  onSaveContact,
  savingContact,
}) {
  const { t } = useTranslation();
  const contact = conversation?.contacts;
  const displayName = getConversationName(conversation);
  const displayPhone = getConversationPhone(conversation);
  const [noteText, setNoteText] = useState("");

  if (!conversation) return null;

  const handleSubmitNote = () => {
    if (!noteText.trim()) return;
    onAddNote(noteText.trim());
    setNoteText("");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Contact Info */}
      <div className="border-b border-[var(--color-border)] p-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xl font-bold text-[var(--color-primary)]">
            {avatarFallback(displayName || displayPhone)}
          </div>
          <h3 className="mt-2 font-semibold text-[var(--color-text-primary)]">
            {displayName}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {displayPhone || "-"}
          </p>
          {!contact?.id && displayPhone && (
            <button
              onClick={onSaveContact}
              disabled={savingContact}
              className="mt-3 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingContact
                ? t("dashboard.conversations.savingContact")
                : t("dashboard.conversations.saveContact")}
            </button>
          )}
          {contact?.classification && (
            <span className="mt-1 inline-block rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
              {contact.classification}
            </span>
          )}
        </div>
      </div>

      {/* Conversation Info */}
      <div className="border-b border-[var(--color-border)] p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase text-[var(--color-text-tertiary)]">
          {t("dashboard.conversations.details")}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">
              {t("dashboard.conversations.status")}
            </span>
            <span className="capitalize text-[var(--color-text-primary)]">
              {conversation.status}
            </span>
          </div>
          {conversation.profiles && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">
                {t("dashboard.conversations.assignedTo")}
              </span>
              <span className="text-[var(--color-text-primary)]">
                {conversation.profiles.full_name}
              </span>
            </div>
          )}
          {conversation.ai_agents && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">
                {t("dashboard.conversations.aiAgent")}
              </span>
              <span className="text-[var(--color-text-primary)]">
                {conversation.ai_agents.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="flex-1 p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase text-[var(--color-text-tertiary)]">
          {t("dashboard.conversations.notes")}
        </h4>
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg bg-[var(--color-bg-secondary)] p-2 text-sm"
            >
              <p className="text-[var(--color-text-primary)]">{note.content}</p>
              <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                {note.profiles?.full_name} ·{" "}
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t("dashboard.conversations.addNote")}
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleSubmitNote()}
          />
          <button
            onClick={handleSubmitNote}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────── */

export default function Conversations() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const urlSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState("open");
  const [showContact, setShowContact] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const messagesEndRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [lightbox, setLightbox] = useState(null);

  // Sync search from URL params (when navigating from TopBar)
  useEffect(() => {
    const s = searchParams.get("search") || "";
    if (s && s !== search) {
      setSearch(s);
      setDebouncedSearch(s);
    }
    if (s) {
      searchParams.delete("search");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        status: statusFilter,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await api.get(`/crm/conversations?${params}`);
      setConversations(res.data || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-select from URL param
  useEffect(() => {
    const convId = searchParams.get("id");
    if (convId && conversations.length > 0) {
      const found = conversations.find((c) => c.id === convId);
      if (found) setActiveConv(found);
    }
  }, [searchParams, conversations]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      setNotes([]);
      return;
    }

    let cancelled = false;
    setMsgsLoading(true);

    Promise.all([
      api.get(`/crm/conversations/${activeConv.id}/messages?page=1&limit=100`),
      api.get(`/crm/conversations/${activeConv.id}/notes`),
    ])
      .then(([msgRes, noteRes]) => {
        if (cancelled) return;
        setMessages(msgRes.data || []);
        setNotes(noteRes.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setMessages([]);
          setNotes([]);
        }
      })
      .finally(() => {
        if (!cancelled) setMsgsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeConv]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch quick replies once
  useEffect(() => {
    api
      .get("/quick-replies")
      .then((res) => setQuickReplies(res.data || []))
      .catch(() => {});
  }, []);

  // Handle input changes — detect "/" prefix for quick replies
  const handleMsgChange = (e) => {
    const val = e.target.value;
    setNewMsg(val);
    setShowQuickReplies(val.startsWith("/") && val.length > 0);
  };

  // Filter quick replies based on typed shortcut
  const filteredReplies = showQuickReplies
    ? quickReplies.filter(
        (r) =>
          !newMsg.slice(1) ||
          r.shortcut?.toLowerCase().includes(newMsg.slice(1).toLowerCase()) ||
          r.title?.toLowerCase().includes(newMsg.slice(1).toLowerCase()),
      )
    : [];

  const selectQuickReply = (reply) => {
    setNewMsg(reply.content);
    setShowQuickReplies(false);
  };

  // Select conversation
  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    setSearchParams({ id: conv.id });
    setShowContact(false);

    // Mark as read: reset local badge + tell backend
    if (conv.unread_count > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)),
      );
      api.get(`/crm/conversations/${conv.id}`).catch(() => {});
    }
  };

  // Media file helpers
  const MEDIA_TYPE_MAP = {
    "image/": "image",
    "video/": "video",
    "audio/": "audio",
  };

  const resolveMediaType = (mime) => {
    for (const [prefix, type] of Object.entries(MEDIA_TYPE_MAP)) {
      if (mime.startsWith(prefix)) return type;
    }
    return "document";
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    if (file.type.startsWith("image/")) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Lightbox
  const openLightbox = (url, type) => setLightbox({ url, type });

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        await sendVoiceNote(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(
        () => setRecordingDuration((d) => d + 1),
        1000,
      );
    } catch {
      /* mic access denied */
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      const stream = mediaRecorderRef.current.stream;
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () =>
        stream?.getTracks().forEach((t) => t.stop());
      if (mediaRecorderRef.current.state === "recording")
        mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const sendVoiceNote = async (blob) => {
    if (!activeConv || !blob) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", blob, `voice_${Date.now()}.webm`);
      formData.append("conversationId", activeConv.id);
      const uploadRes = await api.post("/whatsapp/media/upload", formData);

      await api.post("/whatsapp/messages/send", {
        conversationId: activeConv.id,
        content: "",
        messageType: "audio",
        mediaUrl: uploadRes.data.url,
      });

      const res = await api.get(
        `/crm/conversations/${activeConv.id}/messages?page=1&limit=100`,
      );
      setMessages(res.data || []);
    } catch {
      /* toast would go here */
    } finally {
      setUploading(false);
    }
  };

  // Send message (uses the WhatsApp API endpoint)
  const handleSend = async () => {
    if ((!newMsg.trim() && !mediaFile) || !activeConv) return;

    try {
      let mediaUrl = null;
      let messageType = "text";

      // Upload media via backend API (bypasses Supabase RLS)
      if (mediaFile) {
        setUploading(true);
        messageType = resolveMediaType(mediaFile.type);
        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("conversationId", activeConv.id);
        const uploadRes = await api.post("/whatsapp/media/upload", formData);
        mediaUrl = uploadRes.data.url;
      }

      await api.post("/whatsapp/messages/send", {
        conversationId: activeConv.id,
        content: newMsg.trim() || mediaFile?.name || "",
        messageType,
        mediaUrl,
      });

      setNewMsg("");
      clearMedia();

      // Refresh messages
      const res = await api.get(
        `/crm/conversations/${activeConv.id}/messages?page=1&limit=100`,
      );
      setMessages(res.data || []);
    } catch {
      /* toast would go here */
    } finally {
      setUploading(false);
    }
  };

  // Add note
  const handleAddNote = async (content) => {
    if (!activeConv) return;
    try {
      await api.post(`/crm/conversations/${activeConv.id}/notes`, { content });
      const res = await api.get(`/crm/conversations/${activeConv.id}/notes`);
      setNotes(res.data || []);
    } catch {
      /* ignore */
    }
  };

  // Change conversation status
  const handleStatusChange = async (newStatus) => {
    if (!activeConv || activeConv.status === newStatus) return;
    try {
      await api.patch(`/crm/conversations/${activeConv.id}`, {
        status: newStatus,
      });
      setActiveConv((prev) => ({ ...prev, status: newStatus }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id ? { ...c, status: newStatus } : c,
        ),
      );
    } catch {
      /* ignore */
    }
  };

  const handleSaveContact = async () => {
    if (!activeConv || activeConv.contacts?.id || !getConversationPhone(activeConv))
      return;

    try {
      setSavingContact(true);
      const res = await api.post(
        `/crm/conversations/${activeConv.id}/save-contact`,
        {
          name: activeConv.participant_name || "",
        },
      );

      const updated = res.data;
      setActiveConv(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch {
      /* ignore */
    } finally {
      setSavingContact(false);
    }
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] sm:-m-6">
      {/* ── Panel 1: Conversation List ──────── */}
      <div
        className={`flex w-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:w-80 lg:w-96 ${activeConv ? "hidden md:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="border-b border-[var(--color-border)] p-3">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("dashboard.conversations.title")}
          </h1>
          {/* Search */}
          <div className="relative mt-2">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.conversations.search")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          {/* Status tabs */}
          <div className="mt-2 flex gap-1">
            {STATUS_TABS.map((s) => {
              const Icon = STATUS_ICONS[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(`dashboard.conversations.${s}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-[var(--color-primary)] border-t-transparent" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <HiOutlineChatBubbleLeftRight className="mb-2 h-10 w-10 text-[var(--color-text-tertiary)]" />
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {t("dashboard.conversations.noConversations")}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={activeConv?.id === conv.id}
                onClick={handleSelectConv}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Panel 2: Chat ───────────────────── */}
      <div
        className={`flex flex-1 flex-col bg-[var(--color-bg)] ${!activeConv ? "hidden md:flex" : "flex"}`}
      >
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Back button on mobile */}
                <button
                  onClick={() => setActiveConv(null)}
                  className="mr-1 md:hidden"
                >
                  <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm font-semibold text-[var(--color-primary)]">
                  {avatarFallback(getConversationName(activeConv))}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {getConversationName(activeConv)}
                  </p>
                  {!activeConv.contacts?.name && getConversationPhone(activeConv) && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {getConversationPhone(activeConv)}
                    </p>
                  )}
                  <p className="text-xs capitalize text-[var(--color-text-tertiary)]">
                    {activeConv.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Status change buttons */}
                {STATUS_TABS.filter((s) => s !== activeConv.status).map((s) => {
                  const Icon = STATUS_ICONS[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                      title={t(`dashboard.conversations.${s}`)}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  title={t("dashboard.conversations.contactInfo")}
                >
                  <HiOutlineUser className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {msgsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-[var(--color-primary)] border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                  {t("dashboard.conversations.noMessages")}
                </div>
              ) : (
                messages.map((msg) => (
                  <MsgBubble
                    key={msg.id}
                    msg={msg}
                    onMediaClick={openLightbox}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="relative border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              {/* Quick replies dropdown */}
              {showQuickReplies && filteredReplies.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                  {filteredReplies.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => selectQuickReply(r)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-secondary)]"
                    >
                      <HiOutlineBolt className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {r.title}
                          {r.shortcut && (
                            <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">
                              /{r.shortcut}
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">
                          {r.content}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {/* Media attachment preview */}
              {mediaFile && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                  {mediaPreview && (
                    <img
                      src={mediaPreview}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <span className="flex-1 truncate text-xs text-[var(--color-text-secondary)]">
                    {mediaFile.name}
                  </span>
                  <button
                    onClick={clearMedia}
                    className="shrink-0 rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg)]"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isRecording ? (
                  <>
                    <button
                      onClick={cancelRecording}
                      className="rounded-lg p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Cancel"
                    >
                      <HiOutlineXMark className="h-5 w-5" />
                    </button>
                    <div className="flex flex-1 items-center gap-3 rounded-lg bg-red-50 px-4 py-2.5 dark:bg-red-900/20">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {Math.floor(recordingDuration / 60)}:
                        {(recordingDuration % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs text-red-400 dark:text-red-500">
                        Recording…
                      </span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="rounded-lg bg-[var(--color-primary)] p-2.5 text-white transition-opacity hover:opacity-90"
                      title="Send voice note"
                    >
                      <HiOutlinePaperAirplane className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg p-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                      title={t("dashboard.conversations.attachFile")}
                    >
                      <HiOutlinePaperClip className="h-5 w-5" />
                    </button>
                    <button
                      onClick={startRecording}
                      className="rounded-lg p-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                      title="Record voice note"
                    >
                      <HiOutlineMicrophone className="h-5 w-5" />
                    </button>
                    <input
                      value={newMsg}
                      onChange={handleMsgChange}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && handleSend()
                      }
                      placeholder={
                        t("dashboard.conversations.typeMessage") +
                        ' — type "/" for quick replies'
                      }
                      className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={(!newMsg.trim() && !mediaFile) || uploading}
                      className="rounded-lg bg-[var(--color-primary)] p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <HiOutlinePaperAirplane className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-[var(--color-text-tertiary)]">
            <HiOutlineChatBubbleLeftRight className="mb-3 h-16 w-16 opacity-30" />
            <p className="text-lg font-medium">
              {t("dashboard.conversations.selectConversation")}
            </p>
            <p className="mt-1 text-sm">
              {t("dashboard.conversations.selectHint")}
            </p>
          </div>
        )}
      </div>

      {/* ── Panel 3: Contact Details Sidebar ── */}
      {activeConv && showContact && (
        <div className="hidden w-72 border-l border-[var(--color-border)] bg-[var(--color-surface)] lg:block xl:w-80">
          <ContactPanel
            conversation={activeConv}
            notes={notes}
            onAddNote={handleAddNote}
            onSaveContact={handleSaveContact}
            savingContact={savingContact}
          />
        </div>
      )}

      {/* Media lightbox */}
      {lightbox && (
        <MediaLightbox
          url={lightbox.url}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
