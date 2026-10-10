import { QueryClient } from "@tanstack/react-query";

// Única instancia de QueryClient para todos los microfrontends.
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
