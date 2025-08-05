'use client';
import { ChevronsUpDown } from 'lucide-react';
import React, { type JSX, useMemo } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Superteams, unofficialSuperteams } from '@/constants/Superteam';
import { cn } from '@/utils/cn';

interface SuperteamOption {
  value: string;
  label: string;
  code: string;
  icon: string;
}

/**
 * Props for the SuperteamComboboxAttachment component.
 */
interface SuperteamComboboxProps {
  /**
   * The currently selected value. Can be `null` for no selection.
   */
  value?: string | null;

  /**
   * Callback function triggered when the selection changes.
   */
  onChange?: (value: string | null) => void;

  /**
   * Placeholder text displayed in the combobox.
   * @default 'Select superteam...'
   */
  placeholder?: string;

  /**
   * Additional CSS class names to apply to the root element.
   */
  className?: string;

  /**
   * Whether to show an "unset" option that allows clearing the selection.
   */
  unset?: boolean;

  /**
   * Object containing class names for specific subcomponents.
   */
  classNames?: {
    /**
     * Additional CSS class names for the popover content.
     */
    popoverContent?: string;
  };
}

/**
 * A combobox component for selecting superteams.
 *
 * @param {SuperteamComboboxProps} props - The props for the component.
 * @returns {JSX.Element} The rendered combobox component.
 */
export function SuperteamCombobox({
  value,
  onChange,
  placeholder = 'Select Superteam',
  unset,
  className,
  classNames,
}: SuperteamComboboxProps): JSX.Element {
  const options: SuperteamOption[] = useMemo(() => {
    return [...Superteams, ...unofficialSuperteams].map((superteam) => ({
      value: superteam.name ?? '-',
      label: superteam.name,
      code: superteam.code,
      icon: superteam.icons,
    }));
  }, []);

  const [open, setOpen] = React.useState(false);

  const findOptionByValue = (value: string): SuperteamOption | undefined => {
    return options.find((option) => option.value === value);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-32 justify-start px-3 text-xs text-slate-600',
            className,
            !value && 'text-slate-400',
          )}
        >
          {!!value && (
            <span className="mr-2 min-h-4 min-w-4">
              {findOptionByValue(value) &&
                (findOptionByValue(value)?.icon ? (
                  <img
                    src={findOptionByValue(value)?.icon}
                    alt={findOptionByValue(value)?.label}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <UserFlag
                    location={findOptionByValue(value)?.code || ''}
                    isCode
                    size="16px"
                  />
                ))}
            </span>
          )}
          <p className="truncate">
            {value
              ? findOptionByValue(value)?.label || placeholder
              : placeholder}
          </p>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[200px] p-0', classNames?.popoverContent)}
      >
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList className="scrollbar-visible max-h-[200px] overflow-auto md:max-h-[300px]">
            <CommandEmpty>No superteam found.</CommandEmpty>
            {!!value && unset && (
              <CommandGroup>
                <CommandItem
                  value={undefined}
                  onSelect={() => {
                    onChange?.(null);
                    setOpen(false);
                  }}
                >
                  <p className="text-slate-400">Select Superteam</p>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Superteams">
              {options.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue);
                    setOpen(false);
                  }}
                  className={cn(
                    'cursor-pointer',
                    value === item.value && 'bg-gray-200',
                  )}
                >
                  <span className="mx-2 min-h-4 min-w-4">
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <UserFlag location={item.code} isCode size="16px" />
                    )}
                  </span>
                  <p>{item.label}</p>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
