import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn } from "@/modules/common/utils";

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  profileIconUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserAvatar = ({
  firstName = "",
  lastName = "",
  profileIconUrl,
  size = "md",
  className,
}: UserAvatarProps) => {
  const getInitials = () => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    return "U";
  };

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {profileIconUrl && <AvatarImage src={profileIconUrl} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback
        className="bg-blue-600 text-white font-medium"
        style={{ backgroundColor: "#0B4B39" }}
      >
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
