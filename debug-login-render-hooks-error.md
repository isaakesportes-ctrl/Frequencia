# Debug Session: login-render-hooks-error

## Description
User reports a React error #418 ("Rendered more hooks than during previous render") when clicking "Entrar no Sistema" button in the login flow.

## Status
[OPEN]

## Hypotheses
1. **Conditional Hook Execution**: A component is calling hooks inside conditional statements, loops, or after early returns, leading to different numbers of hooks on subsequent renders.
2. **Auth State Transition**: The transition from unauthenticated to authenticated state causes a component tree change that leads to inconsistent hook calls.
3. **DashboardLayout Early Return**: The `if (loading) return null` in DashboardLayout is causing hooks in DashboardLayoutContent to be called inconsistently.
4. **ProtectedRoute Re-renders**: The ProtectedRoute component is re-rendering with different hook call sequences when user state changes.
5. **Mock User Upsert Race Condition**: The server's mock user upsert is causing a race condition where the client receives inconsistent auth state on initial load.

## Logs
- [ ] Pre-fix logs collected
- [ ] Post-fix logs collected

## Timeline
- 2026-06-16: Debug session initialized
