# Multiple Options Form - Before & After Comparison

## 1. Form State Initialization

### BEFORE
```typescript
const [formData, setFormData] = useState({
  question: "",
  optionA: "",
  optionB: "",
  category: -1,
  endDate: "",
  endTime: "",
  resolutionSource: "",
  rules: "",
  imageURI: "",
  initialLiquidity: "1000",
  minBet: "1",
  maxBet: "1000",
  isBreakingNews: false,
  isPublic: true,
  creatorFee: "2.5",
});
```

### AFTER
```typescript
const [formData, setFormData] = useState({
  question: "",
  options: ["", ""],  // Dynamic array starting with 2 empty options
  category: -1,
  endDate: "",
  endTime: "",
  resolutionSource: "",
  rules: "",
  imageURI: "",
  initialLiquidity: "1000",
  minBet: "1",
  maxBet: "1000",
  isBreakingNews: false,
  isPublic: true,
  creatorFee: "2.5",
});
```

---

## 2. Step 1 Validation

### BEFORE
```typescript
const validateStep1 = () => {
  const newErrors: Record<string, string> = {};
  if (!formData.question.trim()) newErrors.question = "Question is required";
  if (formData.question.length < 10)
    newErrors.question = "Question must be at least 10 characters";
  if (formData.question.length > 500)
    newErrors.question = "Question must be less than 500 characters";
  if (!formData.optionA.trim()) newErrors.optionA = "Option A is required";
  if (!formData.optionB.trim()) newErrors.optionB = "Option B is required";
  if (formData.optionA === formData.optionB)
    newErrors.optionB = "Options must be different";
  if (formData.category === -1) newErrors.category = "Category is required";
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### AFTER
```typescript
const validateStep1 = () => {
  const newErrors: Record<string, string> = {};
  if (!formData.question.trim()) newErrors.question = "Question is required";
  if (formData.question.length < 10)
    newErrors.question = "Question must be at least 10 characters";
  if (formData.question.length > 500)
    newErrors.question = "Question must be less than 500 characters";

  // Validate options
  if (formData.options.length < 2)
    newErrors.options = "Must have at least 2 options";
  if (formData.options.length > 10)
    newErrors.options = "Cannot have more than 10 options";

  formData.options.forEach((opt, idx) => {
    if (!opt.trim()) newErrors[`option_${idx}`] = "Option cannot be empty";
  });

  // Check for duplicates
  const uniqueOptions = new Set(
    formData.options.map((o) => o.toLowerCase().trim()),
  );
  if (uniqueOptions.size !== formData.options.length) {
    newErrors.options = "Options must be unique";
  }

  if (formData.category === -1) newErrors.category = "Category is required";
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## 3. Options Input UI (Step 1)

### BEFORE
```typescript
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="optionA" className="text-gray-300">
      Option A *
    </Label>
    <Input
      id="optionA"
      placeholder="Yes"
      value={formData.optionA}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          optionA: e.target.value,
        }))
      }
      className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
        errors.optionA ? "border-red-500" : ""
      }`}
    />
    {errors.optionA && (
      <p className="text-sm text-red-400">{errors.optionA}</p>
    )}
  </div>
  <div className="space-y-2">
    <Label htmlFor="optionB" className="text-gray-300">
      Option B *
    </Label>
    <Input
      id="optionB"
      placeholder="No"
      value={formData.optionB}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          optionB: e.target.value,
        }))
      }
      className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
        errors.optionB ? "border-red-500" : ""
      }`}
    />
    {errors.optionB && (
      <p className="text-sm text-red-400">{errors.optionB}</p>
    )}
  </div>
</div>
```

### AFTER
```typescript
<div className="space-y-3">
  <div className="flex justify-between items-center">
    <Label className="text-gray-300">Options *</Label>
    <div className="text-xs text-gray-500">
      {formData.options.length}/10 options
    </div>
  </div>

  {formData.options.map((option, index) => (
    <div key={index} className="flex gap-2 items-start">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30"
          >
            Option {index + 1}
          </Badge>
          {formData.options.length > 2 && (
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  options: prev.options.filter((_, i) => i !== index),
                }));
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0 flex items-center justify-center rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Input
          placeholder={`Enter option ${index + 1}`}
          value={option}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              options: prev.options.map((opt, i) =>
                i === index ? e.target.value : opt,
              ),
            }));
          }}
          className={`bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#9b87f5] ${
            errors[`option_${index}`] ? "border-red-500" : ""
          }`}
        />
        {errors[`option_${index}`] && (
          <p className="text-sm text-red-400">
            {errors[`option_${index}`]}
          </p>
        )}
      </div>
    </div>
  ))}

  {errors.options && (
    <p className="text-sm text-red-400">{errors.options}</p>
  )}

  {formData.options.length < 10 && (
    <button
      type="button"
      onClick={() => {
        setFormData((prev) => ({
          ...prev,
          options: [...prev.options, ""],
        }));
      }}
      className="w-full border border-dashed border-gray-700 text-gray-300 hover:bg-[#1A1F2C] rounded py-2 px-3 text-sm flex items-center justify-center gap-2"
    >
      <Plus className="h-4 w-4" />
      Add Option
    </button>
  )}
</div>
```

---

## 4. Transaction Arguments

### BEFORE
```typescript
const transactionId = await fcl.mutate({
  cadence: transactionScript,
  args: (arg, t) => [
    arg(marketData.question, t.String),
    arg(marketData.description, t.String),
    arg(marketData.category.toString(), t.UInt8),
    arg(marketData.optionA, t.String),
    arg(marketData.optionB, t.String),
    arg(marketData.endTime.toFixed(1), t.UFix64),
    arg(marketData.minBet.toFixed(8), t.UFix64),
    arg(marketData.maxBet.toFixed(8), t.UFix64),
    arg(marketData.imageURI || "", t.String),
  ],
  proposer: authorization,
  payer: authorization,
  authorizations: [authorization],
  limit: 1000,
});
```

### AFTER
```typescript
const transactionId = await fcl.mutate({
  cadence: transactionScript,
  args: (arg, t) => [
    arg(marketData.question, t.String),
    arg(marketData.description, t.String),
    arg(marketData.category.toString(), t.UInt8),
    arg(marketData.options, t.Array(t.String)),  // Array of all options
    arg(marketData.endTime.toFixed(1), t.UFix64),
    arg(marketData.minBet.toFixed(8), t.UFix64),
    arg(marketData.maxBet.toFixed(8), t.UFix64),
    arg(marketData.imageURI || "", t.String),
    arg(null, t.Optional(t.UFix64)),  // Optional creation fee
  ],
  proposer: authorization,
  payer: authorization,
  authorizations: [authorization],
  limit: 1000,
});
```

---

## 5. Market Data Preparation

### BEFORE
```typescript
const marketCreationData = {
  question: formData.question.trim(),
  description: formData.rules.trim(),
  optionA: formData.optionA.trim(),
  optionB: formData.optionB.trim(),
  category: formData.category,
  endTime: endTimeUnix,
  minBet: parseFloat(formData.minBet),
  maxBet: parseFloat(formData.maxBet),
  imageURI: formData.imageURI.trim(),
};
```

### AFTER
```typescript
const marketCreationData = {
  question: formData.question.trim(),
  description: formData.rules.trim(),
  options: formData.options.map((o) => o.trim()),
  category: formData.category,
  endTime: endTimeUnix,
  minBet: parseFloat(formData.minBet),
  maxBet: parseFloat(formData.maxBet),
  imageURI: formData.imageURI.trim(),
};
```

---

## 6. Review Page - Options Display (Step 4)

### BEFORE
```typescript
<div>
  <h4 className="font-semibold text-white">Options</h4>
  <div className="flex space-x-2">
    <Badge
      variant="outline"
      className="bg-green-500/20 text-green-400 border-green-500/30"
    >
      {formData.optionA}
    </Badge>
    <Badge
      variant="outline"
      className="bg-red-500/20 text-red-400 border-red-500/30"
    >
      {formData.optionB}
    </Badge>
  </div>
</div>
```

### AFTER
```typescript
<div>
  <h4 className="font-semibold text-white">Options</h4>
  <div className="flex flex-wrap gap-2">
    {formData.options.map((option, idx) => (
      <Badge
        key={idx}
        variant="outline"
        className={`${
          idx === 0
            ? "bg-green-500/20 text-green-400 border-green-500/30"
            : idx === 1
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
        }`}
      >
        {option}
      </Badge>
    ))}
  </div>
</div>
```

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Options Structure** | `optionA`, `optionB` (2 separate fields) | `options` array (dynamic, 2-10 items) |
| **Min/Max Options** | Fixed 2 options | Min 2, Max 10 options |
| **UI Flexibility** | Static 2-option grid | Dynamic with add/remove buttons |
| **Validation** | 2 field validations | Array length + uniqueness + empty checks |
| **Transaction Args** | 2 string arguments | 1 array argument |
| **Review Display** | 2 static badges | Dynamic badges with color rotation |
| **User Control** | None - fixed binary | Full control - add/remove options |

---

## Key Features Added

✅ **Add Options** - Users can add up to 10 options with "+ Add Option" button
✅ **Remove Options** - Users can remove options (minimum 2 enforced)
✅ **Option Counter** - Shows current count vs maximum (e.g., "3/10 options")
✅ **Duplicate Prevention** - Validates that all options are unique
✅ **Empty Check** - Ensures no empty option fields
✅ **Dynamic Colors** - Review page shows alternating badge colors
✅ **Real-time Errors** - Individual error messages per option
✅ **Array Handling** - Proper array type in transaction args

---

## Testing Checklist

- [ ] Add option until reaching 10 (button should disable)
- [ ] Try removing options until 2 remain (button should disappear)
- [ ] Enter duplicate options (should show error)
- [ ] Leave an option empty (should show error)
- [ ] Submit form with 5 options
- [ ] Verify transaction receives options array correctly
- [ ] Check review page displays all options with correct colors
- [ ] Test form reset after successful submission