import { Loader2 } from "lucide-react";

const UserPageSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-[#00ACEF]" />
  </div>
);

export default UserPageSkeleton;
