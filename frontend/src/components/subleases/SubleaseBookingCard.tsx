// frontend/src/components/sublease/SubleaseBookingCard.tsx
import { useState, useRef, useEffect } from "react";
import PropertyImage from "@/components/common/PropertyImage";
import { formatters } from "@/utils/formatters";
import {
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  StarIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BoltIcon,
  CheckIcon,
  UserIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid,
} from "@heroicons/react/24/solid";
import DateInput from "../common/DateInput";
import DateRangePicker from "../common/DateRangePicker";

interface SubleaseBookingCardProps {
  sublease: any;
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  onContact: () => void;
}

export default function SubleaseBookingCard({
  sublease,
  isSaved,
  onSave,
  onShare,
  onContact,
}: SubleaseBookingCardProps) {
  const [startDate, setStartDate] = useState(sublease.startDate);
  const [endDate, setEndDate] = useState(sublease.endDate);
  const [showUtilities, setShowUtilities] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(
    null
  );
  const datePickerRef = useRef<HTMLDivElement>(null);

  const calculateMonths = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    return Math.max(1, months);
  };

  const duration = calculateMonths(startDate, endDate);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Custom date picker component
  const CustomDatePicker = ({
    value,
    onChange,
    min,
    max,
    label,
  }: {
    value: string;
    onChange: (date: string) => void;
    min: string;
    max: string;
    label: string;
  }) => {
    const [month, setMonth] = useState(new Date(value).getMonth());
    const [year, setYear] = useState(new Date(value).getFullYear());

    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
      return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day: number) => {
      const newDate = new Date(year, month, day);
      onChange(newDate.toISOString().split("T")[0]);
      setShowDatePicker(null);
    };

    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const selectedDate = new Date(value);

    return (
      <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
        {/* Month/Year Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (month === 0) {
                setMonth(11);
                setYear(year - 1);
              } else {
                setMonth(month - 1);
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <ChevronDownIcon className="h-4 w-4 rotate-90" />
          </button>

          <div className="text-sm font-semibold text-gray-900">
            {new Date(year, month).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>

          <button
            onClick={() => {
              if (month === 11) {
                setMonth(0);
                setYear(year + 1);
              } else {
                setMonth(month + 1);
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <ChevronDownIcon className="h-4 w-4 -rotate-90" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-xs text-gray-500 font-medium text-center py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first week */}
          {Array.from({ length: firstDay }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const currentDate = new Date(year, month, day);
            const dateString = currentDate.toISOString().split("T")[0];
            const isSelected =
              selectedDate.getDate() === day &&
              selectedDate.getMonth() === month &&
              selectedDate.getFullYear() === year;
            const isDisabled = dateString < min || dateString > max;
            const isToday =
              new Date().toDateString() === currentDate.toDateString();

            return (
              <button
                key={day}
                onClick={() => !isDisabled && handleDateSelect(day)}
                disabled={isDisabled}
                className={`
                  p-2 text-sm rounded-lg transition-all
                  ${
                    isSelected
                      ? "bg-primary-600 text-white font-medium"
                      : isToday
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : isDisabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="sticky top-24">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Price Section */}
        <div className="p-6 border-b bg-gradient-to-br from-gray-50 to-white">
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                ${formatters.number(sublease.subleaseRent)}
              </span>
              <span className="text-gray-600 text-lg">/month</span>
            </div>

            {sublease.discountPercentage && sublease.discountPercentage > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm line-through text-gray-500">
                  ${formatters.number(sublease.originalRent)}
                </span>
                <span className="px-2 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                  Save {sublease.discountPercentage}%
                </span>
              </div>
            )}
          </div>

          {/* Deposit and Utilities Info */}
          <div className="space-y-2 mt-3">
            {sublease.depositAmount && sublease.depositAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium text-gray-900">
                  ${formatters.number(sublease.depositAmount)}
                </span>
              </div>
            )}

            {/* Utilities with Dropdown */}
            {sublease.utilitiesIncluded &&
            sublease.utilitiesIncluded.length > 0 ? (
              <div>
                <button
                  onClick={() => setShowUtilities(!showUtilities)}
                  className="w-full flex items-center justify-between text-sm hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-green-700">
                    <BoltIcon className="h-4 w-4" />
                    {sublease.utilitiesIncluded.length} utilities included
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      showUtilities ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUtilities && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-1">
                      {sublease.utilitiesIncluded.map(
                        (utility: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-xs text-green-800"
                          >
                            <CheckIcon className="h-3 w-3 text-green-600" />
                            <span>{utility}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <BoltIcon className="h-4 w-4" />
                <span>Utilities not included</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Date Selection - Improved */}
          <div className="mb-6">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              minDate={sublease.startDate}
              maxDate={sublease.endDate}
              minStayMonths={sublease.minimumStay || 1}
            />

            {/* Duration Summary */}
            <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl p-4 mt-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-700 font-medium">
                  Lease Duration
                </span>
                <span className="font-bold text-gray-900">
                  {duration} {duration === 1 ? "month" : "months"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">
                  Total Amount
                </span>
                <span className="font-bold text-xl text-primary-700">
                  ${formatters.number(sublease.subleaseRent * duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Host Info - Above Contact Button */}
          <div className="mb-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                {sublease.user?.profilePicture ? (
                  <PropertyImage
                    image={sublease.user.profilePicture}
                    alt={sublease.user.firstName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-white">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                )}
                {sublease.user?.emailVerified && (
                  <CheckBadgeIconSolid className="absolute -bottom-1 -right-1 h-4 w-4 text-primary-500 bg-white rounded-full" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {sublease.user?.firstName} {sublease.user?.lastName?.[0]}.
                  </h3>
                  {sublease.user?.rating && sublease.user.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      <StarIcon className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium text-gray-700">
                        {sublease.user.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                {sublease.user?.university && (
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                    <AcademicCapIcon className="h-3 w-3" />
                    {typeof sublease.user.university === "object"
                      ? sublease.user.university.name
                      : "University Student"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <button
            onClick={onContact}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            Contact Host
          </button>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-3">
            <button
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              {isSaved ? (
                <HeartIconSolid className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Urgency Notice */}
          {sublease.urgencyLevel === "urgent" && (
            <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-2">
                <BellAlertIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    High demand
                  </p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    This place is getting lots of attention
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Link */}
        <div className="px-6 pb-4 text-center">
          <button className="text-xs text-gray-400 hover:text-gray-600 underline inline-flex items-center gap-1">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Report this listing
          </button>
        </div>
      </div>
    </div>
  );
}
