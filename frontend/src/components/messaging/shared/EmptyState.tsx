// frontend/src/components/messaging/shared/EmptyState.tsx
import { 
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  UsersIcon,
  SparklesIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface EmptyStateProps {
  userType: "student" | "property_owner";
  variant?: "no-messages" | "no-results" | "no-conversations";
  searchQuery?: string;
  filterType?: "all" | "property" | "roommate";
}

export function EmptyState({ 
  userType, 
  variant = "no-conversations",
  searchQuery,
  filterType = "all"
}: EmptyStateProps) {
  const getContent = () => {
    if (variant === "no-results" && searchQuery) {
      return {
        icon: <MagnifyingGlassIcon className="h-12 w-12" />,
        title: "No results found",
        description: `We couldn't find any conversations matching "${searchQuery}"`,
        action: null,
        bgGradient: "from-neutral-100 to-neutral-200",
        iconBg: "from-neutral-200 to-neutral-300",
      };
    }

    if (userType === "student") {
      if (filterType === "roommate") {
        return {
          icon: <UsersIcon className="h-12 w-12" />,
          title: "No roommate conversations yet",
          description: "Connect with potential roommates to find your perfect match",
          action: {
            label: "Find Roommates",
            href: "/roommates",
            icon: <ArrowRightIcon className="h-4 w-4 ml-2" />,
          },
          bgGradient: "from-purple-100 to-purple-200",
          iconBg: "from-purple-200 to-purple-300",
        };
      }

      if (filterType === "property") {
        return {
          icon: <BuildingOfficeIcon className="h-12 w-12" />,
          title: "No property inquiries yet",
          description: "Start exploring properties and contact owners to find your new home",
          action: {
            label: "Browse Properties",
            href: "/properties",
            icon: <ArrowRightIcon className="h-4 w-4 ml-2" />,
          },
          bgGradient: "from-blue-100 to-blue-200",
          iconBg: "from-blue-200 to-blue-300",
        };
      }

      return {
        icon: <ChatBubbleLeftRightIcon className="h-12 w-12" />,
        title: "Your conversations will appear here",
        description: "Start by contacting a property owner or connecting with potential roommates",
        action: {
          label: "Explore Properties",
          href: "/properties",
          icon: <SparklesIcon className="h-4 w-4 ml-2" />,
        },
        bgGradient: "from-primary-100 to-primary-200",
        iconBg: "from-primary-200 to-primary-300",
      };
    }

    // Property owner
    return {
      icon: <InboxIcon className="h-12 w-12" />,
      title: "No inquiries yet",
      description: "When students are interested in your properties, their messages will appear here",
      action: {
        label: "Manage Properties",
        href: "/dashboard/properties",
        icon: <BuildingOfficeIcon className="h-4 w-4 ml-2" />,
      },
      bgGradient: "from-indigo-100 to-indigo-200",
      iconBg: "from-indigo-200 to-indigo-300",
    };
  };

  const content = getContent();

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          <div className={`w-24 h-24 bg-gradient-to-br ${content.bgGradient} rounded-full mx-auto animate-pulse`}></div>
          <div className={`absolute inset-0 w-24 h-24 bg-gradient-to-br ${content.iconBg} rounded-full mx-auto flex items-center justify-center transform transition-transform hover:scale-110`}>
            <div className="text-white">
              {content.icon}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full animate-bounce"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 -right-8 w-3 h-3 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-neutral-900 mb-3">
          {content.title}
        </h3>
        <p className="text-neutral-600 mb-8 leading-relaxed">
          {content.description}
        </p>

        {/* Action Button */}
        {content.action && (
          <Link
            href={content.action.href}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:shadow-lg transition-all transform hover:scale-105 group"
          >
            {content.action.label}
            <span className="transition-transform group-hover:translate-x-1">
              {content.action.icon}
            </span>
          </Link>
        )}

        {/* Additional Tips for Property Owners */}
        {userType === "property_owner" && variant === "no-conversations" && (
          <div className="mt-12 text-left bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
              Tips to get more inquiries
            </h4>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Add high-quality photos to your listings
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Write detailed descriptions with amenities
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Set competitive prices for your area
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Respond quickly to maintain high ranking
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}