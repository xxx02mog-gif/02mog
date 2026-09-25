import React from 'react';
import { Character } from '../types';
import { getContrastTextColor, getCharacterShortName } from '../utils/calc';

interface CharacterAvatarProps {
  character: Character;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  character,
  size = 'md',
  showBorder = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs font-semibold',
    lg: 'w-12 h-12 text-sm font-bold',
    xl: 'w-16 h-16 text-base font-bold',
  };

  const textColor = getContrastTextColor(character.color);
  const displayName = getCharacterShortName(character);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${
        sizeClasses[size]
      } ${showBorder ? 'ring-2 ring-white/80 shadow-xs' : ''} ${className}`}
      style={{
        backgroundColor: character.color || '#475569',
      }}
      title={character.name}
    >
      {character.avatarUrl && character.avatarUrl.trim() ? (
        <img
          src={character.avatarUrl}
          alt={character.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image load fails
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span style={{ color: textColor }} className="font-bold tracking-tighter">
          {displayName}
        </span>
      )}
    </div>
  );
};
