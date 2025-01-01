import { cn } from '@/lib/utils';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { ComponentPropsWithoutRef, ReactNode } from 'react';
import { TruncatedText } from './truncated-text';

type SingularBaseValues = string | number | boolean;
type MultipleBaseValues = string[] | number[] | boolean[];

type BaseValue = SingularBaseValues | MultipleBaseValues;

export interface SelectOption<Value extends BaseValue> {
  label: ReactNode;
  value: Value extends MultipleBaseValues ? Value[number] : Value;
}

export interface SelectProps<
  Value extends Multiple extends true ? MultipleBaseValues : SingularBaseValues,
  Multiple extends boolean = false,
> {
  multiple?: Multiple;
  options: SelectOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  anchor?: ComponentPropsWithoutRef<typeof ListboxOptions>['anchor'];
  onBlur?: () => void;
}

export const Select = <
  Value extends Multiple extends true ? MultipleBaseValues : SingularBaseValues,
  Multiple extends boolean = false,
>({
  value,
  options,
  onChange,
  onBlur,
  multiple,
  anchor,
}: SelectProps<Value, Multiple>) => {
  return (
    <Listbox value={value} onChange={onChange} multiple={multiple}>
      <ListboxButton
        className={cn(
          'flex h-10 w-full rounded-md border border-slate-200 bg-white relative px-3 pr-8 py-2 text-sm ring-offset-white placeholder:text-slate-500 data-[focus]:outline-none data-[focus]:ring-2 data-[focus]:ring-slate-950 data-[focus]:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:data-[focus]:ring-slate-300',
        )}
      >
        <TruncatedText>
          {(multiple ? (value as MultipleBaseValues) : [value])
            .map((val) => {
              const option = options.find((option) => option.value === val);
              return option?.label ?? val.toString();
            })
            .join(', ')}
        </TruncatedText>
        <ChevronDownIcon className="absolute top-2.5 right-3 size-5" />
      </ListboxButton>

      <ListboxOptions
        className={cn(
          'absolute shadow-xl w-[var(--button-width)] rounded-md border border-slate-200 bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 [--anchor-gap:var(--spacing-1)] p-1',
          'origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0',
        )}
        transition
        anchor={anchor}
        onBlur={onBlur}
      >
        {options.map((option) => {
          return (
            <ListboxOption
              key={option.value.toString()}
              value={option.value}
              className={cn(
                'group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none text-sm data-[focus]:bg-slate-50',
              )}
            >
              <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
              <span>{option.label}</span>
            </ListboxOption>
          );
        })}
      </ListboxOptions>
    </Listbox>
  );
};
