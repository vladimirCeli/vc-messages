interface FormInputProps {
  id: string
  type: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
}

export default function FormInput({ id, type, label, value, onChange, placeholder, required }: FormInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
        placeholder={placeholder}
      />
    </div>
  )
}
