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
        <svg
          viewBox="0 0 28 28"
          className="w-full h-full pointer-events-none select-none block"
        >
          <text
            x="14"
            y="14"
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontWeight="bold"
            fontSize={charCount >= 3 ? '8.5' : charCount === 2 ? '11.5' : '13'}
            letterSpacing={charCount >= 3 ? '-0.5' : '-0.2'}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            {...(charCount >= 3 ? { textLength: 21, lengthAdjust: 'spacingAndGlyphs' } : {})}
          >
            {displayName}
          </text>
        </svg>
      )}
    </div>
  );
};
