// frontend/src/components/messaging/shared/MessageInput.tsx
import { useState, KeyboardEvent } from "react";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/outline";

interface MessageInputProps {
  onSendMessage: (content: string, metadata?: any) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  showAttachment?: boolean;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  showAttachment = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-white px-4 py-3">
      <div className="flex items-end space-x-2">
        {showAttachment && (
          <button
            type="button"
            className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
            title="Attach file (coming soon)"
            disabled
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
        )}
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          className="flex-1 resize-none rounded-lg border-neutral-300 focus:border-primary-500 focus:ring-primary-500 disabled:bg-neutral-50"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}