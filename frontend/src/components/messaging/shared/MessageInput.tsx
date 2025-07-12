// frontend/src/components/messaging/shared/MessageInput.tsx
import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { useDebounce } from "@/hooks/forms/useDebounce";
import { 
  PaperAirplaneIcon, 
  PaperClipIcon,
  PhotoIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface MessageInputProps {
  onSendMessage: (content: string, metadata?: any) => Promise<void>;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showAttachment?: boolean;
}

export function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
  placeholder = "Type a message...",
  showAttachment = true,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced typing indicator
  const debouncedMessage = useDebounce(message, 300);

  useEffect(() => {
    // Auto-focus on mount
    textareaRef.current?.focus();
    
    return () => {
      if (isTyping) {
        onStopTyping?.();
      }
    };
  }, [isTyping, onStopTyping]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onStopTyping?.();
    }

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage("");
      setAttachmentPreview(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t bg-white">
      {/* Attachment Preview */}
      {attachmentPreview && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative inline-block">
            <img 
              src={attachmentPreview} 
              alt="Attachment preview" 
              className="h-20 w-20 rounded-lg object-cover border border-neutral-200"
            />
            <button
              onClick={removeAttachment}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-end space-x-3">
          {/* Attachment Options */}
          {showAttachment && (
            <div className="flex items-center space-x-1 pb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all"
                title="Attach image"
                disabled={disabled}
              >
                <PhotoIcon className="h-5 w-5" />
              </button>
              
              <button
                type="button"
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all opacity-50 cursor-not-allowed"
                title="Attach file (coming soon)"
                disabled
              >
                <PaperClipIcon className="h-5 w-5" />
              </button>
              
              <button
                type="button"
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all opacity-50 cursor-not-allowed"
                title="Voice message (coming soon)"
                disabled
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Message Input Container */}
          <div className="flex-1 relative">
            <div className="relative flex items-end bg-neutral-100 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-primary-500 focus-within:bg-neutral-50">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled || isSending}
                rows={1}
                className="flex-1 bg-transparent px-4 py-3 pr-12 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 placeholder-neutral-500"
                style={{ minHeight: "44px" }}
              />
              
              {/* Emoji Button */}
              <button
                type="button"
                className="absolute right-2 bottom-2.5 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded-lg transition-all"
                title="Add emoji"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Character count for long messages */}
            {message.length > 800 && (
              <div className="absolute -top-6 right-0 text-xs text-neutral-500">
                {message.length}/1000
              </div>
            )}
          </div>
          
          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending || disabled}
            className={`p-3 rounded-xl transition-all transform ${
              message.trim() && !isSending
                ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg hover:scale-105 text-white"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            {isSending ? (
              <div className="h-5 w-5">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Quick Replies (optional feature) */}
        {!disabled && !message && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setMessage("Thanks!")}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm rounded-full transition-all"
            >
              Thanks! 👍
            </button>
            <button
              onClick={() => setMessage("Sounds good")}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm rounded-full transition-all"
            >
              Sounds good
            </button>
            <button
              onClick={() => setMessage("I'll get back to you")}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm rounded-full transition-all"
            >
              I'll get back to you
            </button>
          </div>
        )}
      </div>
    </div>
  );
}