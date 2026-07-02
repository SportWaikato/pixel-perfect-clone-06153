import { Loader2 } from "lucide-react";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";

interface SchoolCheckboxListProps {
  schools: SchoolInterface[];
  selectedIds: string[];
  isLoading: boolean;
  onToggle: (schoolId: string) => void;
  emptyMessage?: string;
  className?: string;
}

const SchoolCheckboxList = ({
  schools,
  selectedIds,
  isLoading,
  onToggle,
  emptyMessage,
  className = "space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4 max-h-64 overflow-y-auto",
}: SchoolCheckboxListProps) => (
  <div className={className}>
    {isLoading ? (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading schools...
      </div>
    ) : (
      <>
        {schools.map((school) => {
          const isSelected = selectedIds.includes(school.id);
          return (
            <label
              key={school.id}
              className="flex items-center justify-between gap-4 rounded-md border border-transparent bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-300 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{school.name}</span>
                {school.is_internal && (
                  <span className="text-xs text-emerald-600">Sport Waikato / Internal</span>
                )}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(school.id)}
                className="h-4 w-4"
              />
            </label>
          );
        })}
        {emptyMessage && selectedIds.length === 0 && (
          <p className="text-sm text-gray-600">{emptyMessage}</p>
        )}
      </>
    )}
  </div>
);

export default SchoolCheckboxList;
