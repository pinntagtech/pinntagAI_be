/**
 * Example Protected Routes
 *
 * This file demonstrates how to use the JWT authentication middleware
 * in your actual route handlers.
 *
 * You can copy these patterns to your own route files.
 */

import { Router, Request, Response } from "express";
import {
  verifyPinntagJwt,
  optionalPinntagJwt,
  requireRole,
  requireBusinessAccess,
} from "../../middleware/jwtAuth.js";

const router = Router();

// ============================================================================
// PUBLIC ROUTE (No authentication required)
// ============================================================================

router.get("/api/public/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Public endpoint - no authentication required",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// PROTECTED ROUTE (Authentication required)
// ============================================================================

router.get("/api/user/profile", verifyPinntagJwt, (req: Request, res: Response) => {
  // req.user is populated by the verifyPinntagJwt middleware
  res.json({
    success: true,
    user: {
      userId: req.user?.userId,
      email: req.user?.email,
      role: req.user?.role,
      businessId: req.user?.businessId,
    },
  });
});

// ============================================================================
// OPTIONAL AUTHENTICATION (Different behavior based on auth)
// ============================================================================

router.get("/api/content/featured", optionalPinntagJwt, (req: Request, res: Response) => {
  const isAuthenticated = !!req.user;

  if (isAuthenticated) {
    // Return personalized content for authenticated users
    res.json({
      success: true,
      message: "Personalized content",
      userId: req.user?.userId,
      content: [
        { id: 1, title: "Recommended for you", type: "personalized" },
        { id: 2, title: "Based on your preferences", type: "personalized" },
      ],
    });
  } else {
    // Return generic content for unauthenticated users
    res.json({
      success: true,
      message: "Public content",
      content: [
        { id: 1, title: "Featured content", type: "public" },
        { id: 2, title: "Popular items", type: "public" },
      ],
    });
  }
});

// ============================================================================
// ADMIN ONLY ROUTE (Requires admin role)
// ============================================================================

router.get(
  "/api/admin/users",
  verifyPinntagJwt,
  requireRole("admin"),
  (req: Request, res: Response) => {
    // Only users with 'admin' role can access this
    res.json({
      success: true,
      message: "Admin access granted",
      users: [
        // Your users data
      ],
    });
  }
);

router.delete(
  "/api/admin/users/:userId",
  verifyPinntagJwt,
  requireRole("admin", "super-admin"),
  (req: Request, res: Response) => {
    // Only users with 'admin' or 'super-admin' role can access this
    const { userId } = req.params;

    res.json({
      success: true,
      message: `User ${userId} deleted successfully`,
    });
  }
);

// ============================================================================
// BUSINESS-SCOPED ROUTE (User must have access to the business)
// ============================================================================

router.get(
  "/api/business/:businessId/analytics",
  verifyPinntagJwt,
  requireBusinessAccess,
  (req: Request, res: Response) => {
    const { businessId } = req.params;

    // User has access to this business
    res.json({
      success: true,
      businessId,
      analytics: {
        views: 1234,
        clicks: 567,
        conversions: 89,
      },
    });
  }
);

router.put(
  "/api/business/:businessId/settings",
  verifyPinntagJwt,
  requireBusinessAccess,
  (req: Request, res: Response) => {
    const { businessId } = req.params;
    const settings = req.body;

    // Update business settings
    res.json({
      success: true,
      businessId,
      message: "Settings updated successfully",
    });
  }
);

// ============================================================================
// COMBINED AUTHORIZATION (Role + Business access)
// ============================================================================

router.delete(
  "/api/business/:businessId/data",
  verifyPinntagJwt,
  requireRole("admin", "owner"),
  requireBusinessAccess,
  (req: Request, res: Response) => {
    // User must:
    // 1. Be authenticated
    // 2. Have 'admin' or 'owner' role
    // 3. Have access to this specific business

    const { businessId } = req.params;

    res.json({
      success: true,
      message: "Data deleted successfully",
      businessId,
    });
  }
);

// ============================================================================
// CUSTOM AUTHORIZATION LOGIC
// ============================================================================

router.post(
  "/api/posts/:postId/edit",
  verifyPinntagJwt,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = req.user?.userId;

    // Custom logic: Check if user is the post owner or an admin
    // (In real app, you'd fetch the post from the database)
    const post = { authorId: "user123", title: "Sample Post" }; // Mock data

    const isAuthor = post.authorId === userId;
    const isAdmin = req.user?.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own posts",
      });
    }

    // User is authorized
    res.json({
      success: true,
      message: "Post updated successfully",
      postId,
    });
  }
);

// ============================================================================
// ERROR HANDLING EXAMPLE
// ============================================================================

router.get(
  "/api/secure/data",
  verifyPinntagJwt,
  async (req: Request, res: Response) => {
    try {
      // Your business logic here
      const data = await fetchSecureData(req.user?.userId);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Failed to fetch data",
        message: error.message,
      });
    }
  }
);

// Mock function for the example
async function fetchSecureData(userId: string | undefined) {
  return { userId, data: "secure data here" };
}

// ============================================================================
// EXPORT
// ============================================================================

export default router;

/**
 * HOW TO USE THIS IN YOUR APP:
 *
 * 1. Import the router in your main app file (e.g., index.ts or app.ts):
 *
 *    import exampleRoutes from './api/routes/example.protected.routes.js';
 *    app.use(exampleRoutes);
 *
 * 2. Test the routes:
 *
 *    # Public route (no auth)
 *    curl http://localhost:4001/api/public/health
 *
 *    # Protected route (requires auth)
 *    curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *         http://localhost:4001/api/user/profile
 *
 *    # Admin route (requires admin role)
 *    curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *         http://localhost:4001/api/admin/users
 *
 * 3. Get a test token by running:
 *    node test_jwt_service.cjs
 */
