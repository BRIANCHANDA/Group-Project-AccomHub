import configureOpenAPI from "../configure-open-api";

import createApp from "./libs/create-app";
import authRouter from "./routes/authRoute";
import propertiesRouter from "./routes/propertyRoute";

import reviewsRouter from "./routes/reviewAuth";
import messagesRouter from "./routes/messagesAuth";

import userRouter from "./routes/userRoute";
import propertyImageRouter from "./routes/propertyImagesRoute";
import propertyDetailRouter from "./routes/propertyDetailsRoute";

import propertyListing from "./routes/PropertyListingRoute";

import propertyDetails from './routes/details';


const app = createApp();

configureOpenAPI(app);

const routes = [
  { path: "/api/auth", router: authRouter },
  { path: "/api/users", router: userRouter },
 
  { path: "/api/properties", router: propertiesRouter },
  { path: "/api/property-details", router: propertyDetailRouter },
  { path: "/api/property-images", router: propertyImageRouter },
 
  { path: "/api/reviews", router: reviewsRouter },
  { path: "/api/messages", router: messagesRouter },
 

  { path: "/api/PropertyListingRoute", router: propertyListing},
  {path: "/api/details", router: propertyDetails}
] as const;

routes.forEach(({ path, router }) => {
  app.route(path, router);
});

export type AppType = typeof routes[number]['router'];
export default app;