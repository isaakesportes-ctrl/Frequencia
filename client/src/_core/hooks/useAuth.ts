import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // #region debug-point A:use-auth-init
  (()=>{
    const u = "http://127.0.0.1:7777/event";
    const s = "login-render-hooks-error";
    fetch(u, {
      method: "POST",
      body: JSON.stringify({
        sessionId: s,
        runId: "pre",
        hypothesisId: "A",
        location: "useAuth.ts:13",
        msg: "[DEBUG] useAuth hook called",
        data: { options },
        ts: Date.now()
      })
    }).catch(()=>{});
  })();
  // #endregion

  const { redirectOnUnauthenticated = false, redirectPath } =
    options ?? {};
  const utils = trpc.useUtils();

  const getTargetRedirectPath = useCallback(() => {
    if (redirectPath) return redirectPath;
    
    // Redirect to the new Login Page instead of directly to the auth endpoint
    return "/";
  }, [redirectPath]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      window.location.href = "/";
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const activeUser = meQuery.data;

    const result = {
      user: activeUser ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(activeUser),
    };
    
    // #region debug-point B:use-auth-state
    (()=>{
      const u = "http://127.0.0.1:7777/event";
      const s = "login-render-hooks-error";
      fetch(u, {
        method: "POST",
        body: JSON.stringify({
          sessionId: s,
          runId: "pre",
          hypothesisId: "B",
          location: "useAuth.ts:58",
          msg: "[DEBUG] useAuth state updated",
          data: { result },
          ts: Date.now()
        })
      }).catch(()=>{});
    })();
    // #endregion

    return result;
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // Move o efeito colateral para useEffect
  useEffect(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
  }, [meQuery.data]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    
    const target = getTargetRedirectPath();
    if (window.location.pathname === target) return;

    console.log("[Auth] Redirecting to:", target);
    window.location.href = target;
  }, [
    redirectOnUnauthenticated,
    getTargetRedirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  const login = useCallback(() => {
    const target = getTargetRedirectPath();
    console.log("[Auth] Login clicked, redirecting to:", target);
    window.location.href = target;
  }, [getTargetRedirectPath]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    login,
  };
}
