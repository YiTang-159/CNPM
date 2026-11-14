# UI inventory — static source review (15/11/2026)

**IMPORTANT:** This inventory lists routes and local JSX tags found in source. Shared Header/Footer, nested components, modals, conditional buttons, dynamic lists, dropdown options and runtime controls require browser instrumentation. No item is marked OK without end-to-end testing.

| Route | Role | Component | Direct controls detected | Controls (source-derived) | Status |
|---|---|---|---:|---|---|
| /features | guest/user | `web/src/pages/Features.jsx` | 1 | Link:/demo | Chưa chạy E2E |
| /demo | guest/user | `web/src/pages/Demo.jsx` | 12 | input:input, Link:/login, select:input, input:input, button:action, button:action, button:action, button:action, button:action, button:action, button:action, select:input | Chưa chạy E2E |
| /pricing | guest/user | `web/src/pages/Pricing.jsx` | 7 | input:input, input:input, button:action, button:action, button:action, button:action, Link:/register | Chưa chạy E2E |
| /about | guest/user | `web/src/pages/About.jsx` | 1 | Link:/demo | Chưa chạy E2E |
| /faq | guest/user | `web/src/pages/Faq.jsx` | 1 | Link:/contact | Chưa chạy E2E |
| /contact | guest/user | `web/src/pages/Contact.jsx` | 6 | form:action, input:input, input:input, textarea:input, button:action, a:mailto:${CONTACT_EMAIL | Chưa chạy E2E |
| /login | guest/user | `web/src/pages/Login.jsx` | 4 | form:action, input:input, button:action, Link:/register | Chưa chạy E2E |
| /register | guest/user | `web/src/pages/Register.jsx` | 7 | form:action, input:input, input:input, input:input, Link:/terms, button:action, Link:/login | Chưa chạy E2E |
| /account | guest/user | `CustomerAccountRoute` | 0 |  | Chưa chạy E2E |
| /guest | guest/user | `web/src/pages/Guest.jsx` | 4 | button:action, Link:/demo, Link:/features, Link:/register | Chưa chạy E2E |
| /terms | guest/user | `Terms` | 0 |  | Chưa chạy E2E |
| /privacy | guest/user | `Privacy` | 0 |  | Chưa chạy E2E |
| /* | guest/user | `web/src/pages/NotFound.jsx` | 1 | Link:/ | Chưa chạy E2E |
| /admin/dashboard | admin | `web/src/pages/AdminDashboard.jsx` | 17 | Link:to, Link:/admin/queue, button:action, Link:/admin/queue, Link:to, Link:/admin/users, Link:/admin/pricing, Link:/admin/orders, Link:/admin/payments, Link:/admin/videos, Link:/admin/queue, Link:/admin/feedback, Link:/admin/videos, Link:/admin/orders?status=pending, Link:/admin/queue, Link:/admin/feedback, Link:/admin/orders | Chưa chạy E2E |
| /admin/queue | admin | `web/src/pages/AdminQueue.jsx` | 6 | button:action, Link:type.href, Link:/admin/narrations?status=reviewing, Link:/admin/subtitles?status=reviewing, Link:type.href, Link:task.href | Chưa chạy E2E |
| /admin/users | admin | `web/src/pages/AdminUsers.jsx` | 13 | button:action, button:action, input:input, select:input, select:input, button:action, button:action, button:action, button:action, button:action, button:action, button:action, button:input | Chưa chạy E2E |
| /admin/videos | admin | `web/src/pages/AdminVideo.jsx` | 15 | button:action, input:input, select:input, Link:adminHref('/admin/users',{email:v.userEmail, select:input, button:action, button:action, button:action, button:action, Link:/admin/narrations?videoId=${v.id, Link:/admin/subtitles?videoId=${v.id, button:action, button:action, Link:adminHref('/admin/subtitles',{videoId:v.id, Link:adminHref('/admin/narrations',{videoId:v.id | Chưa chạy E2E |
| /admin/languages | admin | `web/src/pages/AdminLanguages.jsx` | 14 | form:action, input:input, input:input, input:input, button:action, input:input, select:input, button:action, input:input, input:input, select:input, button:action, button:action, button:action | Chưa chạy E2E |
| /admin/narrations | admin | `web/src/pages/AdminMediaResults.jsx` | 14 | Link:isSubtitle ? adminHref('/admin/narrations',{videoId:params, button:action, input:input, select:input, select:input, Link:adminHref('/admin/videos',{videoId:row.videoId, Link:adminHref('/admin/users',{email:row.userEmail, button:action, select:input, select:input, button:action, button:action, select:input, button:action | Chưa chạy E2E |
| /admin/subtitles | admin | `web/src/pages/AdminMediaResults.jsx` | 14 | Link:isSubtitle ? adminHref('/admin/narrations',{videoId:params, button:action, input:input, select:input, select:input, Link:adminHref('/admin/videos',{videoId:row.videoId, Link:adminHref('/admin/users',{email:row.userEmail, button:action, select:input, select:input, button:action, button:action, select:input, button:action | Chưa chạy E2E |
| /admin/feedback | admin | `web/src/pages/AdminFeedback.jsx` | 10 | button:action, input:input, select:input, select:input, Link:adminHref('/admin/videos',{videoId:item.videoId, select:input, select:input, textarea:input, button:action, button:action | Chưa chạy E2E |
| /admin/orders | admin | `web/src/pages/AdminOrders.jsx` | 12 | Link:/admin/payments, button:action, form:action, input:input, button:action, button:action, input:input, select:input, button:action, Link:adminHref('/admin/payments',{orderId:row.id, button:action, button:input | Chưa chạy E2E |
| /admin/payments | admin | `web/src/pages/AdminPayments.jsx` | 6 | Link:/admin/orders, button:action, input:input, select:input, button:action, Link:adminHref('/admin/orders',{orderId:row.id | Chưa chạy E2E |
| /admin/pricing | admin | `web/src/pages/AdminPricing.jsx` | 5 | Link:/admin/orders, select:input, Link:/admin/orders, button:action, button:action | Chưa chạy E2E |
| /admin/audit | admin | `web/src/pages/AdminAudit.jsx` | 3 | button:action, input:input, select:input | Chưa chạy E2E |
| /admin/profile | admin | `web/src/pages/AdminProfile.jsx` | 7 | Link:/admin/dashboard, form:action, input:input, input:input, button:action, form:action, button:action | Chưa chạy E2E |
| /admin/qr | admin | `web/src/pages/AdminQr.jsx` | 6 | button:action, button:action, button:action, button:action, button:action, button:action | Chưa chạy E2E |

## Shared/navigation components

- `web/src/components/Header.jsx`: logo, navigation, language picker, authentication controls, admin preview menu
- `web/src/components/Footer.jsx`: product/company/legal navigation, contact email
- `web/src/components/AdminLayout.jsx`: admin sidebar, search/jump (Ctrl+K), dropdown/avatar, language switch, protected route
- `web/src/components/Checkout.jsx`: payment actions, status and errors
- `web/src/components/AdminAccountMenu.jsx`: account menu and logout

## Required next pass
Instrument Playwright route traversal with guest, customer, admin, include nested controls and modal flows, assert 404/5xx/console/keyboard/tab order. Do not assume static counting proves behavior.
