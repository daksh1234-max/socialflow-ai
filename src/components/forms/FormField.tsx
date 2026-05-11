import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Input, InputProps } from '../ui/Input';

interface FormFieldProps extends InputProps {
  control: Control<any>;
  name: string;
}

export function FormField({ control, name, label, ...props }: FormFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          label={label}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...props}
        />
      )}
    />
  );
}
