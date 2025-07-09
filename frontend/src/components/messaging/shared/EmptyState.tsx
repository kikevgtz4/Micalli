// frontend/src/components/messaging/shared/EmptyState.tsx
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface EmptyStateProps {
  userType: "student" | "property_owner";
}

export function EmptyState({ userType }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">
          No conversations yet
        </h3>
        <p className="text-neutral-600 mb-6">
          {userType === "student"
            ? "Start by contacting a property owner or connecting with potential roommates."
            : "You'll see inquiries from interested students here."}
        </p>
        {userType === "student" && (
          <Link
            href="/properties"
            className="btn-primary inline-flex items-center"
          >
            Browse Properties
          </Link>
        )}
      </div>
    </div>
  );
}