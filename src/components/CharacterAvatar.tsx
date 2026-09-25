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
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textColor = getContrastTextColor(character.color);
  const displayName = getCharacterShortName(character);
  const charCount = [...displayName].length;

  const fontClasses = {
    sm: charCount >= 3 ? 'text-[7.5px] tracking-[-0.06em]' : charCount === 2 ? 'text-[10px] tracking-tighter' : 'text-xs',
    md: charCount >= 3 ? 'text-[9.5px] tracking-tight' : 'text-xs font-semibold',
    lg: charCount >= 3 ? 'text-[11.5px] tracking-tight' : 'text-sm font-bold',
    xl: charCount >= 3 ? 'text-[13.5px] tracking-tight' : 'text-base font-bold',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none box-border ${
        sizeClasses[size]
      } ${showBorder ? 'border-2 border-white/95' : ''} ${className}`}
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
        <span
          style={{ color: textColor }}
          className={`font-bold leading-none whitespace-nowrap text-center flex items-center justify-center max-w-full px-0.5 ${fontClasses[size]}`}
        >
          {displayName}
        </span>
      )}
    </div>
  );
};
