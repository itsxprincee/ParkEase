import React from "react";

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  className = "",
  disabled = false,
  required = false,
  ...props
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`pe-input ${className}`}
      {...props}
    />
  );
}

export default Input;