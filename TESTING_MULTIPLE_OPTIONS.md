# Testing Guide: Multiple Options Market Form

## Overview
This document provides comprehensive testing procedures for the new multiple-options market creation form.

## Test Environment Setup

### Prerequisites
- Flow wallet connected (Testnet)
- Sufficient FLOW tokens for market creation fee (~10 FLOW recommended)
- Browser DevTools console open for debugging
- FlowUpdate contract deployed on testnet

### Environment Variables Check
Verify these are set in `.env.local`:
```
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOWUPDATE_ADDRESS=0x24225e374dfffb2b
NEXT_PUBLIC_FLOW_TESTNET_TOKEN=0x7e60df042a9c0868
NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN=0x9a0766d93b6608b7
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your_value>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your_value>
```

---

## Unit Tests: Form State & Validation

### Test 1.1: Initial Form State
**Steps:**
1. Navigate to market creation form
2. Open browser DevTools → Console
3. Check initial state

**Expected Result:**
- Form loads with `options: ["", ""]` (2 empty options)
- No validation errors initially
- "+ Add Option" button is visible and enabled
- "X" remove buttons are hidden (minimum 2 options)

**Pass/Fail:** ___

---

### Test 1.2: Add Option Button
**Steps:**
1. Click "+ Add Option" button
2. Observe the form
3. Repeat until reaching 10 options

**Expected Result:**
- New empty input field appears below existing options
- Counter updates: "3/10 options", "4/10 options", etc.
- At 10 options: "+ Add Option" button becomes disabled/hidden
- Remove "X" buttons appear on options 3-10 (not on first 2)

**Pass/Fail:** ___

---

### Test 1.3: Remove Option Button
**Steps:**
1. With 4+ options, click "X" button on option 3
2. Observe form update
3. Try removing option until only 2 remain

**Expected Result:**
- Option removed from list
- Counter decreases
- At 2 options: "X" buttons disappear
- "+ Add Option" button becomes visible/enabled again

**Pass/Fail:** ___

---

### Test 1.4: Validation - Empty Options
**Steps:**
1. Add 3 total options
2. Leave option 2 empty
3. Leave option 3 with text
4. Click "Next" to validate

**Expected Result:**
- Error message shows: "Option cannot be empty" under option 2
- Form does not proceed to next step
- Other validations still work (question, category)

**Pass/Fail:** ___

---

### Test 1.5: Validation - Duplicate Options
**Steps:**
1. Add 4 total options
2. Enter "Bitcoin" in option 1
3. Enter "bitcoin" (lowercase) in option 3
4. Fill other required fields
5. Click "Next"

**Expected Result:**
- Error message shows: "Options must be unique"
- Form does not proceed
- Case-insensitive matching is working

**Pass/Fail:** ___

---

### Test 1.6: Validation - Too Few Options
**Steps:**
1. Start with 2 options
2. Remove one option via UI manipulation (if possible)
3. Click "Next"

**Expected Result:**
- Error: "Must have at least 2 options"
- Form blocks progression

**Pass/Fail:** ___

---

### Test 1.7: Validation - Question Requirements
**Steps:**
1. Leave question empty
2. Try to proceed to Step 2

**Expected Result:**
- Error: "Question is required"
- Try question with 5 characters
- Error: "Question must be at least 10 characters"
- Try question with 600 characters
- Error: "Question must be less than 500 characters"

**Pass/Fail:** ___

---

### Test 1.8: Option Input Fields
**Steps:**
1. Add 5 options
2. Type unique text in each: "Option A", "Option B", "Option C", etc.
3. Clear one field and re-enter text

**Expected Result:**
- All text inputs work properly
- Text is preserved when navigating between steps
- No character limit on individual options (until validation)
- Focus behavior works correctly

**Pass/Fail:** ___

---

## Integration Tests: Form Flow

### Test 2.1: Complete Happy Path (2 Options)
**Steps:**
1. Fill question: "Will Bitcoin reach $100,000 by end of 2025?"
2. Keep default 2 options:
   - Option 1: "Yes"
   - Option 2: "No"
3. Select category: "Crypto"
4. Click "Next"
5. Fill end date: 30 days from now
6. Fill end time: 14:00
7. Fill resolution source: "CoinGecko"
8. Fill resolution rules: "Market resolves based on Bitcoin price on CoinGecko"
9. Click "Next"
10. Set min bet: 1
11. Set max bet: 1000
12. Click "Next"
13. Review all data
14. Click "Create Market"

**Expected Result:**
- All steps complete successfully
- No validation errors
- Transaction submitted to blockchain
- Wallet approves transaction
- Success toast appears
- Redirected to admin page

**Pass/Fail:** ___

---

### Test 2.2: Complete Happy Path (5 Options)
**Steps:**
1. Fill question: "Which company will lead AI in 2025?"
2. Add 5 options:
   - Option 1: "OpenAI"
   - Option 2: "Google"
   - Option 3: "Meta"
   - Option 4: "Microsoft"
   - Option 5: "Other"
3. Continue through steps 2, 3, 4 as in Test 2.1
4. On review (Step 4), verify all 5 options display

**Expected Result:**
- All 5 options visible in review page
- Options have alternating colors (green, red, blue, ...)
- Options counter shows "5/10"
- Transaction includes all 5 options in array
- Market created successfully

**Pass/Fail:** ___

---

### Test 2.3: Complete Happy Path (10 Options - Maximum)
**Steps:**
1. Fill question: "Which token will perform best in Q1 2025?"
2. Add all 10 options:
   - Bitcoin, Ethereum, Solana, Ripple, Cardano, Polkadot, Dogecoin, Litecoin, XRP, Other
3. Verify "+ Add Option" is disabled
4. Complete remaining steps
5. Submit form

**Expected Result:**
- All 10 options accepted
- "+ Add Option" button is disabled
- Remove buttons available on all options
- Review shows all 10 options
- Transaction successful

**Pass/Fail:** ___

---

## UI/UX Tests

### Test 3.1: Visual Layout - Options Section
**Steps:**
1. Add 6 options to form
2. Take screenshot
3. Verify visual hierarchy

**Expected Result:**
- Option counter visible at top right
- Each option has clear label: "Option 1", "Option 2", etc.
- Badge colors consistent
- Remove buttons (X) are visible and positioned correctly
- Add button is at bottom with clear styling
- No layout issues or overlapping elements
- Mobile responsive (check on mobile view)

**Pass/Fail:** ___

---

### Test 3.2: Error Message Display
**Steps:**
1. Add 3 options
2. Leave option 1 empty, option 2 with "Test", option 3 empty
3. Trigger validation

**Expected Result:**
- Error "Option cannot be empty" appears under option 1
- Error "Option cannot be empty" appears under option 3
- Errors are red-colored
- Form indicates validation failed (might show red borders)
- Text is readable and clear

**Pass/Fail:** ___

---

### Test 3.3: Badge Colors (Review Page)
**Steps:**
1. Create market with 6 options
2. Navigate to Step 4 (Review)
3. Observe option badges

**Expected Result:**
- Option 1: Green badge
- Option 2: Red badge
- Option 3: Blue badge
- Option 4: Blue badge
- Option 5: Blue badge
- Option 6: Blue badge
- Colors are distinct and readable
- All options visible in flex wrap layout

**Pass/Fail:** ___

---

### Test 3.4: Image Upload Integration
**Steps:**
1. Fill basic market info with 3 options
2. Upload image (PNG or JPEG)
3. Verify image appears in preview
4. Proceed through form
5. Check image displays in review

**Expected Result:**
- Image uploads successfully
- Preview displays correctly
- Form state retains image URL
- Image shows in Step 4 review
- Image is included in transaction

**Pass/Fail:** ___

---

## Transaction Tests

### Test 4.1: Transaction Arguments Structure
**Steps:**
1. Open browser DevTools → Network tab
2. Create market with 4 options
3. Filter for "mutate" or "transaction" requests
4. Inspect the transaction payload

**Expected Result:**
- Arguments array contains:
  - `arg(question, t.String)`
  - `arg(description, t.String)`
  - `arg(category, t.UInt8)`
  - `arg([opt1, opt2, opt3, opt4], t.Array(t.String))`
  - `arg(endTime, t.UFix64)`
  - `arg(minBet, t.UFix64)`
  - `arg(maxBet, t.UFix64)`
  - `arg(imageUrl, t.String)`
  - `arg(creationFee, t.Optional(t.UFix64))`

**Pass/Fail:** ___

---

### Test 4.2: Transaction Rejection Handling
**Steps:**
1. Fill form with valid data (3 options)
2. Click "Create Market"
3. Reject transaction in wallet when prompted

**Expected Result:**
- Error toast appears: "Transaction cancelled by user"
- Form remains populated (data not lost)
- Can retry submission
- No network errors in console

**Pass/Fail:** ___

---

### Test 4.3: Transaction Failure Handling
**Steps:**
1. Disconnect wallet
2. Fill form with valid data (3 options)
3. Click "Create Market"
4. Observe error handling

**Expected Result:**
- Error message displays appropriately
- Error toast shown to user
- Suggestion to connect wallet
- Console shows proper error message

**Pass/Fail:** ___

---

## Edge Cases & Security

### Test 5.1: Special Characters in Options
**Steps:**
1. Add 3 options
2. Option 1: "Bitcoin ($) 🚀"
3. Option 2: "Ethereum <ETH>"
4. Option 3: "Price > $5,000"
5. Submit form

**Expected Result:**
- Special characters handled properly
- No injection vulnerabilities
- Emojis display correctly
- Transaction successful

**Pass/Fail:** ___

---

### Test 5.2: Very Long Option Names
**Steps:**
1. Add 2 options
2. Option 1: Enter 200 character string
3. Option 2: Enter 300 character string
4. Submit form

**Expected Result:**
- Long options accepted
- No UI breaking (text wraps)
- Review page displays all text
- Transaction successful
- No database constraint violations

**Pass/Fail:** ___

---

### Test 5.3: Whitespace Handling
**Steps:**
1. Add 3 options
2. Option 1: "  Bitcoin  " (with leading/trailing spaces)
3. Option 2: "ethereum" (lowercase)
4. Option 3: "  ETHEREUM  " (uppercase with spaces)
5. Try to submit

**Expected Result:**
- Duplicate detection recognizes these as duplicates (whitespace trimmed)
- Error: "Options must be unique"
- Form blocks submission

**Pass/Fail:** ___

---

### Test 5.4: Form Data Persistence
**Steps:**
1. Fill Step 1 with 4 options and question
2. Click "Next" to Step 2
3. Click "Back" to Step 1
4. Verify data

**Expected Result:**
- All 4 options still present
- Question text unchanged
- No data loss on navigation
- Option order preserved

**Pass/Fail:** ___

---

## Browser Compatibility

### Test 6.1: Chrome/Edge (Chromium)
**Steps:**
1. Open form in Chrome/Edge
2. Complete full 4-step process with 5 options

**Expected Result:**
- Form renders correctly
- All interactions work
- No console errors
- Transaction successful

**Pass/Fail:** ___

---

### Test 6.2: Firefox
**Steps:**
1. Open form in Firefox
2. Complete full 4-step process with 5 options

**Expected Result:**
- Form renders correctly
- All interactions work
- No console errors
- Transaction successful

**Pass/Fail:** ___

---

### Test 6.3: Mobile Safari
**Steps:**
1. Open form on iPhone/iPad
2. Add options (mobile interaction)
3. Fill form
4. Complete submission

**Expected Result:**
- Responsive layout works
- Touch interactions responsive
- Options section not cramped
- Buttons easily tappable
- Form usable on mobile

**Pass/Fail:** ___

---

## Performance Tests

### Test 7.1: Form Load Time
**Steps:**
1. Clear browser cache
2. Load create market form
3. Time to interactive

**Expected Result:**
- Form loads in < 3 seconds
- No layout shift
- Images load smoothly
- Interactions responsive immediately

**Pass/Fail:** ___

---

### Test 7.2: Option Addition Performance
**Steps:**
1. Add options one by one until 10
2. Monitor responsiveness

**Expected Result:**
- Each addition is instant (< 100ms)
- No lag in input fields
- Form remains responsive
- No memory leaks (check DevTools memory)

**Pass/Fail:** ___

---

## Console & Debugging

### Test 8.1: Console Messages
**Steps:**
1. Open DevTools Console
2. Create market with 4 options
3. Check console output

**Expected Result:**
- "Creating market on blockchain with data:" logged
- Market data includes options array
- No console errors (only expected logs)
- Transaction ID logged on success
- Market created event logged

**Pass/Fail:** ___

---

### Test 8.2: Error Logging
**Steps:**
1. Trigger validation error (missing option text)
2. Check console
3. Trigger duplicate error
4. Check console

**Expected Result:**
- Validation errors logged with context
- Error messages helpful for debugging
- No stack traces for user-input validation errors
- Network errors logged when present

**Pass/Fail:** ___

---

## Regression Tests

### Test 9.1: Binary Markets Still Work
**Steps:**
1. Create market with exactly 2 options
2. Option 1: "Yes"
3. Option 2: "No"
4. Complete submission

**Expected Result:**
- Binary markets (2 options) work perfectly
- No special handling needed
- User can create traditional yes/no markets
- Backward compatible

**Pass/Fail:** ___

---

### Test 9.2: All Other Form Steps Unchanged
**Steps:**
1. Fill Steps 2, 3, 4 as normal
2. Verify Timeline & Resolution works
3. Verify Market Settings works
4. Verify Review & Confirm works

**Expected Result:**
- Steps 2-4 work identically to before
- No regressions in other functionality
- All data types work as expected

**Pass/Fail:** ___

---

## Sign-Off

### Test Execution Summary

| Test Category | Total Tests | Passed | Failed | Notes |
|---------------|-------------|--------|--------|-------|
| Unit Tests (Validation) | 8 | ___ | ___ | |
| Integration Tests (Flow) | 3 | ___ | ___ | |
| UI/UX Tests | 4 | ___ | ___ | |
| Transaction Tests | 3 | ___ | ___ | |
| Edge Cases & Security | 4 | ___ | ___ | |
| Browser Compatibility | 3 | ___ | ___ | |
| Performance Tests | 2 | ___ | ___ | |
| Console & Debugging | 2 | ___ | ___ | |
| Regression Tests | 2 | ___ | ___ | |
| **TOTAL** | **32** | **___** | **___** | |

### Tester Information
- **Name:** _________________
- **Date:** _________________
- **Browser/OS:** _________________
- **Notes:** _________________

### Sign-Off
- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Ready for production deployment

**Tested By:** _________________ **Date:** _________
**Approved By:** _________________ **Date:** _________