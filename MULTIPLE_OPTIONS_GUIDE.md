# Multiple Options Market Form Integration Guide

## Overview

Your `create-market-form.tsx` has been updated to support **2-10 market options** instead of just binary (Yes/No) options. This aligns with your `FlowUpdate.cdc` contract which supports multi-option markets.

## What Changed

### 1. Form State Structure

**Before:**
```typescript
const [formData, setFormData] = useState({
  question: "",
  optionA: "",
  optionB: "",
  // ... rest
});
```

**After:**
```typescript
const [formData, setFormData] = useState({
  question: "",
  options: ["", ""],  // Dynamic array, starts with 2 options
  // ... rest
});
```

### 2. Step 1 Validation (validateStep1)

Enhanced validation for multiple options:

```typescript
// Validate options array
if (formData.options.length < 2)
  newErrors.options = "Must have at least 2 options";
if (formData.options.length > 10)
  newErrors.options = "Cannot have more than 10 options";

// Validate each option is not empty
formData.options.forEach((opt, idx) => {
  if (!opt.trim()) newErrors[`option_${idx}`] = "Option cannot be empty";
});

// Check for duplicate options
const uniqueOptions = new Set(
  formData.options.map((o) => o.toLowerCase().trim()),
);
if (uniqueOptions.size !== formData.options.length) {
  newErrors.options = "Options must be unique";
}
```

### 3. UI Changes (Step 1 Form)

The options section now includes:

- **Dynamic Option Fields**: Add/remove options on the fly
- **Add Option Button**: Creates new input fields (up to 10 max)
- **Remove Option Button**: Deletes option (only shown if more than 2 options)
- **Option Counter**: Shows current number of options vs maximum
- **Color Coding**: Different colors for each option badge in review

```typescript
{formData.options.map((option, index) => (
  <div key={index} className="flex gap-2 items-start">
    <div className="flex-1 space-y-1">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-[#9b87f5]/20">
          Option {index + 1}
        </Badge>
        {formData.options.length > 2 && (
          <button onClick={() => removeOption(index)}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Input
        placeholder={`Enter option ${index + 1}`}
        value={option}
        onChange={(e) => updateOption(index, e.target.value)}
      />
    </div>
  </div>
))}

{formData.options.length < 10 && (
  <button onClick={() => addOption()}>
    <Plus className="h-4 w-4" />
    Add Option
  </button>
)}
```

### 4. Transaction Arguments

**Before:**
```typescript
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
```

**After:**
```typescript
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
```

### 5. Market Data Preparation

**Before:**
```typescript
const marketCreationData = {
  question: formData.question.trim(),
  description: formData.rules.trim(),
  optionA: formData.optionA.trim(),
  optionB: formData.optionB.trim(),
  // ... rest
};
```

**After:**
```typescript
const marketCreationData = {
  question: formData.question.trim(),
  description: formData.rules.trim(),
  options: formData.options.map((o) => o.trim()),  // Array of trimmed options
  category: formData.category,
  endTime: endTimeUnix,
  minBet: parseFloat(formData.minBet),
  maxBet: parseFloat(formData.maxBet),
  imageURI: formData.imageURI.trim(),
};
```

### 6. Review Page (Step 4)

Options now display as multiple badges with alternating colors:

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

## User Flow

1. **Step 1 - Basic Information**
   - Enter market question
   - Start with 2 default options
   - Click "+ Add Option" to add up to 10 total options
   - Click "X" button to remove options (if more than 2)
   - Validation prevents duplicates and empty fields

2. **Step 2 - Timeline & Resolution**
   - Works as before (unchanged)

3. **Step 3 - Market Settings**
   - Works as before (unchanged)

4. **Step 4 - Review & Confirm**
   - Shows all options with color-coded badges
   - Displays option count in the header

## Validation Rules

| Rule | Requirement |
|------|-------------|
| Minimum Options | 2 |
| Maximum Options | 10 |
| Empty Check | Each option must have text |
| Uniqueness | All options must be different (case-insensitive) |
| Character Length | Question: 10-500 chars |

## Example Market

**Question:** "Which will be the highest-selling phone in 2025?"

**Options:**
1. iPhone 17
2. Samsung Galaxy S25
3. Google Pixel 10
4. OnePlus 13
5. Other

## Backend Transaction

The transaction file (`flowupdate_create_market.cdc`) expects:

```cadence
transaction(
    title: String,
    description: String,
    category: UInt8,
    options: [String],              // Now an array!
    endTime: UFix64,
    minBet: UFix64,
    maxBet: UFix64,
    imageUrl: String,
    creationFeeAmount: UFix64?
)
```

## Compatibility

- ✅ Works with `FlowUpdate` contract
- ✅ Supports multi-option market creation
- ✅ Maintains existing styling and UX patterns
- ✅ Fully validated on client-side
- ✅ TypeScript type-safe

## Future Enhancements

Possible future improvements:
- Drag-to-reorder options
- Copy option from template
- Set different odds for each option
- Option descriptions/explanations
- Visual option editor

## Troubleshooting

### Error: "Options must be unique"
- You have duplicate option text (case-insensitive)
- Solution: Change one of the duplicate options

### Error: "Must have at least 2 options"
- You deleted too many options
- Solution: Click "+ Add Option" to add more

### Error: "Cannot have more than 10 options"
- You've reached the maximum limit
- Solution: The "+ Add Option" button will be disabled

### Transaction fails with "Invalid options array"
- The backend didn't receive the options correctly
- Check that all options are non-empty strings
- Verify the transaction script matches the new signature

## Files Modified

- `src/components/admin/create/create-market-form.tsx` - Main form component

## Notes

- The form now uses `options: [String]` array instead of `optionA` and `optionB`
- All validation checks for array length, uniqueness, and emptiness
- The review page dynamically colors options based on their position
- User can add/remove options before submission
- Transaction passes the entire options array to FlowUpdate contract