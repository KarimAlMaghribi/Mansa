/**
 * Temporarily disables authentication checks so that development can
 * continue without implementing login. This wrapper now simply renders
 * the given children. Once authentication is ready, restore the previous
 * logic to enforce protected routes.
 */

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return children;
};
