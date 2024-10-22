// Role-Based Access Control (RBAC) middleware
export const verifyRole = (requiredRole) => {
    return (req, res, next) => {
        console.log(`Checking access for user: ${req.user.uid}, role: ${req.user.role}, required role: ${requiredRole}`);

        if (req.user && req.user.role === requiredRole) {
            console.log(`Access granted for user: ${req.user.uid}, role: ${req.user.role}`);
            next(); // User has the required role, proceed to the next middleware or route
        } else {
            console.error(`Access denied for user: ${req.user.uid}, role: ${req.user.role}`);
            res.status(403).json({ error: 'Forbidden: You do not have access to this resource.' });
        }
    };
};

// You can still have verifyRoles as a named export
export const verifyRoles = (requiredRoles) => {
    return (req, res, next) => {
        console.log(`Checking access for user: ${req.user.uid}, role: ${req.user.role}, required roles: ${requiredRoles.join(', ')}`);

        if (req.user && requiredRoles.includes(req.user.role)) {
            console.log(`Access granted for user: ${req.user.uid}, role: ${req.user.role}`);
            next(); // User has one of the required roles, proceed
        } else {
            console.error(`Access denied for user: ${req.user.uid}, role: ${req.user.role}`);
            res.status(403).json({ error: 'Forbidden: You do not have access to this resource.' });
        }
    };
};
