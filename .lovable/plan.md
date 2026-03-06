

## Plan: Merge Privacy & Return Policies into One Dialog with Single Checkbox

### Overview
Combine both policies into a single dialog with both sections, and replace the two separate checkboxes with one checkbox: "I have read and agree to the Privacy Policy and Return & Refund Policy". This change applies to both `Index.tsx` and `ActivateWarranty.tsx`.

---

### Changes

#### 1. `src/pages/Index.tsx`

- **Remove** `showReturnDialog` and `returnAgreed` state variables. Keep only `showPolicyDialog` (renamed from `showPrivacyDialog`) and `policiesAgreed` (renamed from `privacyAgreed`).
- **Merge the two cards** into a single "Terms & Policies" card that opens one dialog.
- **Merge both dialogs** into one dialog titled "IGNIS Innovation — Terms & Policies" containing both the Privacy Policy and Return & Refund Policy sections, with a single checkbox at the bottom: "I have read and agree to the Privacy Policy and Return & Refund Policy".
- **Update Link state** to pass `policiesAgreed` instead of separate `privacyAgreed` and `returnAgreed`.

#### 2. `src/pages/ActivateWarranty.tsx`

- **Remove** `returnAgreed`, `showReturnDialog` state. Replace `privacyAgreed` with `policiesAgreed`.
- **Update initial state** from location to read `policiesAgreed` instead of two separate values.
- **Replace the two policy cards** with a single "Terms & Policies" card.
- **Merge both dialogs** into one combined dialog with single checkbox.
- **Update `bothPoliciesAgreed`** to just use `policiesAgreed`.
- **Update `handleSubmit`** validation to check `policiesAgreed` instead of both separately.

