import configureOpenAPI from "../configure-open-api";
import createApp from "./libs/create-app";
import authRouter from "./routes/authRoute";
import propertiesRouter from "./routes/propertyRoute";
import bookingRouter from "./routes/bookingRoute";
import reviewsRouter from "./routes/reviewAuth";
import messagesRouter from "./routes/messagesAuth";
import favoritesRouter from "./routes/favoriteRoutes";
import notificationsRouter from "./routes/notificationsAuth";
import userRouter from "./routes/userRoute";
import propertyImageRouter from "./routes/propertyImagesRoute";
import propertyDetailRouter from "./routes/propertyDetailsRoute";
import studentProfileRouter from "./routes/studentProfilesRoute";

const app = createApp();

configureOpenAPI(app);

const routes = [
  { path: "/api/auth", router: authRouter },
  { path: "/api/users", router: userRouter },
  { path: "/api/student-profiles", router: studentProfileRouter },
  { path: "/api/properties", router: propertiesRouter },
  { path: "/api/property-details", router: propertyDetailRouter },
  { path: "/api/property-images", router: propertyImageRouter },
  { path: "/api/bookings", router: bookingRouter },
  { path: "/api/reviews", router: reviewsRouter },
  { path: "/api/messages", router: messagesRouter },
  { path: "/api/favorites", router: favoritesRouter },
  { path: "/api/notifications", router: notificationsRouter },
] as const;

routes.forEach((route) => {
  app.route("/api", route);  // Add '/api' prefix
});
export type AppType = typeof routes[number]['router'];
export default app;