
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

export interface ComboboxOption {
  value: string
  label: string
}

interface CreatableComboboxProps {
  options: ComboboxOption[]
  defaultValue?: string
  name?: string
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyPlaceholder?: string
  createPlaceholder?: (value: string) => string
}

export function CreatableCombobox({
  options,
  defaultValue = "",
  name,
  value: controlledValue,
  onValueChange,
  placeholder = "Select or create...",
  searchPlaceholder = "Search or create...",
  emptyPlaceholder = "No results found.",
  createPlaceholder = (val) => `Create "${val}"`,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  
  // Use controlled state if value prop is provided, otherwise use internal state
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  const setValue = onValueChange || setInternalValue

  const [inputValue, setInputValue] = React.useState(
    options.find(option => option.value === value)?.label || value
  );

  React.useEffect(() => {
    // Sync inputValue when the value changes externally or internally
    const selectedOption = options.find(option => option.value === value);
    setInputValue(selectedOption ? selectedOption.label : value);
  }, [value, options]);

  const handleSelect = (selectedValue: string) => {
    const selectedOption = options.find(option => option.value === selectedValue);
    if (selectedOption) {
      setValue(selectedOption.value);
      setInputValue(selectedOption.label);
    } else {
      // This case is for creating new items
      setValue(selectedValue);
      setInputValue(selectedValue);
    }
    setOpen(false);
  }

  const handleCreate = () => {
    setValue(inputValue);
    setOpen(false);
  };
  
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  const showCreateOption = inputValue && !options.some(option => option.label.toLowerCase() === inputValue.toLowerCase());
  const displayValue = options.find(option => option.value === value)?.label || value;

  return (
    <>
      {/* Hidden input to hold the actual value for the form */}
      {name && <input type="hidden" name={name} value={value} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {displayValue || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {filteredOptions.length === 0 && !showCreateOption && <CommandEmpty>{emptyPlaceholder}</CommandEmpty>}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {showCreateOption && (
                  <CommandItem
                    value={inputValue}
                    onSelect={handleCreate}
                    className="text-muted-foreground"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {createPlaceholder(inputValue)}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
