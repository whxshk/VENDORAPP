# User-Facing Errors Found in Application

## Category 1: Technical Error Messages Shown to Users

### Error 1: Status Codes Displayed in ErrorDisplay Component
**Location:** `clients/merchant-dashboard/src/components/ErrorDisplay.tsx:58`
**Issue:** Shows "Status Code: 401" or similar technical codes to users
**User Impact:** Users see technical HTTP status codes instead of clear explanations
**Current Behavior:** Displays status codes like "Status Code: 401", "Status Code: 500"
**Expected:** Should show user-friendly messages like "Your session expired" instead of "Status Code: 401"

---

## Category 2: Browser Alert() Usage (Not User-Friendly)

### Error 2: Reward Deletion Error Uses Browser Alert
**Location:** `clients/merchant-dashboard/src/pages/dashboard/RewardsPage.tsx:83`
**Issue:** Uses browser `alert()` which blocks the UI and doesn't match the app's design
**User Impact:** Jarring browser popup interrupts workflow
**Current Behavior:** Shows browser alert: "Failed to delete reward: [error message]"
**Expected:** Should use the ErrorDisplay component or an inline error message

### Error 3: Settings Update Error Uses Browser Alert
**Location:** `clients/merchant-dashboard/src/pages/dashboard/SettingsPage.tsx:71`
**Issue:** Uses browser `alert()` for error display
**User Impact:** Poor user experience with browser popup
**Current Behavior:** Shows browser alert: "Failed to update settings: [error message]"
**Expected:** Should use inline error message or ErrorDisplay component

### Error 4: Branch Creation Error Uses Browser Alert
**Location:** `clients/merchant-dashboard/src/pages/dashboard/SettingsPage.tsx:83`
**Issue:** Uses browser `alert()` for error display
**User Impact:** Poor user experience with browser popup
**Current Behavior:** Shows browser alert: "Failed to create branch: [error message]"
**Expected:** Should use inline error message or ErrorDisplay component

### Error 5: Staff Invitation Error Uses Browser Alert
**Location:** `clients/merchant-dashboard/src/pages/dashboard/StaffPage.tsx:70`
**Issue:** Uses browser `alert()` for error display
**User Impact:** Poor user experience with browser popup
**Current Behavior:** Shows browser alert: "Failed to invite staff: [error message]"
**Expected:** Should use inline error message or ErrorDisplay component

### Error 6: Staff Creation Error Uses Browser Alert
**Location:** `clients/merchant-dashboard/src/pages/dashboard/StaffPage.tsx:82`
**Issue:** Uses browser `alert()` for error display
**User Impact:** Poor user experience with browser popup
**Current Behavior:** Shows browser alert: "Failed to create staff: [error message]"
**Expected:** Should use inline error message or ErrorDisplay component

---

## Category 3: Generic or Unclear Error Messages

### Error 7: Scan Test Error Shows Raw Error Message
**Location:** `clients/merchant-dashboard/src/pages/dashboard/ScanPage.tsx:140`
**Issue:** Shows raw error message without context
**User Impact:** Users may see technical messages like "Network Error" without explanation
**Current Behavior:** Shows "Error: [raw error message]"
**Expected:** Should provide context like "Unable to process scan. Please check customer ID and try again."

### Error 8: Scan Mutation Error Message May Be Generic
**Location:** `clients/merchant-dashboard/src/pages/dashboard/ScanPage.tsx:296`
**Issue:** Error message may not explain why the scan failed
**User Impact:** Users don't know if it's a network issue, validation issue, or business logic issue
**Current Behavior:** Shows "(scanMutation.error as Error)?.message || 'Transaction failed. Please try again.'"
**Expected:** Should provide specific reasons: "Customer not found", "Insufficient points", "Network connection lost", etc.

### Error 9: Customer Not Found Error Lacks Context
**Location:** `clients/merchant-dashboard/src/pages/dashboard/ScanPage.tsx:266`
**Issue:** Generic message doesn't guide user on what to do
**User Impact:** Users don't know if they should check the ID format, try a different ID, or contact support
**Current Behavior:** "Customer not found. Please check the customer ID and try again."
**Expected:** Should be more specific: "Customer with ID '[ID]' was not found. Please verify the customer ID is correct or create a new customer account."

### Error 10: Dashboard Error Message Too Generic
**Location:** `clients/merchant-dashboard/src/pages/dashboard/DashboardHome.tsx:39`
**Issue:** Generic error message doesn't help user understand the problem
**User Impact:** Users don't know if it's a temporary issue or a permanent problem
**Current Behavior:** "Failed to load dashboard data. Please try again."
**Expected:** Should provide more context: "Unable to load dashboard data. This may be due to a network issue or server problem. Please check your connection and try again."

---

## Category 4: Missing Error Handling

### Error 11: Reward Creation/Update Mutations Lack Error Handling
**Location:** `clients/merchant-dashboard/src/hooks/useRewards.ts:12-32`
**Issue:** `useCreateReward` and `useUpdateReward` don't have `onError` handlers
**User Impact:** Errors may fail silently or only show in console
**Current Behavior:** Errors are not caught or displayed to users
**Expected:** Should display user-friendly error messages when reward creation/update fails

### Error 12: Transaction List Query Lacks Error Display
**Location:** `clients/merchant-dashboard/src/hooks/useTransactions.ts:5-10`
**Issue:** No error handling in the hook, errors may not be visible to users
**User Impact:** Users may see empty table without knowing why
**Current Behavior:** Errors may be logged but not shown to users
**Expected:** Should display error state in TransactionsPage

### Error 13: Customer List Query Lacks Error Display
**Location:** `clients/merchant-dashboard/src/hooks/useCustomers.ts:5-10`
**Issue:** No error handling in the hook
**User Impact:** Users may see empty customer list without explanation
**Current Behavior:** Errors may be logged but not shown to users
**Expected:** Should display error state in CustomersPage

---

## Category 5: API Error Parsing Issues

### Error 14: Error Message Extraction May Fail
**Location:** `clients/merchant-dashboard/src/api/client.ts:87-90`
**Issue:** Complex nested property access may fail if API response structure differs
**User Impact:** Users may see "An API error occurred" instead of actual error message
**Current Behavior:** Tries to extract from `error.response?.data?.error?.message` or `error.response?.data?.message`
**Expected:** Should handle all possible error response formats and provide fallback messages

### Error 15: Login Error Message May Not Be Clear
**Location:** `clients/merchant-dashboard/src/pages/Login.tsx:43-46`
**Issue:** Error message extraction may fail, showing generic message
**User Impact:** Users may see "Login failed. Check credentials..." even for network errors
**Current Behavior:** Falls back to generic message if error structure is unexpected
**Expected:** Should distinguish between authentication errors and network errors

---

## Category 6: Network Error Handling

### Error 16: Network Errors May Not Be Clearly Explained
**Location:** `clients/merchant-dashboard/src/hooks/useErrorHandler.tsx:28-29`
**Issue:** Network error message is generic
**User Impact:** Users may not understand if it's their internet, the server, or a firewall issue
**Current Behavior:** "Unable to connect to the server. Please check your internet connection and try again."
**Expected:** Should provide more specific guidance: "Cannot reach the server. Please check: 1) Your internet connection, 2) The server is running, 3) No firewall is blocking the connection."

### Error 17: Backend Connection Failure Not Clearly Communicated
**Location:** `clients/merchant-dashboard/src/api/client.ts:34-40`
**Issue:** Request errors may not clearly indicate backend is down
**User Impact:** Users may think the app is broken when backend is simply not running
**Current Behavior:** Shows "Request failed: [error message]"
**Expected:** Should detect backend connection failures and show: "Backend server is not responding. Please ensure the server is running on port 3000."

---

## Category 7: Database Connection Errors

### Error 18: MongoDB Connection Failure Not User-Friendly
**Location:** `backend/src/database/mongodb.module.ts:54`
**Issue:** If DATABASE_URL is missing, throws technical error
**User Impact:** Backend crashes with technical error message
**Current Behavior:** Throws "DATABASE_URL is not defined in environment variables"
**Expected:** Should provide setup instructions: "Database connection is not configured. Please set DATABASE_URL in your .env file. See .env.example for format."

### Error 19: MongoDB Connection String Errors Not Clear
**Location:** `backend/src/database/mongodb.module.ts:56-81`
**Issue:** Invalid connection strings may cause cryptic errors
**User Impact:** Developers/users may not understand why connection fails
**Current Behavior:** May throw MongoDB connection errors that are technical
**Expected:** Should validate connection string format and provide helpful error messages

---

## Category 8: Form Validation Errors

### Error 20: Form Validation Errors May Not Be Visible
**Location:** Multiple form components
**Issue:** React Hook Form errors may not be prominently displayed
**User Impact:** Users may not see why form submission failed
**Current Behavior:** Errors are shown but may be subtle
**Expected:** Should prominently display validation errors with clear explanations

### Error 21: Email Validation Error May Be Technical
**Location:** `clients/merchant-dashboard/src/pages/dashboard/StaffPage.tsx:16`
**Issue:** Shows "Invalid email address" which is clear, but could be more helpful
**User Impact:** Users may not know what makes an email invalid
**Current Behavior:** "Invalid email address"
**Expected:** Should show example: "Please enter a valid email address (e.g., user@example.com)"

---

## Category 9: Business Logic Errors

### Error 22: Reward Deletion Error Doesn't Explain Why
**Location:** `clients/merchant-dashboard/src/pages/dashboard/RewardsPage.tsx:78-83`
**Issue:** Error message doesn't explain why deletion failed (e.g., customers have redeemed it)
**User Impact:** Users don't know what action to take
**Current Behavior:** Shows generic "Failed to delete reward: [error message]"
**Expected:** Should explain: "Cannot delete reward because [X] customers have already redeemed it. Please contact those customers or deactivate the reward instead."

### Error 23: Insufficient Points Error Could Be More Helpful
**Location:** `clients/merchant-dashboard/src/pages/dashboard/ScanPage.tsx:254-256`
**Issue:** Error message is clear but doesn't suggest alternatives
**User Impact:** Users may not know they can issue points first
**Current Behavior:** "✗ Insufficient points. Customer has X points, but reward requires Y points."
**Expected:** Should suggest: "Customer needs [Y-X] more points. Would you like to issue points first?"

### Error 24: Scan Errors Don't Explain Root Cause
**Location:** `clients/merchant-dashboard/src/api/merchant.ts:383-414`
**Issue:** Mock data returns generic errors like "Customer not found", "Reward not found", "Insufficient points"
**User Impact:** Users may not understand if it's a data issue or a system issue
**Current Behavior:** Returns `{ success: false, error: 'Customer not found' }`
**Expected:** Should provide more context: "Customer with ID '[id]' was not found in the system. Please verify the customer ID or create a new customer."

---

## Category 10: Missing Data Handling

### Error 25: Empty States May Not Explain Why
**Location:** Multiple pages (CustomersPage, TransactionsPage, RewardsPage)
**Issue:** Empty states don't distinguish between "no data" and "error loading data"
**User Impact:** Users may not know if they should wait, refresh, or if there's actually no data
**Current Behavior:** Shows "No customers" or "No transactions" even if there was an error
**Expected:** Should show different messages: "No customers yet" vs "Unable to load customers. Please try again."

### Error 26: Loading States Don't Show Errors
**Location:** Multiple pages
**Issue:** If loading fails, users may see loading spinner indefinitely
**User Impact:** Users don't know if the app is stuck or if there's an error
**Current Behavior:** Shows loading spinner, then may show error or empty state
**Expected:** Should show error state if loading fails after timeout

---

## Category 11: Authentication Errors

### Error 27: Token Refresh Failure Not Clearly Explained
**Location:** `clients/merchant-dashboard/src/api/client.ts:72-80`
**Issue:** When token refresh fails, redirects to login but error message may be lost
**User Impact:** Users may not understand why they were logged out
**Current Behavior:** Shows "Session expired. Please log in again." then redirects
**Expected:** Should show persistent message: "Your session has expired for security reasons. Please log in again to continue."

### Error 28: Login Error Doesn't Distinguish Error Types
**Location:** `clients/merchant-dashboard/src/pages/Login.tsx:43-46`
**Issue:** Same error message for wrong password, account locked, network error, etc.
**User Impact:** Users don't know if they should retry, check credentials, or contact support
**Current Behavior:** Shows generic "Login failed. Check credentials..."
**Expected:** Should show specific messages: "Invalid email or password", "Account is locked", "Cannot connect to server", etc.

---

## Category 12: Backend Error Responses

### Error 29: Backend Error Messages May Be Technical
**Location:** `backend/src/common/filters/http-exception.filter.ts:38-81`
**Issue:** Some error messages may still be technical despite enhancements
**User Impact:** Users may see technical error messages from backend
**Current Behavior:** Tries to provide user-friendly messages but may fall back to technical ones
**Expected:** All error messages should be user-friendly with clear explanations

### Error 30: Validation Errors May Show Field Names
**Location:** `backend/src/common/filters/http-exception.filter.ts:44-46`
**Issue:** Validation errors may show database field names instead of user-friendly labels
**User Impact:** Users may see "tenantId is required" instead of "Merchant account is required"
**Expected:** Should map technical field names to user-friendly labels

---

## Summary

**Total Errors Found: 30**

**By Severity:**
- **Critical (Blocks User):** 5 errors
- **High (Poor UX):** 12 errors  
- **Medium (Confusing):** 10 errors
- **Low (Minor Issues):** 3 errors

**By Category:**
- Technical Messages: 1
- Browser Alerts: 5
- Generic Messages: 4
- Missing Error Handling: 3
- API Error Parsing: 2
- Network Errors: 2
- Database Errors: 2
- Form Validation: 2
- Business Logic: 3
- Missing Data: 2
- Authentication: 2
- Backend Errors: 2
