"use client";

import { useState, useEffect } from "react";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

const UNITS = [
  { label: "K", value: "k", multiplier: 1000 },
  { label: "Lakh", value: "lakh", multiplier: 100000 },
  { label: "Cr", value: "cr", multiplier: 10000000 },
];

export function AmountInput({
  value = 0,
  onChange,
  placeholder = "Enter amount",
  className,
  disabled = false,
  error = false,
}: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("base");

  // Convert numerical value to display value and unit
  useEffect(() => {
    if (value === 0) {
      setDisplayValue("");
      setSelectedUnit("base");
      return;
    }

    const absValue = Math.abs(value);
    let unit = "base";
    let displayVal = value.toString();

    if (absValue >= 10000000) {
      unit = "cr";
      displayVal = (value / 10000000).toString();
    } else if (absValue >= 100000) {
      unit = "lakh";
      displayVal = (value / 100000).toString();
    } else if (absValue >= 1000) {
      unit = "k";
      displayVal = (value / 1000).toString();
    }

    // Remove trailing zeros after decimal
    if (displayVal.includes(".")) {
      displayVal = displayVal.replace(/\.?0+$/, "");
    }

    setDisplayValue(displayVal);
    setSelectedUnit(unit);
  }, [value]);

  const handleInputChange = (inputValue: string) => {
    setDisplayValue(inputValue);

    if (!inputValue || inputValue === "") {
      onChange?.(0);
      return;
    }

    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      return;
    }

    const unit = UNITS.find((u) => u.value === selectedUnit);
    if (unit) {
      const actualValue = numValue * unit.multiplier;
      onChange?.(actualValue);
    }
  };

  const handleUnitChange = (unitValue: string) => {
    setSelectedUnit(unitValue);

    if (!displayValue || displayValue === "") {
      return;
    }

    const numValue = parseFloat(displayValue);
    if (isNaN(numValue)) {
      return;
    }

    const unit = UNITS.find((u) => u.value === unitValue);
    if (unit) {
      const actualValue = numValue * unit.multiplier;
      onChange?.(actualValue);
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      {/* Rupee Symbol */}
      <div className="flex w-8 items-center justify-center text-lg font-medium text-gray-600">
        ₹
      </div>

      {/* Amount Input */}
      <Input
        type="number"
        value={displayValue}
        step={0.1}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex-1 bg-background text-right",
          error && "border-red-500 focus:border-red-500",
        )}
      />

      {/* Unit Dropdown */}
      <Select
        value={selectedUnit}
        onValueChange={handleUnitChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UNITS.map((unit) => (
            <SelectItem key={unit.value} value={unit.value}>
              {unit.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
