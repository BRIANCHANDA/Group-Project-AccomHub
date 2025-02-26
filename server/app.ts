// src/app.ts
import configureOpenAPI from "../configure-open-api";
import createApp from "./libs/create-app";
import authRouter from "./routes/authRoute";
import  propertiesRouter  from "./routes/propertyRoute";
import bookingRouter from "./routes/bookingRoute";
import  reviewsRouter  from "./routes/reviewAuth";
import  messagesRouter  from "./routes/messagesAuth";
import  favoritesRouter  from "./routes/favoriteRoutes";
import  notificationsRouter  from "./routes/notificationsAuth";
import userRouter from "./routes/userRoute";
import propertyImageRouter from "./routes/propertyImagesRoute";
import propertyDetailRouter from "./routes/propertyDetailsRoute";
import studentProfileRouter from "./routes/studentProfilesRoute";


const app = createApp();

configureOpenAPI(app);

const routes = [
  authRouter,
  userRouter,
  studentProfileRouter,
  propertiesRouter,
  propertyDetailRouter,
  propertyImageRouter,
  bookingRouter,
  reviewsRouter,
  messagesRouter,
  favoritesRouter,
  notificationsRouter,

  
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];
export default app;