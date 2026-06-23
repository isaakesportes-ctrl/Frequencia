import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } =
    options ?? {};
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const requestAccessMutation = trpc.auth.requestAccess.useMutation();

  useEffect(() => {
    if (meQuery.isSuccess) {
      setUser(meQuery.data);
    }
    setLoading(meQuery.isLoading);
    if (meQuery.error) {
      setError(meQuery.error as unknown as Error);
    }
  }, [meQuery.isSuccess, meQuery.data, meQuery.isLoading, meQuery.error]);

  const getTargetRedirectPath = useCallback(() => {
    if (redirectPath) return redirectPath;
    return "/";
  }, [redirectPath]);

  const login = useCallback(async (name: string, password: string) => {
    try {
      setError(null);
      const result = await loginMutation.mutateAsync({ name, password });
      if (!result.success) {
        throw new Error((result as any).error || "Falha no login");
      }
      setUser(result.user);
      await meQuery.refetch();
    } catch (err) {
      setError(err as unknown as Error);
      throw err;
    }
  }, [loginMutation, meQuery]);

  const requestAccess = useCallback(async (name: string, password: string, role: "user" | "admin" | "monitor" | "aprendiz", func: string) => {
    try {
      setError(null);
      const result = await requestAccessMutation.mutateAsync({ name, password, role, function: func });
      if (!result.success) {
        throw new Error((result as any).error || "Falha na solicitação de acesso");
      }
      return result;
    } catch (err) {
      setError(err as unknown as Error);
      throw err;
    }
  }, [requestAccessMutation]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      setError(err as unknown as Error);
      throw err;
    }
  }, [logoutMutation]);

  const state = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
  }), [user, loading, error]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    
    const target = getTargetRedirectPath();
    if (window.location.pathname === target) return;

    window.location.href = target;
  }, [redirectOnUnauthenticated, getTargetRedirectPath, loading, state.user]);

  return {
    ...state,
    login,
    logout,
    requestAccess,
    requestAccessLoading: requestAccessMutation.isPending,
  };
}
