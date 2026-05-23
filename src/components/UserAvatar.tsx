import type { UserProfile } from "../app/types";
import { avatarFor } from "../app/userProfile";

interface UserAvatarProps {
  profile: UserProfile;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ profile, size = "md", className = "" }: UserAvatarProps) {
  const avatar = avatarFor(profile);
  const imageUrl = profile.avatarDataUrl ?? avatar.src;

  if (imageUrl) {
    return (
      <span className={`user-avatar ${size} ${className}`} style={{ backgroundImage: `url(${imageUrl})` }}>
        <span className="sr-only">{profile.displayName}</span>
      </span>
    );
  }

  return (
    <span
      className={`user-avatar ${size} ${className}`}
      style={{ background: `linear-gradient(135deg, ${avatar.colors[0]}, ${avatar.colors[1]})` }}
    >
      <span className="avatar-mark">{avatar.mark}</span>
      <span className="avatar-ring" />
    </span>
  );
}
