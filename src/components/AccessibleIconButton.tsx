import React from 'react';

interface AccessibleIconButtonProps {
  icon: React.ReactNode;
  label: string; // Aria-label for screen readers
  tooltip: string; // Title attribute for visual tooltip
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string; // For additional custom styling
  disabled?: boolean;
}

const AccessibleIconButton: React.FC<AccessibleIconButtonProps> = ({
  icon,
  label,
  tooltip,
  onClick,
  className = '',
  disabled = false,
}) => {
  // Clone the icon to add aria-hidden="true"
  const accessibleIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, { 'aria-hidden': true })
    : icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={tooltip}
      disabled={disabled}
      className={`
        p-2 rounded-lg border
        bg-white dark:bg-neutral-800
        border-neutral-300 dark:border-neutral-600
        text-neutral-700 dark:text-neutral-300
        hover:bg-neutral-100 dark:hover:bg-neutral-700
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-neutral-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150 ease-in-out
        ${className}
      `}
    >
      {accessibleIcon}
      <span className="sr-only">{label}</span>
    </button>
  );
};

export default AccessibleIconButton; 