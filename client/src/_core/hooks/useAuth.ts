import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
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

    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(activeUser)
    );
    return {
      user: activeUser ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(activeUser),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

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
